import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

  const favorites = await prisma.favorito.findMany({
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

  const formatted = favorites
    .map((favorite) => {
      const item = favorite.item;
      if (!item) {
        return null;
      }

      const transactionLabel =
        transactionLabelMap[item.tipo_transacao as keyof typeof transactionLabelMap] ?? "Venda";

      const price =
        item.tipo_transacao === "VENDA"
          ? item.preco_formatado ??
            (item.preco_centavos != null ? formatCurrency(item.preco_centavos) : null)
          : null;

      const days = item.tipo_transacao === "EMPRESTIMO" ? item.prazo_dias ?? null : null;

      const condition =
        conditionLabelMap[item.estado_conservacao as keyof typeof conditionLabelMap] ?? null;

      const image = item.imagens?.[0]?.url ?? null;

      return {
        id: item.id,
        href: `/produto/${item.id}`,
        title: item.titulo,
        type: transactionLabel,
        price: price ?? undefined,
        days: days ?? undefined,
        condition: condition ?? undefined,
        rating: item.usuario?.reputacao_media ?? undefined,
        reviews: item.usuario?.reputacao_count ?? undefined,
        image: image ?? undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ favorites: formatted }, { status: 200 });
}

