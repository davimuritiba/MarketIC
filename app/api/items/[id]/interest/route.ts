import { NextResponse } from "next/server";

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

  const anuncioId = params.id;

  if (!anuncioId) {
    return NextResponse.json(
      { error: "Anúncio inválido." },
      { status: 400 },
    );
  }

  const item = await prisma.item.findUnique({
    where: { id: anuncioId },
    select: { usuario_id: true },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Anúncio não encontrado." },
      { status: 404 },
    );
  }

  if (item.usuario_id === session.usuario_id) {
    return NextResponse.json(
      { error: "Você não pode demonstrar interesse no próprio anúncio." },
      { status: 400 },
    );
  }

  const existingInterest = await prisma.interesse.findUnique({
    where: {
      usuario_id_anuncio_id: {
        usuario_id: session.usuario_id,
        anuncio_id: anuncioId,
      },
    },
    select: { id: true },
  });

  if (!existingInterest) {
    await prisma.interesse.create({
      data: {
        usuario_id: session.usuario_id,
        anuncio_id: anuncioId,
      },
    });
  }

  await prisma.carrinhoItem
    .update({
      where: {
        usuario_id_anuncio_id: {
          usuario_id: session.usuario_id,
          anuncio_id: anuncioId,
        },
      },
      data: { interested_flag: true },
    })
    .catch(() => null);

  return NextResponse.json({ interested: true }, { status: 200 });
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

  const anuncioId = params.id;

  if (!anuncioId) {
    return NextResponse.json(
      { error: "Anúncio inválido." },
      { status: 400 },
    );
  }

  const interest = await prisma.interesse.findUnique({
    where: {
      usuario_id_anuncio_id: {
        usuario_id: session.usuario_id,
        anuncio_id: anuncioId,
      },
    },
    select: { id: true },
  });

  if (interest) {
    await prisma.interesse.delete({
      where: {
        usuario_id_anuncio_id: {
          usuario_id: session.usuario_id,
          anuncio_id: anuncioId,
        },
      },
    });
  }

  await prisma.carrinhoItem
    .update({
      where: {
        usuario_id_anuncio_id: {
          usuario_id: session.usuario_id,
          anuncio_id: anuncioId,
        },
      },
      data: { interested_flag: false },
    })
    .catch(() => null);

  return NextResponse.json({ interested: false }, { status: 200 });
}
