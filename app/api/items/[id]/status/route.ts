import { NextRequest, NextResponse } from "next/server"

import { mapItemToAd, type PrismaItemWithRelations } from "@/lib/ad-mapper"
import { getSession } from "@/lib/auth"
import {
  resolveItemStatus,
  type StatusSource,
} from "@/lib/item-status"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

import type { ProfileAdItem } from "@/types/profile"

const ALLOWED_STATUS = new Set(["INATIVO", "FINALIZADO"] as const)

type ItemWithRelations = PrismaItemWithRelations & StatusSource

function mapItemToProfileAd(item: ItemWithRelations): ProfileAdItem {
  const base = mapItemToAd(item)
  const statusInfo = resolveItemStatus(item)

  return {
    ...base,
    statusCode: statusInfo.statusCode,
    statusLabel: statusInfo.statusLabel,
    publishedAt: statusInfo.publishedAt.toISOString(),
    expiresAt: statusInfo.expiresAt ? statusInfo.expiresAt.toISOString() : null,
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()

    if (!session) {
      return new NextResponse("Sessão inválida ou expirada.", { status: 401 })
    }

    const { status } = await req.json()

    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { error: "Status informado é inválido." },
        { status: 400 },
      )
    }

    const { id } = await params

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        imagens: {
          orderBy: { ordem: "asc" },
          take: 1,
        },
        avaliacoes: {
          select: { nota: true },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 })
    }

    if (item.usuario_id !== session.usuario_id) {
      return NextResponse.json(
        { error: "Você não tem permissão para alterar este anúncio." },
        { status: 403 },
      )
    }

    if (item.status !== "PUBLICADO") {
      return NextResponse.json(
        { error: "Somente anúncios ativos podem ser atualizados." },
        { status: 400 },
      )
    }

    const now = new Date()

    const updateData: any = { status }

    if (status === "INATIVO") {
      updateData.inativado_em = now
      updateData.finalizado_em = null
    } else if (status === "FINALIZADO") {
      updateData.finalizado_em = now
      updateData.inativado_em = null
    }

    const updated = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        imagens: {
          orderBy: { ordem: "asc" },
          take: 1,
        },
        avaliacoes: {
          select: { nota: true },
        },
      },
    })

    return NextResponse.json(mapItemToProfileAd(updated as ItemWithRelations))
  } catch (error) {
    console.error("Erro ao atualizar status do anúncio:", error)
    return NextResponse.json(
      { error: "Erro interno ao atualizar o status." },
      { status: 500 },
    )
  }
}
