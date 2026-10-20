import { NextResponse } from "next/server";

// Pollinations: geração de imagem gratuita, sem chave. POLLINATIONS_TOKEN (opcional,
// grátis em auth.pollinations.ai) tira a fila e a marca d'água do uso anônimo.
export const maxDuration = 60;

export async function POST(request) {
  const { curso, descricao } = await request.json().catch(() => ({}));
  if (!curso?.trim()) return NextResponse.json({ erro: "Preencha o nome do curso." }, { status: 400 });

  // Em inglês os modelos de imagem entendem melhor; o tema vai entre aspas como veio.
  const prompt = [
    `Colorful children's-book style cartoon illustration promoting a free rural training course about "${curso.trim().slice(0, 150)}".`,
    descricao?.trim() ? `Course: "${descricao.trim().slice(0, 200)}".` : "",
    "Brazilian adults doing the course activity in a sunny countryside setting with fields, plants and blue sky.",
    "Vibrant colors, clean lines. No text, no letters, no logos.",
  ]
    .filter(Boolean)
    .join(" ");

  const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
  url.searchParams.set("width", "768");
  url.searchParams.set("height", "1024");
  url.searchParams.set("nologo", "true");
  url.searchParams.set("seed", String(Math.floor(Math.random() * 1e9)));

  const headers = {};
  if (process.env.POLLINATIONS_TOKEN) headers.Authorization = `Bearer ${process.env.POLLINATIONS_TOKEN}`;

  let res;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(55000) });
  } catch {
    return NextResponse.json({ erro: "O gerador de imagem demorou demais. Tente de novo." }, { status: 504 });
  }
  const tipo = res.headers.get("content-type") || "";
  if (!res.ok || !tipo.startsWith("image/")) {
    const motivo = res.status === 429 ? "muitas imagens seguidas, espere uns segundos" : `erro ${res.status}`;
    return NextResponse.json({ erro: `Não foi possível gerar a imagem: ${motivo}.` }, { status: 502 });
  }

  const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return NextResponse.json({ imagem: `data:${tipo};base64,${b64}` });
}
