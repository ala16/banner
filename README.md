# Gerador de Banners

Site em Next.js para gerar banners de divulgação de cursos (por enquanto só Atibaia).

## Fluxo

1. Tela de login com senha.
2. Escolha da cidade (Atibaia; Bragança e Outro ainda "em breve").
3. Em Atibaia: preencha os campos, envie a imagem do curso, confira a prévia e clique em **Baixar banner (PNG)**.

O banner é desenhado no navegador (canvas 1080x1080) sobre `public/atibaia/fundo.png`.

## Senha

A senha vem da variável de ambiente `SENHA_ACESSO`. No Vercel: Project Settings → Environment Variables → adicionar `SENHA_ACESSO` e fazer um novo deploy. Trocar a senha desloga todo mundo.

## Rodar localmente

```bash
npm install
echo "SENHA_ACESSO=minhasenha" > .env.local
npm run dev
```
