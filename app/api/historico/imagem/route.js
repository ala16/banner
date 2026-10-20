import { NextResponse } from "next/server";

// Repassa a imagem de um banner salvo pelo mesmo domínio, para o editor poder
// recortá-la no canvas sem bloqueio de CORS. Só aceita URLs do Vercel Blob.
export async function GET(request) {
  let url;
  try {
    url = new URL(request.nextUrl.searchParams.get("url") || "");
  } catch {
    return NextResponse.json({ erro: "URL inválida." }, { status: 400 });
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".blob.vercel-storage.com")) {
    return NextResponse.json({ erro: "URL não permitida." }, { status: 400 });
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ erro: "Imagem não encontrada." }, { status: 404 });
  return new NextResponse(res.body, {
    headers: { "content-type": res.headers.get("content-type") || "image/png", "cache-control": "private, max-age=300" },
  });
}
