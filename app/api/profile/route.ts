import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
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

  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: usuario.id,
      nome: usuario.nome,
      emailInstitucional: usuario.email_institucional,
      telefone: usuario.telefone,
      curso: usuario.curso,
      dataNascimento: usuario.data_nascimento.toISOString(),
      fotoDocumentoUrl: usuario.foto_documento_url,
      reputacaoMedia: usuario.reputacao_media,
      reputacaoCount: usuario.reputacao_count ?? 0,
      cpf: usuario.CPF,
      rg: usuario.RG,
    },
  });
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
    dataNascimento,
  } = body as {
    nome?: string | null;
    telefone?: string | null;
    curso?: string | null;
    fotoDocumentoUrl?: string | null;
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
    if (telefone !== null && !telefone.trim()) {
      return NextResponse.json({ error: "Telefone não pode ser vazio." }, { status: 400 });
    }
    dataToUpdate.telefone = telefone?.trim() ?? null;
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
      dataNascimento: updatedUser.data_nascimento.toISOString(),
      fotoDocumentoUrl: updatedUser.foto_documento_url,
      reputacaoMedia: updatedUser.reputacao_media,
      reputacaoCount: updatedUser.reputacao_count ?? 0,
      cpf: updatedUser.CPF,
      rg: updatedUser.RG,
    },
  });
}
