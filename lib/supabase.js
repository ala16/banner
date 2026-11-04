// Histórico no Supabase: tabelas fechadas, acessadas só pelas funções banner_*
// (ver a migração banner_historico), que exigem BANNER_TOKEN.

export const supabaseConfigurado = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.BANNER_TOKEN);

export async function rpc(funcao, parametros) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${funcao}`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: process.env.BANNER_TOKEN, ...parametros }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Supabase ${res.status}`);
  return data;
}

// Formato que o site usa para cada item do histórico.
export const paraItem = (linha) => ({
  id: String(linha.id),
  cidade: linha.cidade,
  criadoEm: linha.criado_em,
  ...(linha.atualizado_em && { atualizadoEm: linha.atualizado_em }),
  dados: linha.dados,
  arquivo: linha.arquivo,
  imagem: `/api/historico/imagem?id=${linha.id}`,
});
