import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE, clearSessionCookie, deleteSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  const response = NextResponse.json({ message: "Sessão encerrada com sucesso" });
  clearSessionCookie(response);

  return response;
}
