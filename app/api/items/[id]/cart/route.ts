import { NextResponse } from "next/server";

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
