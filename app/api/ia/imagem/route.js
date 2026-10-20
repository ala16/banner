import { NextResponse } from "next/server";

// Gerar imagem pode levar mais de 30 segundos.
export const maxDuration = 60;

export async function POST(request) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) {
    return NextResponse.json(
      { erro: "Geração de imagem não configurada: adicione OPENAI_API_KEY nas variáveis do Vercel." },
      { status: 503 }
    );
  }

  const { curso, descricao } = await request.json().catch(() => ({}));
  if (!curso?.trim()) return NextResponse.json({ erro: "Preencha o nome do curso." }, { status: 400 });

  const prompt = [
    `Ilustração colorida em estilo de livro infantil/cartoon, para divulgar um curso rural gratuito chamado "${curso.trim().slice(0, 200)}".`,
    descricao?.trim() ? `O curso: ${descricao.trim().slice(0, 300)}` : "",
    "Mostre pessoas adultas brasileiras praticando a atividade do curso, num ambiente rural ensolarado, com campo, plantas e céu azul.",
    "Formato retrato, cores vivas, traço limpo. Não escreva nenhum texto, letra ou logotipo na imagem.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "medium",
      output_format: "jpeg",
      n: 1,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const motivo = data?.error?.message ? `: ${data.error.message}` : "";
    return NextResponse.json({ erro: `Erro ao gerar imagem (${res.status})${motivo}` }, { status: 502 });
  }
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) return NextResponse.json({ erro: "A IA não devolveu imagem." }, { status: 502 });

  return NextResponse.json({ imagem: `data:image/jpeg;base64,${b64}` });
}
