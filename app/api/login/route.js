import { NextResponse } from "next/server";
import { COOKIE_NAME, tokenFromPassword } from "@/lib/auth";

export async function POST(request) {
  const senha = process.env.SENHA_ACESSO;
  if (!senha) {
    return NextResponse.json(
      { erro: "Senha não configurada no servidor (SENHA_ACESSO)." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body.senha !== senha) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, await tokenFromPassword(senha), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
