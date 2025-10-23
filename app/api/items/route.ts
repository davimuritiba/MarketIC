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

// POST /api/items
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      titulo,
      descricao,
      tipo_transacao,       // "VENDA" | "EMPRESTIMO" | "DOACAO" | "ALUGUEL" (se usar aluguel depois)
      estado_conservacao,   // "NOVO" | "SEMINOVO" | "USADO"
      preco_centavos,       // number | null (em centavos)
      preco_formatado,      // string | null (opcional)
      usuario_id,
      categoria_id,
      quantidade_disponivel,
    } = body;

    // validações essenciais
    if (!titulo?.trim()) {
      return new NextResponse("Título é obrigatório.", { status: 400 });
    }
    if (!tipo_transacao) {
      return new NextResponse("Tipo de transação é obrigatório.", { status: 400 });
    }
    if (!categoria_id) {
      return new NextResponse("Tipo de transação é obrigatório.", { status: 400 });
    }
    if (tipo_transacao === "VENDA") {
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

    const item = await prisma.item.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        tipo_transacao: tipo_transacao,
        estado_conservacao: estado_conservacao || null,
        preco_centavos: tipo_transacao === "VENDA" ? preco_centavos : null,
        preco_formatado: preco_formatado || null,
        usuario_id: usuario_id,
        categoria_id: categoria_id || null,
        quantidade_disponivel: quantidadeNormalizada,
      },
      select: { id: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/items error:", e);
    return new NextResponse("Erro interno ao criar o anúncio.", { status: 500 });
  }
}