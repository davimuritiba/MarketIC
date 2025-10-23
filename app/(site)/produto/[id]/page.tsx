import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ProdutoPageClient, {
  type ProductData,
  type TransactionType,
  type ConditionType,
} from "./produto-content";

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export default async function ProdutoPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      categoria: true,
      imagens: {
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!item) {
    notFound();
  }

  const isSale = item.tipo_transacao === "VENDA";
  const formattedPrice = isSale
    ? item.preco_formatado ??
      (item.preco_centavos != null
        ? formatCurrency(item.preco_centavos)
        : null)
    : null;

  const product: ProductData = {
    id: item.id,
    title: item.titulo,
    description: item.descricao,
    transactionType: item.tipo_transacao as TransactionType,
    condition: item.estado_conservacao as ConditionType,
    isSale,
    price: formattedPrice,
    quantity: item.quantidade_disponivel,
    images: (item.imagens || []).map((image) => ({
      id: image.id,
      url: image.url,
    })),
    categoryName: item.categoria?.nome ?? null,
  };

  return <ProdutoPageClient product={product} />;
}
