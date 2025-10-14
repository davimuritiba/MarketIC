import { NextResponse } from "next/server";

import { attachSessionCookie, createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@ic\.ufal\.br$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const {
    nome,
    emailInstitucional,
    senha,
    cpf,
    rg,
    telefone,
    dataNascimento,
    curso,
    fotoDocumentoUrl,
  } = body as {
    nome?: string;
    emailInstitucional?: string;
    senha?: string;
    cpf?: string;
    rg?: string;
    telefone?: string;
    dataNascimento?: string;
    curso?: string;
    fotoDocumentoUrl?: string;
  };

  if (!nome || !nome.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  if (!emailInstitucional || !EMAIL_REGEX.test(emailInstitucional)) {
    return NextResponse.json(
      { error: "Informe um email institucional válido (ex: nome@ic.ufal.br)." },
      { status: 400 },
    );
  }

  if (!senha || senha.length < 8) {
    return NextResponse.json(
      { error: "A senha precisa ter ao menos 8 caracteres." },
      { status: 400 },
    );
  }

  if (!cpf || !cpf.trim()) {
    return NextResponse.json({ error: "CPF é obrigatório." }, { status: 400 });
  }

  if (!rg || !rg.trim()) {
    return NextResponse.json({ error: "RG é obrigatório." }, { status: 400 });
  }

  if (!telefone || !telefone.trim()) {
    return NextResponse.json({ error: "Telefone é obrigatório." }, { status: 400 });
  }

  if (!dataNascimento || Number.isNaN(Date.parse(dataNascimento))) {
    return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
  }

  if (!curso || !curso.trim()) {
    return NextResponse.json({ error: "Curso é obrigatório." }, { status: 400 });
  }

  // if (!fotoDocumentoUrl || !fotoDocumentoUrl.trim()) {
  //   return NextResponse.json({ error: "Foto do documento é obrigatória." }, { status: 400 });
  // }

  const emailNormalizado = emailInstitucional.trim().toLowerCase();
  const existingUser = await prisma.usuario.findUnique({
    where: { email_institucional: emailNormalizado },
  });
  if (existingUser) {
    return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
  }

  const passwordHash = await hashPassword(senha);

  const user = await prisma.usuario.create({
    data: {
      nome: nome.trim(),
      email_institucional: emailNormalizado,
      senha: passwordHash,
      CPF: cpf.trim(),
      RG: rg.trim(),
      telefone: telefone.trim(),
      data_nascimento: new Date(dataNascimento),
      curso: curso.trim(),
      foto_documento_url: (fotoDocumentoUrl ?? "").trim(),
    },
    select: {
      id: true,
      nome: true,
      email_institucional: true,
      curso: true,
      telefone: true,
      data_nascimento: true,
      foto_documento_url: true,
      reputacao_media: true,
      reputacao_count: true,
    },
  });

  const session = await createSession(user.id);

  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        nome: user.nome,
        emailInstitucional: user.email_institucional,
        curso: user.curso,
        telefone: user.telefone,
        dataNascimento: user.data_nascimento.toISOString(),
        fotoDocumentoUrl: user.foto_documento_url,
        reputacaoMedia: user.reputacao_media,
        reputacaoCount: user.reputacao_count ?? 0,
      },
    },
    { status: 201 },
  );

  attachSessionCookie(response, session.token, session.expiresAt);

  return response;
}
