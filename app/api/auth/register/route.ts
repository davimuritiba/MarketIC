import { NextRequest, NextResponse } from "next/server";

import { attachSessionCookie, createSession, hashPassword } from "@/lib/auth";
import { isValidBrazilianPhone, normalizeBrazilianPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function sanitizeCPF(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCPF(value: string) {
  const cpf = sanitizeCPF(value);

  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map((digit) => Number.parseInt(digit, 10));

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += digits[i] * (10 - i);
  }
  let firstVerifier = (sum * 10) % 11;
  if (firstVerifier === 10) {
    firstVerifier = 0;
  }
  if (digits[9] !== firstVerifier) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += digits[i] * (11 - i);
  }
  let secondVerifier = (sum * 10) % 11;
  if (secondVerifier === 10) {
    secondVerifier = 0;
  }

  return digits[10] === secondVerifier;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@ic\.ufal\.br$/;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function parseBase64Image(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);

  if (!match) {
    return null;
  }

  const [, mimeType, base64Data] = match;
  const paddingMatch = base64Data.match(/=+$/);
  const padding = paddingMatch ? paddingMatch[0].length : 0;
  const sizeInBytes = Math.floor((base64Data.length * 3) / 4) - padding;

  return { mimeType, sizeInBytes };
}

export async function POST(request: NextRequest) {
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

  const normalizedCpf = sanitizeCPF(cpf);
  if (!isValidCPF(normalizedCpf)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  if (!rg || !rg.trim()) {
    return NextResponse.json({ error: "RG é obrigatório." }, { status: 400 });
  }

  if (!telefone || typeof telefone !== "string" || !telefone.trim()) {
    return NextResponse.json({ error: "Telefone é obrigatório." }, { status: 400 });
  }

  const normalizedPhone = normalizeBrazilianPhone(telefone);

  if (!isValidBrazilianPhone(normalizedPhone)) {
    return NextResponse.json(
      {
        error:
          "Informe um telefone válido com DDD e 9 dígitos (ex: (82) 90000-0000).",
      },
      { status: 400 },
    );
  }

  if (!dataNascimento || Number.isNaN(Date.parse(dataNascimento))) {
    return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
  }

  if (!curso || !curso.trim()) {
    return NextResponse.json({ error: "Curso é obrigatório." }, { status: 400 });
  }

  if (!fotoDocumentoUrl || typeof fotoDocumentoUrl !== "string") {
    return NextResponse.json(
      { error: "Foto do documento é obrigatória." },
      { status: 400 },
    );
  }

  const trimmedFotoDocumentoUrl = fotoDocumentoUrl.trim();

  if (!trimmedFotoDocumentoUrl) {
    return NextResponse.json(
      { error: "Foto do documento é obrigatória." },
      { status: 400 },
    );
  }

  const parsedImage = parseBase64Image(trimmedFotoDocumentoUrl);

  if (!parsedImage) {
    return NextResponse.json(
      {
        error:
          "Imagem do documento inválida. Envie um arquivo de imagem válido em formato JPG, PNG ou WEBP.",
      },
      { status: 400 },
    );
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(parsedImage.mimeType.toLowerCase())) {
    return NextResponse.json(
      {
        error:
          "Formato de imagem não suportado. Utilize arquivos JPG, PNG ou WEBP.",
      },
      { status: 400 },
    );
  }

  if (parsedImage.sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "A imagem do documento deve ter no máximo 5MB." },
      { status: 400 },
    );
  }

  const emailNormalizado = emailInstitucional.trim().toLowerCase();
  const existingUser = await prisma.usuario.findUnique({
    where: { email_institucional: emailNormalizado },
  });
  if (existingUser) {
    return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
  }

  const existingCpf = await prisma.usuario.findUnique({
    where: { CPF: normalizedCpf },
  });
  if (existingCpf) {
    return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 });
  }

  const passwordHash = await hashPassword(senha);

  const user = await prisma.usuario.create({
    data: {
      nome: nome.trim(),
      email_institucional: emailNormalizado,
      senha: passwordHash,
      CPF: normalizedCpf,
      RG: rg.trim(),
      telefone: normalizedPhone,
      data_nascimento: new Date(dataNascimento),
      curso: curso.trim(),
      foto_documento_url: trimmedFotoDocumentoUrl,
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
