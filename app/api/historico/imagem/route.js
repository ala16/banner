import { NextResponse } from "next/server";
import { rpc, supabaseConfigurado } from "@/lib/supabase";

// Imagem de um banner salvo. Com ?download=1, vem como arquivo para baixar.
export async function GET(request) {
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!/^\d+$/.test(id) || !supabaseConfigurado()) {
    return NextResponse.json({ erro: "Imagem não encontrada." }, { status: 404 });
  }
  try {
    const [linha] = await rpc("banner_imagem", { p_id: id });
    if (!linha) return NextResponse.json({ erro: "Imagem não encontrada." }, { status: 404 });
    const headers = { "content-type": linha.tipo, "cache-control": "private, max-age=86400" };
    if (request.nextUrl.searchParams.get("download")) {
      headers["content-disposition"] = `attachment; filename="${(linha.arquivo || "banner.png").replace(/"/g, "")}"`;
    }
    return new NextResponse(Buffer.from(linha.imagem, "base64"), { headers });
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
