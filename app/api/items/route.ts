import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DEFAULT_EXPIRATION_MONTHS } from "@/lib/item-status";
import type { EstadoConservacao, TipoTransacao } from "@prisma/client";

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      include: {
        categoria: true,
        usuario: {
          select: { id: true, nome: true, email_institucional: true },
        },
      },
      orderBy: { titulo: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao listar itens:", error);
    return NextResponse.json(
      { error: "Erro ao listar itens" },
      { status: 500 }
    );
  }
}

// POST /api/items
export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Sessão inválida ou expirada.", { status: 401 });
    }

    const body = await req.json();

    const {
      titulo,
      descricao,
      tipo_transacao, // "VENDA" | "EMPRESTIMO" | "DOACAO" | "ALUGUEL" (se usar aluguel depois)
      estado_conservacao, // "NOVO" | "SEMINOVO" | "USADO"
      preco_centavos, // number | null (em centavos)
      preco_formatado, // string | null (opcional)
      categoria_nome,
      quantidade_disponivel,
      imagens: imagensInput,
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