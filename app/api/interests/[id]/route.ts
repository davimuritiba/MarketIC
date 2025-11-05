import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const interestId = params.id;

  if (!interestId) {
    return NextResponse.json(
      { error: "Interesse inválido." },
      { status: 400 },
    );
  }

  let payload: { action?: string; shareEmail?: unknown; sharePhone?: unknown };

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Dados inválidos." },
      { status: 400 },
    );
  }

  const action = payload.action;

  if (action !== "accept" && action !== "reject") {
    return NextResponse.json(
      { error: "Ação inválida." },
      { status: 400 },
    );
  }

  const interest = await prisma.interesse.findUnique({
    where: { id: interestId },
    select: {
      id: true,
      item: {
        select: {
          usuario_id: true,
        },
      },
    },
  });

  if (!interest) {
    return NextResponse.json(
      { error: "Interesse não encontrado." },
      { status: 404 },
    );
  }

  if (interest.item?.usuario_id !== session.usuario_id) {
    return NextResponse.json(
      { error: "Você não tem permissão para atualizar este interesse." },
      { status: 403 },
    );
  }

  if (action === "accept") {
    const shareEmail = Boolean(payload.shareEmail);
    const sharePhone = Boolean(payload.sharePhone);

    if (!shareEmail && !sharePhone) {
      return NextResponse.json(
        {
          error:
            "Selecione pelo menos um contato para compartilhar ao aceitar o interesse.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.interesse.update({
      where: { id: interestId },
      data: {
        status: "ACEITO",
        share_email: shareEmail,
        share_phone: sharePhone,
      },
      select: {
        status: true,
        share_email: true,
        share_phone: true,
      },
    });

    return NextResponse.json(
      {
        interest: {
          status: updated.status,
          shareEmail: updated.share_email,
          sharePhone: updated.share_phone,
        },
      },
      { status: 200 },
    );
  }

  const updated = await prisma.interesse.update({
    where: { id: interestId },
    data: {
      status: "RECUSADO",
      share_email: false,
      share_phone: false,
    },
    select: {
      status: true,
      share_email: true,
      share_phone: true,
    },
  });

  return NextResponse.json(
    {
      interest: {
        status: updated.status,
        shareEmail: updated.share_email,
        sharePhone: updated.share_phone,
      },
    },
    { status: 200 },
  );
}
