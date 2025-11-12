import { NextRequest, NextResponse } from "next/server"

import { DEFAULT_EXPIRATION_MONTHS } from "@/lib/item-status"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function addMonths(base: Date, months: number) {
  const result = new Date(base)
  result.setMonth(result.getMonth() + months)
  return result
}

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return new NextResponse("Sessão inválida ou expirada.", { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Não foi possível ler os anúncios selecionados." },
        { status: 400 },
      )
    }

    const idsInput =
      body && typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).ids
        : null

    if (!Array.isArray(idsInput)) {
      return NextResponse.json(
        { error: "Selecione pelo menos um anúncio para atualizar." },
        { status: 400 },
      )
    }

    const ids = Array.from(
      new Set(
        idsInput
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      ),
    )

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um anúncio para atualizar." },
        { status: 400 },
      )
    }

    const ownedItems = await prisma.item.findMany({
      where: {
        id: { in: ids },
        usuario_id: session.usuario_id,
        status: { in: ["INATIVO", "EXPIRADO"] },
      },
      select: { id: true },
    })

    if (ownedItems.length === 0) {
      return NextResponse.json(
        { error: "Nenhum anúncio válido encontrado para atualização." },
        { status: 404 },
      )
    }

    const now = new Date()
    const expirationDate = addMonths(now, DEFAULT_EXPIRATION_MONTHS)

    const idsToUpdate = ownedItems.map((item) => item.id)

    const result = await prisma.item.updateMany({
      where: { id: { in: idsToUpdate } },
      data: {
        status: "PUBLICADO",
        publicado_em: now,
        expira_em: expirationDate,
        inativado_em: null,
        finalizado_em: null,
      },
    })

    return NextResponse.json({ updatedCount: result.count })
  } catch (error) {
    console.error("Erro ao reativar anúncios:", error)
    return NextResponse.json(
      { error: "Erro interno ao atualizar os anúncios." },
      { status: 500 },
    )
  }
}
