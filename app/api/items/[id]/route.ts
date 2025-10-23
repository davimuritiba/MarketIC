import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        const item = await prisma.item.update({
            where: { id: params.id },
            data: {
                titulo: data.titulo,
                descricao: data.descricao,
                preco: data.preco ? Number(data.preco) : null,
                prazo_dias: data.prazo_dias,
                quantidade_disponivel: data.quantidade_disponivel,
                estado_conservacao: data.estado_conservacao,
                tipo_transacao: data.tipo_transacao,
            },
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