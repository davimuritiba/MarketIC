import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeReviewPermissions, REVIEW_EDIT_WINDOW_MS, } from "@/lib/review-permissions";

function buildValidationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; reviewId: string } },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const itemId = params.id;
  const reviewId = params.reviewId;

  if (!itemId || !reviewId) {
    return buildValidationError("Avaliação inválida.");
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
    return buildValidationError("Informe uma nota válida entre 1 e 5.");
  }

  if (title && title.length > 120) {
    return buildValidationError(
      "O título deve ter no máximo 120 caracteres.",
    );
  }

  if (comment && comment.length > 1000) {
    return buildValidationError(
      "O comentário deve ter no máximo 1000 caracteres.",
    );
  }

  const review = await prisma.avaliacaoItem.findUnique({
    where: { id: reviewId },
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

  if (!review || review.anuncio_id !== itemId) {
    return NextResponse.json(
      { error: "Avaliação não encontrada." },
      { status: 404 },
    );
  }

  if (review.usuario_id !== session.usuario_id) {
    return NextResponse.json(
      { error: "Você não tem permissão para editar esta avaliação." },
      { status: 403 },
    );
  }

  const now = Date.now();
  if (now - review.data.getTime() > REVIEW_EDIT_WINDOW_MS) {
    return NextResponse.json(
      { error: "O prazo para editar esta avaliação expirou." },
      { status: 400 },
    );
  }

  const updated = await prisma.avaliacaoItem.update({
    where: { id: reviewId },
    data: {
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
    authorId: updated.usuario_id,
    createdAt: updated.data,
  });

  return NextResponse.json({
    review: {
      id: updated.id,
      rating: updated.nota,
      title: updated.titulo,
      comment: updated.comentario,
      createdAt: updated.data.toISOString(),
      reviewer: {
        id: updated.usuario.id,
        name: updated.usuario.nome,
        avatarUrl: updated.usuario.foto_documento_url ?? null,
      },
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; reviewId: string } },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const itemId = params.id;
  const reviewId = params.reviewId;

  if (!itemId || !reviewId) {
    return buildValidationError("Avaliação inválida.");
  }

  const review = await prisma.avaliacaoItem.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      anuncio_id: true,
      usuario_id: true,
    },
  });

  if (!review || review.anuncio_id !== itemId) {
    return NextResponse.json(
      { error: "Avaliação não encontrada." },
      { status: 404 },
    );
  }

  if (review.usuario_id !== session.usuario_id) {
    return NextResponse.json(
      { error: "Você não tem permissão para excluir esta avaliação." },
      { status: 403 },
    );
  }

  await prisma.avaliacaoItem.delete({ where: { id: reviewId } });

  return NextResponse.json({ success: true });
}
