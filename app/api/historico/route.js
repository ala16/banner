import { del, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { cidadeValida } from "@/lib/cidades";

// Cada banner salvo vira dois arquivos no Vercel Blob:
//   historico/<cidade>/<id>.png (ou .jpg) — a imagem
//   historico/<cidade>/<id>.json         — data, dados do formulário e URL da imagem

function semBlob() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return null;
  return NextResponse.json(
    { erro: "Histórico não configurado: conecte um Blob Store ao projeto no Vercel." },
    { status: 503 }
  );
}

async function listarTudo(prefix) {
  const blobs = [];
  let cursor;
  do {
    const res = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...res.blobs);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function GET(request) {
  const erro = semBlob();
  if (erro) return erro;

  const cidade = request.nextUrl.searchParams.get("cidade");
  if (!cidadeValida(cidade)) return NextResponse.json({ erro: "Cidade inválida." }, { status: 400 });

  const blobs = await listarTudo(`historico/${cidade}/`);
  const itens = await Promise.all(
    blobs
      .filter((b) => b.pathname.endsWith(".json"))
      .map((b) =>
        fetch(b.url, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null)
      )
  );
  const ordenados = itens.filter(Boolean).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  return NextResponse.json({ itens: ordenados });
}

export async function POST(request) {
  const erro = semBlob();
  if (erro) return erro;

  const form = await request.formData();
  const cidade = form.get("cidade");
  const imagem = form.get("imagem");
  const dados = JSON.parse(form.get("dados") || "{}");
  if (!cidadeValida(cidade) || !(imagem instanceof Blob)) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  // Com "id", atualiza um banner do histórico (editado): troca os arquivos e mantém a data de criação.
  const idExistente = String(form.get("id") || "");
  const atualizando = /^\d+$/.test(idExistente);
  const agora = new Date().toISOString();
  const id = atualizando ? idExistente : `${Date.now()}`;
  const criadoEm = atualizando ? form.get("criadoEm") || agora : agora;
  if (atualizando) {
    const antigos = await listarTudo(`historico/${cidade}/${id}`);
    if (antigos.length) await del(antigos.map((b) => b.url));
  }
  const extensao = imagem.type === "image/jpeg" ? "jpg" : "png";
  const opcoes = { access: "public", addRandomSuffix: true };

  const blobImagem = await put(`historico/${cidade}/${id}.${extensao}`, imagem, {
    ...opcoes,
    contentType: imagem.type,
  });
  const item = { id, cidade, criadoEm, dados, imagem: blobImagem.url, arquivo: form.get("arquivo") || `banner.${extensao}`, ...(atualizando && { atualizadoEm: agora }) };
  await put(`historico/${cidade}/${id}.json`, JSON.stringify(item), {
    ...opcoes,
    contentType: "application/json",
  });

  return NextResponse.json({ item });
}

export async function DELETE(request) {
  const erro = semBlob();
  if (erro) return erro;

  const { cidade, id } = await request.json().catch(() => ({}));
  if (!cidadeValida(cidade) || !/^\d+$/.test(String(id))) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  // Ids são timestamps com o mesmo número de dígitos, então o prefixo não pega outro banner.
  const blobs = await listarTudo(`historico/${cidade}/${id}`);
  if (blobs.length) await del(blobs.map((b) => b.url));
  return NextResponse.json({ ok: true });
}
