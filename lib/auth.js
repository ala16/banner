export const COOKIE_NAME = "banner_auth";

// Token salvo no cookie: hash da senha configurada, assim trocar a senha
// no Vercel invalida todos os logins antigos.
export async function tokenFromPassword(senha) {
  const data = new TextEncoder().encode(`banner:${senha}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
