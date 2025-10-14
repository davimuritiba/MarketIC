import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

// ===========================
//  Criptografia de senhas
// ===========================
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, hashed: string) {
  const [salt, key] = hashed.split(":");
  const derivedKey = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");

  return timingSafeEqual(derivedKey, keyBuffer);
}

// Cria uma nova sessão no banco
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      token,
      usuario_id: userId, // ✅ Corrigido para bater com o schema.prisma
      expiresAt,
    },
  });

  return { token, expiresAt };
}

// Anexa o cookie de sessão à resposta
export function attachSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
) {
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}; Expires=${expiresAt.toUTCString()}`,
  );
}

// Obtém a sessão a partir do cookie
export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { usuario: true }, // opcional, para carregar os dados do usuário
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session;
}

// Destroi a sessão (logout)
export async function deleteSession(token: string) {
  await prisma.session.delete({
    where: { token },
  });
}
