import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

const transactionLabelMap = {
  VENDA: "Venda",
  DOACAO: "Doação",
  EMPRESTIMO: "Empréstimo",
} as const;

const conditionLabelMap = {
  NOVO: "Novo",
  SEMINOVO: "Seminovo",
  USADO: "Usado",
} as const;

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const cartItems = await prisma.carrinhoItem.findMany({
    where: { usuario_id: session.usuario_id },
    include: {
      item: {
        include: {
          imagens: {
            orderBy: { ordem: "asc" },
            take: 1,
          },
          usuario: {
            select: {
              reputacao_media: true,
              reputacao_count: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const formatted = cartItems
    .map((entry) => {
      const item = entry.item;

      if (!item) {
        return null;
      }

      const transactionLabel =
        transactionLabelMap[item.tipo_transacao as keyof typeof transactionLabelMap] ?? "Venda";

      const condition =
        conditionLabelMap[item.estado_conservacao as keyof typeof conditionLabelMap] ?? "Novo";

      const price =
        item.tipo_transacao === "VENDA"
          ? item.preco_formatado ??
            (item.preco_centavos != null ? formatCurrency(item.preco_centavos) : null)
          : null;

      const days = item.tipo_transacao === "EMPRESTIMO" ? item.prazo_dias ?? null : null;

      return {
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao ?? "Descrição não informada.",
        tipo: transactionLabel,
        estado: condition,
        preco: price,
        dias: days ?? undefined,
        interested: entry.interested_flag ?? false,
        quantidade: entry.quantidade ?? 1,
        rating: item.usuario?.reputacao_media ?? undefined,
        reviews: item.usuario?.reputacao_count ?? undefined,
        imagem: item.imagens?.[0]?.url ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ items: formatted }, { status: 200 });
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const itemId = params.id;

  if (!itemId) {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      usuario_id: true,
      status: true,
      tipo_transacao: true,
      prazo_dias: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Anúncio não encontrado." },
      { status: 404 },
    );
  }

  if (item.usuario_id === session.usuario_id) {
    return NextResponse.json(
      { error: "Você não pode adicionar o próprio anúncio ao carrinho." },
      { status: 400 },
    );
  }

  if (item.status !== "PUBLICADO") {
    return NextResponse.json(
      { error: "Este anúncio não está disponível para adição ao carrinho." },
      { status: 400 },
    );
  }

  try {
    const now = new Date();

    await prisma.carrinhoItem.upsert({
      where: {
        usuario_id_anuncio_id: {
          usuario_id: session.usuario_id,
          anuncio_id: itemId,
        },
      },
      create: {
        usuario_id: session.usuario_id,
        anuncio_id: itemId,
        quantidade: 1,
        interested_flag: false,
        prazo_snapshot: item.tipo_transacao === "EMPRESTIMO" ? item.prazo_dias ?? null : null,
        created_at: now,
        updated_at: now,
      },
      update: {
        updated_at: now,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Não foi possível associar o item ao carrinho." },
          { status: 400 },
        );
      }
    }

    console.error("Erro ao adicionar item ao carrinho", error);
    return NextResponse.json(
      { error: "Não foi possível adicionar o item ao carrinho." },
      { status: 500 },
    );
  }

  return NextResponse.json({ inCart: true }, { status: 200 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const itemId = params.id;

  if (!itemId) {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  try {
    await prisma.carrinhoItem.delete({
      where: {
        usuario_id_anuncio_id: {
          usuario_id: session.usuario_id,
          anuncio_id: itemId,
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ inCart: false }, { status: 200 });
      }
    }

    console.error("Erro ao remover item do carrinho", error);
    return NextResponse.json(
      { error: "Não foi possível remover o item do carrinho." },
      { status: 500 },
    );
  }

  return NextResponse.json({ inCart: false }, { status: 200 });
}