import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie, getUserFromRequest } from "@/lib/auth";
import { isValidBrazilianPhone, normalizeBrazilianPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getProfilePageData } from "@/lib/profile";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const data = await getProfilePageData(user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    if (error instanceof Error && error.message === "Usuário não encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Erro ao buscar perfil." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const {
    nome,
    telefone,
    curso,
    fotoDocumentoUrl,
    rg,
    dataNascimento,
  } = body as {
    nome?: string | null;
    telefone?: string | null;
    curso?: string | null;
    fotoDocumentoUrl?: string | null;
    rg?: string | null;
    dataNascimento?: string | null;
  };

  const dataToUpdate: Record<string, unknown> = {};

  if (nome !== undefined) {
    if (nome !== null && !nome.trim()) {
      return NextResponse.json({ error: "Nome não pode ser vazio." }, { status: 400 });
    }
    dataToUpdate.nome = nome?.trim() ?? null;
  }

  if (telefone !== undefined) {
    if (telefone === null) {
      dataToUpdate.telefone = null;
    } else if (typeof telefone !== "string") {
      return NextResponse.json(
        { error: "Telefone inválido." },
        { status: 400 },
      );
    } else {
      const trimmedPhone = telefone.trim();

      if (!trimmedPhone) {
        return NextResponse.json(
          { error: "Telefone não pode ser vazio." },
          { status: 400 },
        );
      }

      const normalizedPhone = normalizeBrazilianPhone(trimmedPhone);

      if (!isValidBrazilianPhone(normalizedPhone)) {
        return NextResponse.json(
          {
            error:
              "Informe um telefone válido com DDD e 9 dígitos (ex: (82) 90000-0000).",
          },
          { status: 400 },
        );
      }

      dataToUpdate.telefone = normalizedPhone;
    }
  }

  if (curso !== undefined) {
    if (curso !== null && !curso.trim()) {
      return NextResponse.json({ error: "Curso não pode ser vazio." }, { status: 400 });
    }
    dataToUpdate.curso = curso?.trim() ?? null;
  }

  if (fotoDocumentoUrl !== undefined) {
    if (fotoDocumentoUrl !== null && !fotoDocumentoUrl.trim()) {
      return NextResponse.json({ error: "Foto do documento não pode ser vazia." }, { status: 400 });
    }
    dataToUpdate.foto_documento_url = fotoDocumentoUrl?.trim() ?? null;
  }

  if (rg !== undefined) {
    if (rg === null || !rg.trim()) {
      return NextResponse.json({ error: "RG não pode ser vazio." }, { status: 400 });
    }
    dataToUpdate.RG = rg.trim();
  }

  if (dataNascimento !== undefined) {
    if (dataNascimento === null || dataNascimento.trim() === "") {
      dataToUpdate.data_nascimento = null;
    } else if (Number.isNaN(Date.parse(dataNascimento))) {
      return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
    } else {
      dataToUpdate.data_nascimento = new Date(dataNascimento);
    }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return NextResponse.json({ error: "Nenhum dado para atualizar." }, { status: 400 });
  }

  const updatedUser = await prisma.usuario.update({
    where: { id: user.id },
    data: dataToUpdate,
    select: {
      id: true,
      nome: true,
      email_institucional: true,
      telefone: true,
      curso: true,
      data_nascimento: true,
      foto_documento_url: true,
      reputacao_media: true,
      reputacao_count: true,
      CPF: true,
      RG: true,
    },
  });

  return NextResponse.json({
    user: {
      id: updatedUser.id,
      nome: updatedUser.nome,
      emailInstitucional: updatedUser.email_institucional,
      telefone: updatedUser.telefone,
      curso: updatedUser.curso,
      dataNascimento: updatedUser.data_nascimento
        ? updatedUser.data_nascimento.toISOString()
        : null,
      fotoDocumentoUrl: updatedUser.foto_documento_url,
      reputacaoMedia: updatedUser.reputacao_media,
      reputacaoCount: updatedUser.reputacao_count ?? 0,
      cpf: updatedUser.CPF,
      rg: updatedUser.RG,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const userId = user.id;

      const items = await tx.item.findMany({
        where: { usuario_id: userId },
        select: { id: true },
      });

      const itemIds = items.map((item) => item.id);

      if (itemIds.length > 0) {
        await tx.imagemAnuncio.deleteMany({
          where: { anuncio_id: { in: itemIds } },
        });

        await tx.avaliacaoItem.deleteMany({
          where: { anuncio_id: { in: itemIds } },
        });

        await tx.interesse.deleteMany({
          where: { anuncio_id: { in: itemIds } },
        });

        await tx.favorito.deleteMany({
          where: { anuncio_id: { in: itemIds } },
        });

        await tx.carrinhoItem.deleteMany({
          where: { anuncio_id: { in: itemIds } },
        });
      }

      await tx.carrinhoItem.deleteMany({ where: { usuario_id: userId } });
      await tx.favorito.deleteMany({ where: { usuario_id: userId } });
      await tx.interesse.deleteMany({ where: { usuario_id: userId } });
      await tx.avaliacaoItem.deleteMany({
        where: {
          OR: [{ usuario_id: userId }, { criado_por: userId }],
        },
      });

      await tx.item.deleteMany({ where: { usuario_id: userId } });
      await tx.session.deleteMany({ where: { usuario_id: userId } });
      await tx.usuario.delete({ where: { id: userId } });
    });

    const response = NextResponse.json({ message: "Perfil excluído com sucesso." });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Erro ao excluir perfil:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir o perfil." },
      { status: 500 },
    );
  }
}
