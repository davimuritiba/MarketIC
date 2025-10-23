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
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};
    let imagensData: { url: string; ordem: number }[] = [];

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value;
      });

      const rawImages = formData.getAll("imagens");
      const arquivos = rawImages.filter((file): file is File => file instanceof File && file.size > 0);

      imagensData = await Promise.all(
        arquivos.map(async (file, index) => {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = file.type || "image/jpeg";
          const base64 = buffer.toString("base64");
          return {
            url: `data:${mimeType};base64,${base64}`,
            ordem: index,
          };
        })
      );
    }

    const titulo = (payload.titulo ?? "").toString();
    const descricao = payload.descricao?.toString() ?? "";
    const tipoTransacao = payload.tipo_transacao?.toString().toUpperCase() ?? "";
    const estadoConservacao = payload.estado_conservacao?.toString().toUpperCase() ?? "";
    const precoCentavosRaw = payload.preco_centavos;
    const precoFormatado = payload.preco_formatado?.toString() ?? null;
    const usuarioId = payload.usuario_id?.toString();
    const categoriaId = payload.categoria_id?.toString();

    const precoCentavos =
      precoCentavosRaw !== undefined && precoCentavosRaw !== null && `${precoCentavosRaw}` !== ""
        ? Number(precoCentavosRaw)
        : null;

    if (!titulo.trim()) {
      return new NextResponse("Título é obrigatório.", { status: 400 });
    }
    if (!tipoTransacao) {
      return new NextResponse("Tipo de transação é obrigatório.", { status: 400 });
    }
    if (!estadoConservacao) {
      return new NextResponse("Estado de conservação é obrigatório.", { status: 400 });
    }
    if (!categoriaId) {
      return new NextResponse("Categoria é obrigatória.", { status: 400 });
    }
    if (!usuarioId) {
      return new NextResponse("Usuário é obrigatório.", { status: 400 });
    }
    if (tipoTransacao === "VENDA") {
      if (precoCentavos == null || Number.isNaN(precoCentavos) || precoCentavos < 0) {
        return new NextResponse("Preço inválido.", { status: 400 });
      }
    }

    const item = await prisma.item.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao.trim() ? descricao.trim() : null,
        tipo_transacao: tipoTransacao,
        estado_conservacao: estadoConservacao,
        preco_centavos: tipoTransacao === "VENDA" ? precoCentavos : null,
        preco_formatado: tipoTransacao === "VENDA" ? precoFormatado : null,
        usuario_id: usuarioId,
        categoria_id: categoriaId,
        imagens: imagensData.length
          ? {
              create: imagensData.map((imagem) => ({
                url: imagem.url,
                ordem: imagem.ordem,
              })),
            }
          : undefined,
      },
      include: { imagens: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/items error:", e);
    return new NextResponse("Erro interno ao criar o anúncio.", { status: 500 });
  }
}