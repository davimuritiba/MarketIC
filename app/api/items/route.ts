import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.titulo || !data.usuario_id || !data.categoria_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios: titulo, usuario_id e categoria_id" },
        { status: 400 }
      );
    }

    const novoItem = await prisma.item.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        tipo_transacao: data.tipo_transacao,
        estado_conservacao: data.estado_conservacao,
        preco: data.preco ? Number(data.preco) : null,
        usuario_id: data.usuario_id,
        categoria_id: data.categoria_id,
        prazo_dias: data.prazo_dias ? Number(data.prazo_dias) : null,
        quantidade_disponivel: data.quantidade_disponivel || 1,
      },
    });

    return NextResponse.json(novoItem, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return NextResponse.json(
      { error: "Erro ao criar item" },
      { status: 500 }
    );
  }
}
