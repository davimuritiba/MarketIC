import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const data = await req.json();

    const tipoTransacao =
      typeof data.tipo_transacao === "string"
        ? (data.tipo_transacao.toUpperCase() as TipoTransacao)
        : undefined;
    const estadoConservacao =
      typeof data.estado_conservacao === "string"
        ? (data.estado_conservacao.toUpperCase() as EstadoConservacao)
        : undefined;

    const updateData: Record<string, unknown> = {
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      prazo_dias:
        data.prazo_dias === undefined ? undefined : Number(data.prazo_dias),
      quantidade_disponivel:
        data.quantidade_disponivel === undefined
          ? undefined
          : Number(data.quantidade_disponivel),
    };

    if (data.preco_centavos !== undefined) {
      updateData.preco_centavos = data.preco_centavos
        ? Number(data.preco_centavos)
        : null;
    } else if (data.preco !== undefined) {
      updateData.preco_centavos = data.preco ? Number(data.preco) : null;
    }

    if (data.preco_formatado !== undefined) {
      updateData.preco_formatado = data.preco_formatado ?? null;
    }

    if (tipoTransacao) {
      updateData.tipo_transacao = tipoTransacao;
    }

    if (estadoConservacao) {
      updateData.estado_conservacao = estadoConservacao;
    }

    const item = await prisma.item.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.item.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Item deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return NextResponse.json({ error: "Erro ao deletar item" }, { status: 500 });
  }
}