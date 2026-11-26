// Lê mensagens copiadas ou exportadas do WhatsApp, uma informação por mensagem:
//
//   [17/11/2026, 14:37:30] Rose Sindicato Bragança: PROCESSAMENTO CASEIRO DE CARNE BOVINA
//   [17/11/2026, 14:37:57] Rose Sindicato Bragança: DIAS
//   25/26/27 de Novembro
//   [17/11/2026, 14:38:01] Rose Sindicato Bragança: Local
//   [17/11/2026, 14:38:21] Rose Sindicato Bragança: IGREJA SÃO BENEDITO
//   [17/11/2026, 14:38:38] Rose Sindicato Bragança: CONTATO NOSSO
//   [17/11/2026, 14:40:05] Rose Sindicato Bragança: E O DA igreja 11 995054702
//   [17/11/2026, 14:40:26] Rose Sindicato Bragança: Período INTEGRAL
//   [17/11/2026, 14:41:00] Rose Sindicato Bragança: 8:00/12:00   13:00/17:00
//
// Tira data, hora e autor de cada linha e lê os rótulos ("DIAS", "Local", "Contato",
// "Período") como cabeçalhos das linhas seguintes.

import { preencherDoTexto } from "./preenchimentoRapido.js";

const semAcento = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// "[17/11/2026, 14:37:30] Nome: " (exportação no iPhone), "[14:37, 17/11/2026] Nome: "
// (copiado do WhatsApp Web) ou "17/11/2026 14:37 - Nome: " (exportação no Android).
const DATA = String.raw`\d{1,2}\/\d{1,2}\/\d{2,4}`;
const HORA = String.raw`\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s?m\.?)?`;
const RE_PREFIXO = new RegExp(
  String.raw`^\s*(?:\[\s*(?:${DATA},?\s+${HORA}|${HORA},?\s+${DATA})\s*\]|${DATA},?\s+${HORA}\s+-)\s*[^:\n]{1,60}?:\s?`,
  "i"
);

// Marcas invisíveis que o WhatsApp põe no texto copiado.
const limparInvisiveis = (texto) => texto.replace(/[‎‏‪-‮⁦-⁩﻿]/g, "");

const ROTULO = /^(dias?|datas?|local|endereco|contatos?|telefones?|periodo|horarios?)\b\s*:?\s*(.*)$/;

// Tem data/hora/autor do WhatsApp, ou o mesmo texto sem eles (com rótulos como "DIAS", "Local").
export function pareceWhatsApp(texto) {
  const linhas = limparInvisiveis(texto).split("\n").map((l) => l.trim()).filter(Boolean);
  if (linhas.some((l) => RE_PREFIXO.test(l))) return true;
  if (linhas.length <= 2) return false;
  const simples = linhas.map(semAcento);
  // "DIAS" ou "Local" sozinhos numa linha, "CONTATO NOSSO", "Período INTEGRAL",
  // ou duas linhas começando com rótulo ("Dias: 25/26", "Local: Igreja").
  return (
    simples.some((l) => /^(dias?|datas?|local|contatos?|periodo)\s*:?$/.test(l)) ||
    simples.some((l) => /^contatos?\s+(?:e\s+)?(?:o\s+)?(?:nosso|do\s+sindicato)\b|^periodo\s*:?\s*(?:integral|manha|tarde)\b/.test(l)) ||
    simples.filter((l) => ROTULO.test(l) && /^\p{L}+\s*:/u.test(l)).length >= 2
  );
}

// Cada mensagem sem data, hora e autor. Linhas sem prefixo continuam a mensagem de cima.
export function linhasDasMensagens(texto) {
  return limparInvisiveis(texto)
    .split("\n")
    .map((l) => l.replace(RE_PREFIXO, "").trim())
    .filter(Boolean);
}

const PEQUENAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "a", "o"]);

// "IGREJA SÃO BENEDITO" -> "Igreja São Benedito". Texto já com minúsculas fica como está.
function nomeProprio(texto) {
  if (texto !== texto.toUpperCase()) return texto;
  return texto
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i && PEQUENAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

// "PROCESSAMENTO CASEIRO" -> "Processamento caseiro".
function frase(texto) {
  const t = texto === texto.toUpperCase() ? texto.toLowerCase() : texto;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Telefone com DDD: "11 995054702", "(11) 99505-4702", "11 4034-0440".
const RE_TELEFONE = /(?:\+?55\s*)?\(?\b(\d{2})\)?[\s.-]*(9?\d{4})[\s.-]?(\d{4})\b/;

function formatarTelefone(m) {
  return `${m[1]} ${m[2]}-${m[3]}`;
}

// "E O DA igreja 11 995054702" -> "Igreja - 11 99505-4702"
function contatoDaLinha(linha) {
  const m = linha.match(RE_TELEFONE);
  const nome = linha
    .replace(m[0], " ")
    .replace(/^\s*(?:e\s+)?(?:o\s+|os\s+)?(?:contato\s+|telefone\s+|whats(?:app)?\s+|numero\s+|número\s+)?(?:d[aoe]s?\s+)?/i, "")
    .replace(/[:\-–,]+\s*$|^\s*[:\-–,]+/g, "")
    .trim();
  const telefone = formatarTelefone(m);
  return nome ? `${frase(nome)} - ${telefone}` : telefone;
}

// "8:00/12:00   13:00/17:00", "8h às 12h e 13h às 17h" -> "das 8h às 12h e das 13h às 17h"
const RE_HORA = String.raw`(\d{1,2})\s*(?:[:h]\s*(\d{2})?\s*h?)`;
const RE_INTERVALO = new RegExp(String.raw`${RE_HORA}\s*(?:\/|-|–|a|as|às|ate|até)\s*${RE_HORA}`, "gi");

function horarioDaLinha(linha) {
  const hora = (h, min) => `${parseInt(h, 10)}h${min && min !== "00" ? min : ""}`;
  const intervalos = [...linha.matchAll(RE_INTERVALO)].map((m) => `das ${hora(m[1], m[2])} às ${hora(m[3], m[4])}`);
  return intervalos.length ? intervalos.join(" e ") : null;
}

const PERIODOS = {
  integral: "das 8h às 12h e das 13h às 17h",
  manha: "das 8h às 12h",
  tarde: "das 13h às 17h",
};

// "25/26/27 de Novembro" são três dias, não dia/mês/ano: vira "25, 26 e 27 de Novembro".
function datasDaLinha(linha) {
  let texto = linha;
  const barras = texto.match(/^\s*(\d{1,2}(?:\s*\/\s*\d{1,2})+)(\s+de\s+\p{L}+.*)?$/u);
  if (barras && (barras[2] || barras[1].split("/").length > 2)) {
    const dias = barras[1].split("/").map((d) => d.trim());
    const ultimo = dias.pop();
    texto = `${dias.join(", ")} e ${ultimo}${barras[2] || ""}`;
  }
  return preencherDoTexto(`dias ${texto}`).datas || null;
}

const pareceData = (linha) =>
  /^\s*(?:dias?\s+)?\d{1,2}(?:\s*(?:\/|,|-|–|\be\b|\ba\b)\s*\d{1,2})*(?:\s*\/\s*\d{2,4})?(?:\s+de\s+\p{L}+)?\s*$/iu.test(linha);

// Lê um curso do texto do WhatsApp. Devolve os campos que reconheceu, como preencherDoTexto,
// e mais: contatoSindicato (usar os telefones padrão do sindicato), contatoExtra e gratuito.
export function lerMensagemWhatsApp(texto, locais = []) {
  const r = {};
  const cursoPartes = [];
  const localPartes = [];
  const datas = [];
  const horarios = [];
  const contatos = [];
  let secao = null;
  let periodo = null;

  for (const linha of linhasDasMensagens(texto)) {
    const simples = semAcento(linha);
    const rotulo = simples.match(ROTULO);
    // O texto depois do rótulo, com as maiúsculas originais.
    let valor = linha;
    if (rotulo) {
      const nome = rotulo[1];
      secao = nome.startsWith("dia") || nome.startsWith("data") ? "datas"
        : nome === "local" || nome === "endereco" ? "local"
        : nome.startsWith("contato") || nome.startsWith("telefone") ? "contato"
        : "horario";
      valor = linha.slice(linha.length - rotulo[2].length).trim();
      if (!valor) continue;
      if (secao === "contato" && /^(?:e\s+)?(?:o\s+)?(?:nosso|do\s+sindicato|sindicato)\b/i.test(semAcento(valor)) && !RE_TELEFONE.test(valor)) {
        r.contatoSindicato = true;
        continue;
      }
      if (secao === "horario") {
        const p = Object.keys(PERIODOS).find((k) => semAcento(valor).startsWith(k));
        if (p) {
          periodo = p;
          const resto = horarioDaLinha(valor);
          if (resto) horarios.push(resto);
          continue;
        }
      }
    }

    if (/gratuit/.test(simples) && simples.split(/\s+/).length <= 4) {
      r.gratuito = true;
      continue;
    }
    if (/^(?:e\s+)?(?:o\s+)?(?:contato\s+)?(?:nosso|do\s+sindicato)$/.test(semAcento(valor))) {
      r.contatoSindicato = true;
      continue;
    }
    if (RE_TELEFONE.test(valor)) {
      contatos.push(contatoDaLinha(valor));
      continue;
    }
    const horario = horarioDaLinha(valor);
    if (horario) {
      horarios.push(horario);
      continue;
    }
    if ((secao === "datas" || !secao) && pareceData(valor)) {
      const d = datasDaLinha(valor);
      if (d) {
        datas.push(d);
        continue;
      }
    }
    if (secao === "local") localPartes.push(valor);
    else if (!secao || (!cursoPartes.length && secao !== "datas")) cursoPartes.push(valor);
  }

  if (cursoPartes.length) r.curso = frase(cursoPartes.join(" ").replace(/\s+/g, " ").trim());
  if (datas.length) r.datas = datas.join(" e ");
  if (horarios.length) r.horario = horarios.join(" e ");
  else if (periodo) r.horario = PERIODOS[periodo];

  if (localPartes.length) {
    const juntos = semAcento(localPartes.join(" "));
    const salvo = [...locais]
      .filter((l) => l.nome.trim())
      .sort((a, b) => b.nome.length - a.nome.length)
      .find((l) => new RegExp(`\\b${semAcento(l.nome.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(juntos));
    r.local = salvo ? salvo.endereco : localPartes.map(nomeProprio).join("\n");
  }
  if (contatos.length) r.contatoExtra = contatos.join("\n");
  return r;
}
