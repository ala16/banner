import { NextResponse } from "next/server";
import { cidadeValida } from "@/lib/cidades";
import { paraItem, rpc, supabaseConfigurado } from "@/lib/supabase";

// Cada banner salvo é uma linha em banner_historico (Supabase), com a imagem junto.

function semConfiguracao() {
  if (supabaseConfigurado()) return null;
  return NextResponse.json({ erro: "Histórico não configurado (variáveis do Supabase)." }, { status: 503 });
}

const erroServidor = (e) => NextResponse.json({ erro: e.message }, { status: 500 });

export async function GET(request) {
  const erro = semConfiguracao();
  if (erro) return erro;

  const cidade = request.nextUrl.searchParams.get("cidade");
  if (!cidadeValida(cidade)) return NextResponse.json({ erro: "Cidade inválida." }, { status: 400 });

  try {
    const linhas = await rpc("banner_listar", { p_cidade: cidade });
    return NextResponse.json({ itens: linhas.map(paraItem) });
  } catch (e) {
    return erroServidor(e);
  }
}

export async function POST(request) {
  const erro = semConfiguracao();
  if (erro) return erro;

  const form = await request.formData();
  const cidade = form.get("cidade");
  const imagem = form.get("imagem");
  const dados = JSON.parse(form.get("dados") || "{}");
  if (!cidadeValida(cidade) || !(imagem instanceof Blob)) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  // Com "id", atualiza um banner do histórico (editado) e mantém a data de criação.
  const idExistente = String(form.get("id") || "");
  const id = /^\d+$/.test(idExistente) ? idExistente : `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const extensao = imagem.type === "image/jpeg" ? "jpg" : "png";

  try {
    const [linha] = await rpc("banner_salvar", {
      p_id: id,
      p_cidade: cidade,
      p_dados: dados,
      p_arquivo: form.get("arquivo") || `banner.${extensao}`,
      p_tipo: imagem.type || "image/png",
      p_imagem: Buffer.from(await imagem.arrayBuffer()).toString("base64"),
    });
    return NextResponse.json({ item: paraItem(linha) });
  } catch (e) {
    return erroServidor(e);
  }
}

export async function DELETE(request) {
  const erro = semConfiguracao();
  if (erro) return erro;

  const { cidade, id } = await request.json().catch(() => ({}));
  if (!cidadeValida(cidade) || !/^\d+$/.test(String(id))) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }
  try {
    await rpc("banner_apagar", { p_id: String(id) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroServidor(e);
  }
}
