import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DEFAULT_EXPIRATION_MONTHS } from "@/lib/item-status";
import type { EstadoConservacao, TipoTransacao } from "@prisma/client";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

/*Lógica de score “Recomendado”
Quando o front pede itens com ordenação “recomendado”, a API calcula um score somando quatro bônus: recência (anúncios novos ganham até +2), 
reputação do vendedor (média de avaliações mais um bônus que cresce com a contagem de reviews até +1), qualidade do anúncio (imagem principal, 
descrição longa e preço válido em vendas somam até +2,5) e engajamento (favoritos e interesses podem render até +3,5). 
Depois dessa soma, a lista é reordenada pelo score resultante; empates são desempates pela data de publicação mais recente.*/

function normalizeEnumValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
}

type SortOption = "recomendado" | "recentes" | "preco-asc" | "preco-desc" | "populares";

function computeRecencyBonus(publishedAt: Date | null | undefined) {
  if (!publishedAt) {
    return 0;
  }

  const now = new Date();
  const diffMs = now.getTime() - publishedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) {
    return 2;
  }

  if (diffDays <= 14) {
    return 1.5;
  }

  if (diffDays <= 30) {
    return 1;
  }

  if (diffDays <= 60) {
    return 0.5;
  }

  return 0;
}

function computeSellerScore(
  reputacaoMedia: number | null | undefined,
  reputacaoCount: number | null | undefined,
) {
  const baseScore = typeof reputacaoMedia === "number" ? reputacaoMedia : 0;
  const count = typeof reputacaoCount === "number" ? reputacaoCount : 0;
  const bonus = Math.min(1, count / 20);

  return baseScore + bonus;
}

function computeQualityBonus(
  hasImages: boolean,
  description?: string | null,
  precoCentavos?: number | null,
  tipo?: TipoTransacao,
) {
  let bonus = 0;

  if (hasImages) {
    bonus += 1;
  }

  if ((description?.trim().length ?? 0) > 120) {
    bonus += 1;
  }

  if (tipo === "VENDA" && typeof precoCentavos === "number") {
    if (precoCentavos > 0) {
      bonus += 0.5;
    }
  }

  return bonus;
}

function computeEngagementBonus(favorites: number, interests: number) {
  let bonus = 0;

  if (favorites > 0) {
    bonus += 1;
  }

  if (interests > 0) {
    bonus += 2;
  }

  if (interests >= 5) {
    bonus += 0.5;
  }

  return bonus;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const categoriaId = searchParams.get("categoriaId")?.trim() ?? "";
    const tipoParam = normalizeEnumValue(searchParams.get("tipo"));
    const estadoParam = normalizeEnumValue(searchParams.get("estado"));
    const precoParam = searchParams.get("preco")?.trim();
    const comFoto = searchParams.get("comFoto") === "true";

    const rawOrdenacao = searchParams.get("ordenacao")?.toLowerCase() ?? "recomendado";
    const allowedSorts: SortOption[] = [
      "recomendado",
      "recentes",
      "preco-asc",
      "preco-desc",
      "populares",
    ];
    const ordenacaoParam: SortOption = allowedSorts.includes(
      rawOrdenacao as SortOption,
    )
      ? (rawOrdenacao as SortOption)
      : "recomendado";

    const where: Prisma.ItemWhereInput = {};

    where.status = "PUBLICADO";

    if (q) {
      where.OR = [
        { titulo: { contains: q, mode: "insensitive" } },
        { descricao: { contains: q, mode: "insensitive" } },
      ];
    }

    if (categoriaId) {
      where.categoria_id = categoriaId;
    }

    if (tipoParam && ["VENDA", "EMPRESTIMO", "DOACAO"].includes(tipoParam)) {
      where.tipo_transacao = tipoParam as TipoTransacao;
    }

    if (
      estadoParam &&
      ["NOVO", "SEMINOVO", "USADO"].includes(estadoParam)
    ) {
      where.estado_conservacao = estadoParam as EstadoConservacao;
    }

    if (precoParam) {
      const precoFilter: Prisma.IntNullableFilter = { not: null };

      if (precoParam === "0-50") {
        precoFilter.lte = 50 * 100;
      } else if (precoParam === "50-100") {
        precoFilter.gte = 50 * 100;
        precoFilter.lte = 100 * 100;
      } else if (precoParam === "100+") {
        precoFilter.gte = 100 * 100;
      } else {
        delete precoFilter.not;
      }

      if (Object.keys(precoFilter).length > 0) {
        where.preco_centavos = precoFilter;
      }
    }

    if (comFoto) {
      where.imagens = { some: {} };
    }

    const include = {
      categoria: true,
      usuario: {
        select: {
          id: true,
          nome: true,
          reputacao_media: true,
          reputacao_count: true,
        },
      },
      imagens: {
        orderBy: { ordem: "asc" },
        take: 1,
      },
      avaliacoes: {
        select: { nota: true },
      },
      _count: {
        select: {
          favoritos: true,
          interesses: true,
        },
      },
    } satisfies Prisma.ItemInclude;

    const items = await prisma.item.findMany({
      where,
      include,
      orderBy:
        ordenacaoParam === "recentes"
          ? { publicado_em: "desc" }
          : ordenacaoParam === "preco-asc"
          ? [
              { preco_centavos: "asc" },
              { publicado_em: "desc" },
            ]
          : ordenacaoParam === "preco-desc"
          ? [
              { preco_centavos: "desc" },
              { publicado_em: "desc" },
            ]
          : { publicado_em: "desc" },
    });

    let sorted = [...items];

    if (ordenacaoParam === "recomendado") {
      const scored = items.map((item) => {
        const score =
          computeRecencyBonus(item.publicado_em) +
          computeSellerScore(
            item.usuario?.reputacao_media,
            item.usuario?.reputacao_count,
          ) +
          computeQualityBonus(
            (item.imagens?.length ?? 0) > 0,
            item.descricao,
            item.preco_centavos,
            item.tipo_transacao,
          ) +
          computeEngagementBonus(
            item._count?.favoritos ?? 0,
            item._count?.interesses ?? 0,
          );

        return { item, score };
      });

      scored.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        const dateA = a.item.publicado_em ?? a.item.created_at;
        const dateB = b.item.publicado_em ?? b.item.created_at;

        return dateB.getTime() - dateA.getTime();
      });

      sorted = scored.map(({ item }) => item);
    } else if (ordenacaoParam === "preco-asc" || ordenacaoParam === "preco-desc") {
      sorted.sort((a, b) => {
        const priceA = typeof a.preco_centavos === "number" ? a.preco_centavos : null;
        const priceB = typeof b.preco_centavos === "number" ? b.preco_centavos : null;

        if (priceA === null && priceB === null) {
          return 0;
        }

        if (priceA === null) {
          return 1;
        }

        if (priceB === null) {
          return -1;
        }

        return ordenacaoParam === "preco-asc"
          ? priceA - priceB
          : priceB - priceA;
      });
    } else if (ordenacaoParam === "populares") {
      sorted.sort((a, b) => {
        const engagementsA =
          (a._count?.favoritos ?? 0) +
          (a._count?.interesses ?? 0) * 2;
        const engagementsB =
          (b._count?.favoritos ?? 0) +
          (b._count?.interesses ?? 0) * 2;

        if (engagementsB !== engagementsA) {
          return engagementsB - engagementsA;
        }

        const dateA = a.publicado_em ?? a.created_at;
        const dateB = b.publicado_em ?? b.created_at;

        return dateB.getTime() - dateA.getTime();
      });
    }

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Erro ao listar itens:", error);
    return NextResponse.json(
      { error: "Erro ao listar itens" },
      { status: 500 }
    );
  }
}

// POST /api/items
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Sessão inválida ou expirada.", { status: 401 });
    }

    const body = await req.json();

    const {
      titulo,
      descricao,
      tipo_transacao, // "VENDA" | "EMPRESTIMO" | "DOACAO"
      estado_conservacao, // "NOVO" | "SEMINOVO" | "USADO"
      preco_centavos, // number | null (em centavos)
      preco_formatado, // string | null (opcional)
      categoria_nome,
      quantidade_disponivel,
      imagens: imagensInput,
      prazo_dias,
    } = body;

    const tipoTransacaoNormalizado =
      typeof tipo_transacao === "string" ? tipo_transacao.toUpperCase() : "";
    const estadoConservacaoNormalizado =
      typeof estado_conservacao === "string"
        ? estado_conservacao.toUpperCase()
        : "";

    const validTransactionTypes: TipoTransacao[] = [
      "VENDA",
      "DOACAO",
      "EMPRESTIMO",
    ];
    const validConditions: EstadoConservacao[] = [
      "NOVO",
      "SEMINOVO",
      "USADO",
    ];

    // validações essenciais
    if (!titulo?.trim()) {
      return new NextResponse("Título é obrigatório.", { status: 400 });
    }
    if (
      !tipoTransacaoNormalizado ||
      !validTransactionTypes.includes(
        tipoTransacaoNormalizado as TipoTransacao,
      )
    ) {
      return new NextResponse("Tipo de transação é obrigatório.", { status: 400 });
    }
    const categoriaNomeNormalizado = categoria_nome?.trim();

    if (!categoriaNomeNormalizado) {
      return new NextResponse("Categoria é obrigatória.", { status: 400 });
    }
    if (
      !estadoConservacaoNormalizado ||
      !validConditions.includes(estadoConservacaoNormalizado as EstadoConservacao)
    ) {
      return new NextResponse("Estado de conservação é obrigatório.", {
        status: 400,
      });
    }
    if (tipoTransacaoNormalizado === "VENDA") {
      if (preco_centavos == null || preco_centavos < 0) {
        return new NextResponse("Preço inválido.", { status: 400 });
      }
    }

    let quantidadeNormalizada: number | null = null;

    if (typeof quantidade_disponivel === "number") {
      quantidadeNormalizada = quantidade_disponivel;
    } else if (typeof quantidade_disponivel === "string" && quantidade_disponivel.trim()) {
      quantidadeNormalizada = Number.parseInt(quantidade_disponivel, 10);
    }

    if (quantidadeNormalizada == null) {
      return new NextResponse("Quantidade deve ser um inteiro positivo.", { status: 400 });
    }

    if (
      !Number.isFinite(quantidadeNormalizada) ||
      quantidadeNormalizada < 1 ||
      !Number.isInteger(quantidadeNormalizada)
    ) {
      return new NextResponse("Quantidade deve ser um inteiro positivo.", { status: 400 });
    }

    const imagensArray = Array.isArray(imagensInput) ? imagensInput : [];
    const imagens = imagensArray
      .map((imagem) => (typeof imagem === "string" ? imagem.trim() : ""))
      .filter((imagem) => imagem.length > 0);

    if (!imagens.length) {
      return new NextResponse("Pelo menos uma imagem é obrigatória.", {
        status: 400,
      });
    }

    let prazoDiasNormalizado: number | null = null;

    if (tipoTransacaoNormalizado === "EMPRESTIMO") {
      const parsedPrazo =
        typeof prazo_dias === "number"
          ? prazo_dias
          : typeof prazo_dias === "string" && prazo_dias.trim()
          ? Number.parseInt(prazo_dias, 10)
          : NaN;

      if (!Number.isFinite(parsedPrazo) || parsedPrazo < 1 || parsedPrazo > 365) {
        return new NextResponse(
          "Prazo do empréstimo deve ser um número entre 1 e 365 dias.",
          { status: 400 },
        );
      }

      prazoDiasNormalizado = Math.trunc(parsedPrazo);
    }

    const categoria = await prisma.categoria.findFirst({
      where: {
        nome: {
          equals: categoriaNomeNormalizado,
          mode: "insensitive",
        },
      },
    });

    if (!categoria) {
      return new NextResponse("Categoria inválida.", { status: 400 });
    }

    const publishedAt = new Date();
    const expirationDate = new Date(publishedAt);
    expirationDate.setMonth(
      expirationDate.getMonth() + DEFAULT_EXPIRATION_MONTHS,
    );

    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.item.create({
        data: {
          titulo: titulo.trim(),
          descricao: descricao?.trim() || null,
          tipo_transacao: tipoTransacaoNormalizado as TipoTransacao,
          estado_conservacao: estadoConservacaoNormalizado as EstadoConservacao,
          preco_centavos:
            tipoTransacaoNormalizado === "VENDA" ? preco_centavos : null,
          preco_formatado: preco_formatado || null,
          usuario_id: session.usuario_id,
          categoria_id: categoria.id,
          quantidade_disponivel: quantidadeNormalizada,
          publicado_em: publishedAt,
          expira_em: expirationDate,
          prazo_dias:
            tipoTransacaoNormalizado === "EMPRESTIMO"
              ? prazoDiasNormalizado
              : null,
        },
        select: { id: true },
      });

      await tx.imagemAnuncio.createMany({
        data: imagens.map((url, index) => ({
          anuncio_id: createdItem.id,
          url,
          ordem: index,
        })),
      });

      return createdItem;
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/items error:", e);
    return new NextResponse("Erro interno ao criar o anúncio.", { status: 500 });
  }
}