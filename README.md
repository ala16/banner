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

## Histórico

Cada banner baixado é salvo no Vercel Blob (`historico/<cidade>/`), com a imagem e os dados do formulário. A página `/historico` lista os banners por cidade, com opções de baixar, reutilizar os dados e apagar. Requer a variável `BLOB_READ_WRITE_TOKEN`, criada automaticamente quando um Blob Store é conectado ao projeto.

## IA (gratuita)

- **Descrição curta (até 8 palavras):** Gemini (`gemini-flash-latest`) pelo plano gratuito do Google AI Studio. Requer `GEMINI_API_KEY` (crie em https://aistudio.google.com/apikey).
- **Imagem do curso:** Pollinations, gratuito e sem chave. `POLLINATIONS_TOKEN` é opcional e tira a fila e a marca d'água.

## Mensagens do WhatsApp

O preenchimento rápido aceita as mensagens copiadas ou exportadas do WhatsApp (`[17/11/2026, 14:37:30] Rose: ...`). A data, a hora e o nome de quem mandou são ignorados, e as linhas "DIAS", "Local", "Contato" e "Período" valem para as mensagens seguintes. "CONTATO NOSSO" usa os telefones padrão do sindicato; outro número ("E O DA igreja 11 995054702") vai para o campo **Outro contato** e aparece no banner como "Contato: Igreja - 11 99505-4702". A conversa colada vira um banner só.
