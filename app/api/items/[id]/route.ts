import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { EstadoConservacao, TipoTransacao } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        categoria: true,
        imagens: {
          orderBy: { ordem: "asc" },
        },
        usuario: {
          select: { id: true, nome: true, email_institucional: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("⚠️ Erro detalhado ao buscar item:", error);
    return NextResponse.json(
      { error: "Erro interno", detalhes: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Sessão inválida ou expirada.", { status: 401 });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: params.id },
      select: { usuario_id: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    if (existingItem.usuario_id !== session.usuario_id) {
      return NextResponse.json({ error: "Você não tem permissão para editar este anúncio." }, { status: 403 });
    }

    const data = await req.json();

    const titulo = typeof data.titulo === "string" ? data.titulo.trim() : "";
    if (!titulo) {
      return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
    }

    const descricao =
      typeof data.descricao === "string" && data.descricao.trim()
        ? data.descricao.trim()
        : null;

    const tipoTransacaoNormalizado =
      typeof data.tipo_transacao === "string"
        ? data.tipo_transacao.toUpperCase()
        : "";
    const estadoConservacaoNormalizado =
      typeof data.estado_conservacao === "string"
        ? data.estado_conservacao.toUpperCase()
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

    if (!validTransactionTypes.includes(tipoTransacaoNormalizado as TipoTransacao)) {
      return NextResponse.json(
        { error: "Tipo de transação é obrigatório." },
        { status: 400 }
      );
    }

    if (!validConditions.includes(estadoConservacaoNormalizado as EstadoConservacao)) {
      return NextResponse.json(
        { error: "Estado de conservação é obrigatório." },
        { status: 400 }
      );
    }

    const categoriaNome =
      typeof data.categoria_nome === "string" ? data.categoria_nome.trim() : "";

    if (!categoriaNome) {
      return NextResponse.json(
        { error: "Categoria é obrigatória." },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.findFirst({
      where: {
        nome: {
          equals: categoriaNome,
          mode: "insensitive",
        },
      },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria inválida." },
        { status: 400 }
      );
    }

    let quantidadeNormalizada: number | null = null;
    if (typeof data.quantidade_disponivel === "number") {
      quantidadeNormalizada = data.quantidade_disponivel;
    } else if (
      typeof data.quantidade_disponivel === "string" &&
      data.quantidade_disponivel.trim()
    ) {
      quantidadeNormalizada = Number.parseInt(data.quantidade_disponivel, 10);
    }

    if (
      quantidadeNormalizada == null ||
      !Number.isFinite(quantidadeNormalizada) ||
      quantidadeNormalizada < 1 ||
      !Number.isInteger(quantidadeNormalizada)
    ) {
      return NextResponse.json(
        { error: "Quantidade deve ser um inteiro positivo." },
        { status: 400 }
      );
    }

    let precoCentavos: number | null = null;
    let precoFormatado: string | null = null;

    if (tipoTransacaoNormalizado === "VENDA") {
      if (data.preco_centavos != null) {
        const preco = Number(data.preco_centavos);
        if (!Number.isFinite(preco) || preco < 0) {
          return NextResponse.json(
            { error: "Preço inválido." },
            { status: 400 }
          );
        }
        precoCentavos = Math.round(preco);
      } else if (data.preco != null) {
        const preco = Number(data.preco);
        if (!Number.isFinite(preco) || preco < 0) {
          return NextResponse.json(
            { error: "Preço inválido." },
            { status: 400 }
          );
        }
        precoCentavos = Math.round(preco);
      } else {
        return NextResponse.json(
          { error: "Preço é obrigatório para anúncios de venda." },
          { status: 400 }
        );
      }

      if (
        typeof data.preco_formatado === "string" &&
        data.preco_formatado.trim()
      ) {
        precoFormatado = data.preco_formatado.trim();
      }
    }

    const imagensInput = Array.isArray(data.imagens) ? data.imagens : [];
    const imagensFormatadas = imagensInput
      .map((imagem: any, index: number) => {
        if (!imagem || typeof imagem !== "object") {
          return null;
        }

        const id =
          typeof imagem.id === "string" && imagem.id.trim().length > 0
            ? imagem.id
            : undefined;
        const url =
          typeof imagem.url === "string" ? imagem.url.trim() : "";

        if (!url) {
          return null;
        }

        return { id, url, ordem: index };
      })
      .filter((imagem): imagem is { id?: string; url: string; ordem: number } =>
        Boolean(imagem),
      );

    if (!imagensFormatadas.length) {
      return NextResponse.json(
        { error: "Pelo menos uma imagem é obrigatória." },
        { status: 400 }
      );
    }

    let prazoDiasNormalizado: number | null = null;

    if (tipoTransacaoNormalizado === "EMPRESTIMO") {
      const rawPrazo = data.prazo_dias;
      const parsedPrazo =
        typeof rawPrazo === "number"
          ? rawPrazo
          : typeof rawPrazo === "string" && rawPrazo.trim()
          ? Number.parseInt(rawPrazo, 10)
          : NaN;

      if (!Number.isFinite(parsedPrazo) || parsedPrazo < 1 || parsedPrazo > 365) {
        return NextResponse.json(
          {
            error: "Prazo do empréstimo deve ser um número entre 1 e 365 dias.",
          },
          { status: 400 },
        );
      }

      prazoDiasNormalizado = Math.trunc(parsedPrazo);
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id: params.id },
        data: {
          titulo,
          descricao,
          tipo_transacao: tipoTransacaoNormalizado as TipoTransacao,
          estado_conservacao: estadoConservacaoNormalizado as EstadoConservacao,
          quantidade_disponivel: quantidadeNormalizada,
          preco_centavos: precoCentavos,
          preco_formatado: precoFormatado,
          prazo_dias:
            tipoTransacaoNormalizado === "EMPRESTIMO"
              ? prazoDiasNormalizado
              : null,
          categoria_id: categoria.id,
        },
      });

      const existingImages = await tx.imagemAnuncio.findMany({
        where: { anuncio_id: params.id },
        select: { id: true },
      });

      const keepIds = new Set(
        imagensFormatadas
          .map((imagem) => imagem.id)
          .filter((id): id is string => Boolean(id)),
      );

      const imagesToDelete = existingImages
        .map((image) => image.id)
        .filter((id) => !keepIds.has(id));

      if (imagesToDelete.length) {
        await tx.imagemAnuncio.deleteMany({
          where: { id: { in: imagesToDelete } },
        });
      }

      await Promise.all(
        imagensFormatadas.map(async (imagem) => {
          if (imagem.id) {
            await tx.imagemAnuncio.update({
              where: { id: imagem.id },
              data: {
                url: imagem.url,
                ordem: imagem.ordem,
              },
            });
          } else {
            await tx.imagemAnuncio.create({
              data: {
                anuncio_id: params.id,
                url: imagem.url,
                ordem: imagem.ordem,
              },
            });
          }
        }),
      );

      return tx.item.findUnique({
        where: { id: params.id },
        include: {
          categoria: true,
          imagens: { orderBy: { ordem: "asc" } },
        },
      });
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Sessão inválida ou expirada.", { status: 401 });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: params.id },
      select: { usuario_id: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    if (existingItem.usuario_id !== session.usuario_id) {
      return NextResponse.json({ error: "Você não tem permissão para excluir este anúncio." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.imagemAnuncio.deleteMany({ where: { anuncio_id: params.id } });
      await tx.avaliacaoItem.deleteMany({ where: { anuncio_id: params.id } });
      await tx.interesse.deleteMany({ where: { anuncio_id: params.id } });
      await tx.favorito.deleteMany({ where: { anuncio_id: params.id } });
      await tx.carrinhoItem.deleteMany({ where: { anuncio_id: params.id } });
      await tx.item.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ message: "Item deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return NextResponse.json({ error: "Erro ao deletar item" }, { status: 500 });
  }
}