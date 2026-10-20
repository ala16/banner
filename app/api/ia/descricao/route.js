import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const MAX_PALAVRAS = 8;

const INSTRUCOES = `Você escreve a descrição curta de banners de cursos rurais gratuitos do SENAR / Sindicato Rural.
Dado o nome do curso, escreva UMA frase em português do Brasil, com no máximo ${MAX_PALAVRAS} palavras, que explique o que o aluno aprende ou faz no curso, indo além do nome (não repita o nome do curso).
Estilo dos exemplos: "Aprende-se a planejar viagens escolares educativas no campo." / "Técnicas para produzir peças úteis e decorativas."
Responda somente com a frase, sem aspas e sem comentários.`;

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { erro: "IA não configurada: adicione ANTHROPIC_API_KEY nas variáveis do Vercel." },
      { status: 503 }
    );
  }

  const { curso } = await request.json().catch(() => ({}));
  if (!curso?.trim()) return NextResponse.json({ erro: "Preencha o nome do curso." }, { status: 400 });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      // Se o modelo recusar, o próprio servidor tenta de novo com outro modelo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: INSTRUCOES,
      messages: [{ role: "user", content: `Nome do curso: ${curso.trim().slice(0, 200)}` }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ erro: "A IA não conseguiu sugerir uma descrição para esse curso." }, { status: 422 });
    }

    const texto = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .replace(/["“”]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Garante o limite mesmo se a IA passar dele.
    const palavras = texto.split(" ").filter(Boolean);
    let descricao = palavras.slice(0, MAX_PALAVRAS).join(" ");
    if (palavras.length > MAX_PALAVRAS) descricao = descricao.replace(/[,;:\s]+$/, "") + ".";

    return NextResponse.json({ descricao });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ erro: "Chave ANTHROPIC_API_KEY inválida." }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ erro: "Muitas solicitações. Tente de novo em instantes." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ erro: `Erro da IA (${error.status}).` }, { status: 502 });
    }
    throw error;
  }
}
