import { NextRequest, NextResponse } from "next/server";

import { attachSessionCookie, createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@ic\.ufal\.br$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { emailInstitucional, senha } = body as {
    emailInstitucional?: string;
    senha?: string;
  };

  if (!emailInstitucional || !EMAIL_REGEX.test(emailInstitucional)) {
    return NextResponse.json(
      { error: "Informe um email institucional válido (ex: nome@ic.ufal.br)." },
      { status: 400 },
    );
  }

  if (!senha || !senha.trim()) {
    return NextResponse.json(
      { error: "Informe email institucional e senha." },
      { status: 400 },
    );
  }

  const emailNormalizado = emailInstitucional.trim().toLowerCase();

  try {
    const user = await prisma.usuario.findUnique({
      where: { email_institucional: emailNormalizado },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const isValid = await verifyPassword(senha, user.senha);
    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    await prisma.session.deleteMany({ where: { usuario_id: user.id } });
    const session = await createSession(user.id);

    const response = NextResponse.json({
      message: "Login realizado com sucesso.",
      user: {
        id: user.id,
        nome: user.nome,
        emailInstitucional: user.email_institucional,
        curso: user.curso,
        telefone: user.telefone,
        reputacaoMedia: user.reputacao_media,
        reputacaoCount: user.reputacao_count ?? 0,
      },
    });

    attachSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    console.error("Erro ao processar login", error);
    return NextResponse.json(
      { error: "Não foi possível realizar o login. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
