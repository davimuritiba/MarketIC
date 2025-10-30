import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const itemId = params.id;

  if (!itemId) {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, usuario_id: true },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Anúncio não encontrado." },
      { status: 404 },
    );
  }

  if (item.usuario_id === session.usuario_id) {
    return NextResponse.json(
      { error: "Você não pode favoritar o próprio anúncio." },
      { status: 400 },
    );
  }

  try {
    await prisma.favorito.create({
      data: {
        usuario_id: session.usuario_id,
        anuncio_id: itemId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ favorited: true }, { status: 200 });
      }
    }

    console.error("Erro ao favoritar anúncio", error);
    return NextResponse.json(
      { error: "Não foi possível favoritar o anúncio." },
      { status: 500 },
    );
  }

  return NextResponse.json({ favorited: true }, { status: 200 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const itemId = params.id;

  if (!itemId) {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  try {
    await prisma.favorito.delete({
      where: {
        usuario_id_anuncio_id: {
          usuario_id: session.usuario_id,
          anuncio_id: itemId,
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ favorited: false }, { status: 200 });
      }
    }

    console.error("Erro ao remover favorito", error);
    return NextResponse.json(
      { error: "Não foi possível remover o favorito." },
      { status: 500 },
    );
  }

  return NextResponse.json({ favorited: false }, { status: 200 });
}