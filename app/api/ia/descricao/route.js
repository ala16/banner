import { NextResponse } from "next/server";

// Gemini pelo plano gratuito do Google AI Studio (chave em aistudio.google.com/apikey).
const MODELO = process.env.GEMINI_MODELO || "gemini-flash-latest";
const MAX_PALAVRAS = 8;

const INSTRUCOES = `Você escreve a descrição curta de banners de cursos rurais gratuitos do SENAR / Sindicato Rural.
Dado o nome do curso, escreva UMA frase em português do Brasil, com no máximo ${MAX_PALAVRAS} palavras, que explique o que o aluno aprende ou faz no curso, indo além do nome (não repita o nome do curso).
Estilo dos exemplos: "Aprende-se a planejar viagens escolares educativas no campo." / "Técnicas para produzir peças úteis e decorativas."
Responda somente com a frase, sem aspas e sem comentários.`;

export async function POST(request) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    return NextResponse.json(
      { erro: "IA não configurada: adicione GEMINI_API_KEY nas variáveis do Vercel." },
      { status: 503 }
    );
  }

  const { curso } = await request.json().catch(() => ({}));
  if (!curso?.trim()) return NextResponse.json({ erro: "Preencha o nome do curso." }, { status: 400 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": chave, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: INSTRUCOES }] },
        contents: [{ role: "user", parts: [{ text: `Nome do curso: ${curso.trim().slice(0, 200)}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const motivo =
      res.status === 429
        ? "limite gratuito do Gemini atingido, tente de novo em alguns minutos"
        : data?.error?.message || `erro ${res.status}`;
    return NextResponse.json({ erro: `Não foi possível gerar: ${motivo}.` }, { status: 502 });
  }

  const texto = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join(" ")
    .replace(/["“”*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!texto) return NextResponse.json({ erro: "A IA não devolveu texto. Tente de novo." }, { status: 502 });

  // Garante o limite mesmo se a IA passar dele.
  const palavras = texto.split(" ");
  let descricao = palavras.slice(0, MAX_PALAVRAS).join(" ");
  if (palavras.length > MAX_PALAVRAS) descricao = descricao.replace(/[,;:\s]+$/, "") + ".";

  return NextResponse.json({ descricao });
}
