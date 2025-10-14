import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE, clearSessionCookie, deleteSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);

  return response;
}
