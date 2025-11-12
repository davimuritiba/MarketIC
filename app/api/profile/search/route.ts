import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const terms = q.split(/\s+/).filter(Boolean);

    let where: Prisma.UsuarioWhereInput | undefined;

    if (terms.length > 0) {
      where = {
        AND: terms.map((term) => ({
          OR: [
            { nome: { contains: term, mode: "insensitive" } },
            { curso: { contains: term, mode: "insensitive" } },
            { email_institucional: { contains: term, mode: "insensitive" } },
          ],
        })),
      };
    }

    const users = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        curso: true,
        foto_documento_url: true,
      },
      orderBy: {
        nome: "asc",
      },
      take: 50,
    });

    const payload = users.map((user) => ({
      id: user.id,
      nome: user.nome,
      curso: user.curso,
      avatarUrl: user.foto_documento_url,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfis" },
      { status: 500 },
    );
  }
}
