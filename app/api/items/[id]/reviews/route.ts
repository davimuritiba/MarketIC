import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeReviewPermissions } from "@/lib/review-permissions";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const { id: itemId } = await params;

  if (!itemId) {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim()
      : null;
  const comment =
    typeof body?.comment === "string" && body.comment.trim()
      ? body.comment.trim()
      : null;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Informe uma nota válida entre 1 e 5." },
      { status: 400 },
    );
  }

  if (title && title.length > 120) {
    return NextResponse.json(
      { error: "O título deve ter no máximo 120 caracteres." },
      { status: 400 },
    );
  }

  if (comment && comment.length > 1000) {
    return NextResponse.json(
      { error: "O comentário deve ter no máximo 1000 caracteres." },
      { status: 400 },
    );
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, usuario_id: true, tipo_transacao: true },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Anúncio não encontrado." },
      { status: 404 },
    );
  }

  if (item.usuario_id === session.usuario_id) {
    return NextResponse.json(
      { error: "Você não pode avaliar o próprio produto." },
      { status: 400 },
    );
  }

  if (item.tipo_transacao === "DOACAO") {
    return NextResponse.json(
      { error: "Não é possível avaliar doações." },
      { status: 400 },
    );
  }

  const existingReview = await prisma.avaliacaoItem.findFirst({
    where: {
      anuncio_id: itemId,
      usuario_id: session.usuario_id,
    },
    select: { id: true },
  });

  if (existingReview) {
    return NextResponse.json(
      { error: "Você já avaliou este produto." },
      { status: 400 },
    );
  }

  try {
    const review = await prisma.avaliacaoItem.create({
      data: {
        anuncio_id: itemId,
        usuario_id: session.usuario_id,
        nota: rating,
        titulo: title,
        comentario: comment,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            foto_documento_url: true,
          },
        },
      },
    });

    const permissions = computeReviewPermissions({
      viewerId: session.usuario_id,
      authorId: review.usuario_id,
      createdAt: review.data,
    });

    return NextResponse.json(
      {
        review: {
          id: review.id,
          rating: review.nota,
          title: review.titulo,
          comment: review.comentario,
          createdAt: review.data.toISOString(),
          reviewer: {
            id: review.usuario.id,
            name: review.usuario.nome,
            avatarUrl: review.usuario.foto_documento_url ?? null,
          },
          canEdit: permissions.canEdit,
          canDelete: permissions.canDelete,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar avaliação do produto", error);
    return NextResponse.json(
      { error: "Não foi possível registrar a avaliação." },
      { status: 500 },
    );
  }
}
