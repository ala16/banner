import { NextResponse } from "next/server";
import { COOKIE_NAME, tokenFromPassword } from "@/lib/auth";

export async function middleware(request) {
  const senha = process.env.SENHA_ACESSO;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;

  if (senha && cookie && cookie === (await tokenFromPassword(senha))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Tudo exige login, exceto a própria tela de login, a API de login e arquivos do Next.
  matcher: ["/((?!login|api/login|_next/|favicon.ico).*)"],
};
