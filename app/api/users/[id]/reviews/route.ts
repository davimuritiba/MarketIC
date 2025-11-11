import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    )
  }

  const userId = params.id

  if (!userId) {
    return NextResponse.json({ error: "Usuário inválido." }, { status: 400 })
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
    return NextResponse.json(
      { error: "Informe uma nota válida entre 1 e 5." },
      { status: 400 },
    )
  }

  if (title && title.length > 120) {
    return NextResponse.json(
      { error: "O título deve ter no máximo 120 caracteres." },
      { status: 400 },
    )
  }

  if (comment && comment.length > 1000) {
    return NextResponse.json(
      { error: "O comentário deve ter no máximo 1000 caracteres." },
      { status: 400 },
    )
  }

  if (session.usuario_id === userId) {
    return NextResponse.json(
      { error: "Você não pode avaliar a si mesmo." },
      { status: 400 },
    )
  }

  const targetUser = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!targetUser) {
    return NextResponse.json(
      { error: "Usuário não encontrado." },
      { status: 404 },
    )
  }

  const existingReview = await prisma.avaliacaoUsuario.findUnique({
    where: {
      avaliador_id_avaliado_id: {
        avaliador_id: session.usuario_id,
        avaliado_id: userId,
      },
    },
    select: { id: true },
  })

  if (existingReview) {
    return NextResponse.json(
      { error: "Você já avaliou este usuário." },
      { status: 400 },
    )
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.avaliacaoUsuario.create({
        data: {
          avaliado_id: userId,
          avaliador_id: session.usuario_id,
          nota: rating,
          titulo: title,
          comentario: comment,
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
        review,
        rating: updatedRating,
        ratingCount: updatedRatingCount,
      }
    })

    return NextResponse.json(
      {
        review: {
          id: result.review.id,
          rating: result.review.nota,
          title: result.review.titulo,
          comment: result.review.comentario,
          createdAt: result.review.data.toISOString(),
          reviewer: {
            id: session.usuario!.id,
            name: session.usuario!.nome,
            avatarUrl: session.usuario!.foto_documento_url ?? null,
          },
        },
        rating: result.rating,
        ratingCount: result.ratingCount,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao criar avaliação de usuário", error)
    return NextResponse.json(
      { error: "Não foi possível registrar a avaliação." },
      { status: 500 },
    )
  }
}
