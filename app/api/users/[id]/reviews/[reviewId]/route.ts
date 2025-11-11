import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeReviewPermissions, REVIEW_EDIT_WINDOW_MS, } from "@/lib/review-permissions"

function buildValidationError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; reviewId: string } },
) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    )
  }

  const userId = params.id
  const reviewId = params.reviewId

  if (!userId || !reviewId) {
    return buildValidationError("Avaliação inválida.")
  }

  const body = await request.json().catch(() => null)
  const rating = Number(body?.rating)
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim()
      : null
  const comment =
    typeof body?.comment === "string" && body.comment.trim()
      ? body.comment.trim()
      : null

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return buildValidationError("Informe uma nota válida entre 1 e 5.")
  }

  if (title && title.length > 120) {
    return buildValidationError("O título deve ter no máximo 120 caracteres.")
  }

  if (comment && comment.length > 1000) {
    return buildValidationError(
      "O comentário deve ter no máximo 1000 caracteres.",
    )
  }

  const review = await prisma.avaliacaoUsuario.findUnique({
    where: { id: reviewId },
    include: {
      avaliador: {
        select: {
          id: true,
          nome: true,
          foto_documento_url: true,
        },
      },
    },
  })

  if (!review || review.avaliado_id !== userId) {
    return NextResponse.json(
      { error: "Avaliação não encontrada." },
      { status: 404 },
    )
  }

  if (review.avaliador_id !== session.usuario_id) {
    return NextResponse.json(
      { error: "Você não tem permissão para editar esta avaliação." },
      { status: 403 },
    )
  }

  const now = Date.now()
  if (now - review.data.getTime() > REVIEW_EDIT_WINDOW_MS) {
    return NextResponse.json(
      { error: "O prazo para editar esta avaliação expirou." },
      { status: 400 },
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.avaliacaoUsuario.update({
      where: { id: reviewId },
      data: {
        nota: rating,
        titulo: title,
        comentario: comment,
      },
      include: {
        avaliador: {
          select: {
            id: true,
            nome: true,
            foto_documento_url: true,
          },
        },
      },
    })

    const aggregate = await tx.avaliacaoUsuario.aggregate({
      where: { avaliado_id: userId },
      _avg: { nota: true },
      _count: { id: true },
    })

    const updatedRating = aggregate._avg.nota ?? 0
    const updatedRatingCount = aggregate._count.id ?? 0

    await tx.usuario.update({
      where: { id: userId },
      data: {
        reputacao_media: updatedRating,
        reputacao_count: updatedRatingCount,
      },
    })

    return {
      review: updated,
      rating: updatedRating,
      ratingCount: updatedRatingCount,
    }
  })

  const permissions = computeReviewPermissions({
    viewerId: session.usuario_id,
    authorId: result.review.avaliador_id,
    createdAt: result.review.data,
  })

  return NextResponse.json({
    review: {
      id: result.review.id,
      rating: result.review.nota,
      title: result.review.titulo,
      comment: result.review.comentario,
      createdAt: result.review.data.toISOString(),
      reviewer: {
        id: result.review.avaliador.id,
        name: result.review.avaliador.nome,
        avatarUrl: result.review.avaliador.foto_documento_url ?? null,
      },
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
    },
    rating: result.rating,
    ratingCount: result.ratingCount,
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; reviewId: string } },
) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    )
  }

  const userId = params.id
  const reviewId = params.reviewId

  if (!userId || !reviewId) {
    return buildValidationError("Avaliação inválida.")
  }

  const review = await prisma.avaliacaoUsuario.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      avaliado_id: true,
      avaliador_id: true,
    },
  })

  if (!review || review.avaliado_id !== userId) {
    return NextResponse.json(
      { error: "Avaliação não encontrada." },
      { status: 404 },
    )
  }

  if (review.avaliador_id !== session.usuario_id) {
    return NextResponse.json(
      { error: "Você não tem permissão para excluir esta avaliação." },
      { status: 403 },
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.avaliacaoUsuario.delete({ where: { id: reviewId } })

    const aggregate = await tx.avaliacaoUsuario.aggregate({
      where: { avaliado_id: userId },
      _avg: { nota: true },
      _count: { id: true },
    })

    const updatedRating = aggregate._avg.nota ?? 0
    const updatedRatingCount = aggregate._count.id ?? 0

    await tx.usuario.update({
      where: { id: userId },
      data: {
        reputacao_media: updatedRating,
        reputacao_count: updatedRatingCount,
      },
    })

    return {
      rating: updatedRating,
      ratingCount: updatedRatingCount,
    }
  })

  return NextResponse.json({
    success: true,
    rating: result.rating,
    ratingCount: result.ratingCount,
  })
}
