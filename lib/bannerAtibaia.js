// Desenha o banner de Atibaia (1080x1080) num canvas, seguindo o layout do modelo.

import { desenharParceiros } from "./parceiros";

export const TAMANHO = 1080;

export const PADRAO_ATIBAIA = {
  curso: "",
  descricao: "",
  datas: "",
  horario: "8h00 às 17h00",
  local: "",
  vagas: "16",
  idade: "18",
  telefone: "11 97841-4310",
  link: "bit.ly/sindatibaia",
  ocultarVagasIdade: false,
  parceiros: [],
};

const COR_VERDE = "#1e6b3a";
const COR_TITULO = "#2c3a1e";
const COR_TELEFONE = "#e53935";
const COR_DESCRICAO = "#1a4fa0";

// Área da foto à direita, mesma posição do modelo.
export const FOTO = { x: 717, y: 213, w: 363, h: 450 };
// Logos FAESP / SENAR / Sindicato, recortados do modelo na mesma posição.
const LOGOS = { x: 668, y: 70 };

const fonte = (familia, peso, tamanho) => `${peso} ${tamanho}px ${familia}`;

function quebrarLinhas(ctx, texto, larguraMax) {
  const linhas = [];
  for (const paragrafo of texto.split("\n")) {
    const palavras = paragrafo.split(/\s+/).filter(Boolean);
    let atual = "";
    for (const palavra of palavras) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (atual && ctx.measureText(teste).width > larguraMax) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = teste;
      }
    }
    if (atual) linhas.push(atual);
  }
  return linhas;
}

function retanguloArredondado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// Desenha segmentos com pesos diferentes numa linha só, alinhados à direita em `xDireita`.
function linhaDireita(ctx, familia, tamanho, segmentos, xDireita, yBase) {
  const larguras = segmentos.map((s) => {
    ctx.font = fonte(familia, s.peso, tamanho);
    return ctx.measureText(s.texto).width;
  });
  let x = xDireita - larguras.reduce((a, b) => a + b, 0);
  segmentos.forEach((s, i) => {
    ctx.font = fonte(familia, s.peso, tamanho);
    ctx.fillText(s.texto, x, yBase);
    x += larguras[i];
  });
}

function larguraSegmentos(ctx, familia, tamanho, segmentos) {
  return segmentos.reduce((total, s) => {
    ctx.font = fonte(familia, s.peso, tamanho);
    return total + ctx.measureText(s.texto).width;
  }, 0);
}

function desenharCabecalho(ctx, familia, d) {
  const segmentos = [
    { texto: "INSCRIÇÕES: ", cor: COR_VERDE },
    { texto: d.telefone, cor: COR_TELEFONE },
    { texto: d.link ? ` ${d.link}` : "", cor: COR_VERDE },
  ];
  let tamanho = 44;
  ctx.font = fonte(familia, 700, tamanho);
  const medir = () => segmentos.reduce((t, s) => t + ctx.measureText(s.texto).width, 0);
  while (medir() > 1040 && tamanho > 20) {
    tamanho -= 1;
    ctx.font = fonte(familia, 700, tamanho);
  }
  let x = (TAMANHO - medir()) / 2;
  ctx.textBaseline = "alphabetic";
  for (const s of segmentos) {
    ctx.fillStyle = s.cor;
    ctx.fillText(s.texto, x, 54);
    x += ctx.measureText(s.texto).width;
  }

  ctx.fillStyle = COR_VERDE;
  ctx.font = fonte(familia, 800, 62);
  ctx.fillText("S.R. ATIBAIA", 46, 148);
}

function desenharFoto(ctx, foto) {
  if (!foto) return;
  const escala = Math.max(FOTO.w / foto.width, FOTO.h / foto.height);
  const sw = FOTO.w / escala;
  const sh = FOTO.h / escala;
  const sx = (foto.width - sw) / 2;
  const sy = (foto.height - sh) / 2;
  ctx.drawImage(foto, sx, sy, sw, sh, FOTO.x, FOTO.y, FOTO.w, FOTO.h);
}

// Título grande + descrição curta, centralizados na coluna da esquerda.
function desenharTituloEDescricao(ctx, familia, d, base = 665) {
  const colunaX = 8;
  const colunaW = 700;
  const centroX = colunaX + colunaW / 2;
  const topo = 205;

  const titulo = d.curso.trim().toUpperCase();
  const descricao = d.descricao.trim();

  // Descrição: tamanho fixo, quebra em até ~600px.
  const tamDesc = 32;
  const alturaLinhaDesc = tamDesc * 1.3;
  const paddingDesc = 16;
  ctx.font = fonte(familia, 600, tamDesc);
  const linhasDesc = descricao ? quebrarLinhas(ctx, descricao, 600) : [];
  const alturaDesc = linhasDesc.length ? linhasDesc.length * alturaLinhaDesc + paddingDesc * 2 : 0;
  const espaco = linhasDesc.length ? 24 : 0;

  // Título: maior fonte que caiba no espaço restante.
  const alturaDisponivel = base - topo - alturaDesc - espaco;
  let tam = 108;
  let linhasTitulo = [];
  for (; tam >= 36; tam -= 2) {
    ctx.font = fonte(familia, 900, tam);
    linhasTitulo = titulo ? quebrarLinhas(ctx, titulo, colunaW - 10) : [];
    const larguraOk = linhasTitulo.every((l) => ctx.measureText(l).width <= colunaW - 10);
    if (larguraOk && linhasTitulo.length * tam * 0.98 <= alturaDisponivel) break;
  }
  const alturaLinhaTitulo = tam * 0.98;
  const alturaTitulo = linhasTitulo.length * alturaLinhaTitulo;

  let y = topo + (base - topo - (alturaTitulo + espaco + alturaDesc)) / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = COR_TITULO;
  ctx.font = fonte(familia, 900, tam);
  for (const linha of linhasTitulo) {
    ctx.fillText(linha, centroX, y + tam * 0.02);
    y += alturaLinhaTitulo;
  }
  y += espaco;

  if (linhasDesc.length) {
    ctx.font = fonte(familia, 600, tamDesc);
    const larguraCaixa = Math.max(...linhasDesc.map((l) => ctx.measureText(l).width)) + paddingDesc * 2;
    ctx.fillStyle = "rgba(232, 236, 240, 0.85)";
    retanguloArredondado(ctx, centroX - larguraCaixa / 2, y, larguraCaixa, alturaDesc, 14);
    ctx.fillStyle = COR_DESCRICAO;
    let yl = y + paddingDesc + (alturaLinhaDesc - tamDesc) / 2;
    for (const linha of linhasDesc) {
      ctx.fillText(linha, centroX, yl);
      yl += alturaLinhaDesc;
    }
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Informações em faixas escuras translúcidas, alinhadas à direita, na parte de baixo.
function desenharInformacoes(ctx, familia, d) {
  const xDireita = 1050;
  const larguraMax = 1020;
  const topo = 680;
  const limite = 1068;

  const montarLinhas = (tam) => {
    const linhas = [];
    const partes = ["CURSO GRATUITO"];
    if (!d.ocultarVagasIdade) {
      if (d.vagas.trim()) partes.push(`${d.vagas.trim()} vagas`);
      if (d.idade.trim()) partes.push(`mais de ${d.idade.trim()} anos`);
    }
    linhas.push([{ texto: partes.join(" - "), peso: 500 }]);
    if (d.datas.trim()) {
      linhas.push([
        { texto: "Datas: ", peso: 800 },
        { texto: d.datas.trim(), peso: 800 },
      ]);
    }
    if (d.horario.trim()) {
      linhas.push([
        { texto: "Horário: ", peso: 800 },
        { texto: d.horario.trim(), peso: 500 },
      ]);
    }
    if (d.local.trim()) {
      ctx.font = fonte(familia, 800, tam);
      for (const l of quebrarLinhas(ctx, `Local: ${d.local.trim()}`, larguraMax)) {
        linhas.push([{ texto: l, peso: 800 }]);
      }
    }
    return linhas;
  };

  let tam = 46;
  let linhas = montarLinhas(tam);
  const alturaLinha = (t) => t * 1.42;
  while (tam > 18) {
    const cabe = topo + linhas.length * alturaLinha(tam) <= limite;
    const larguraOk = linhas.every((l) => larguraSegmentos(ctx, familia, tam, l) <= larguraMax);
    if (cabe && larguraOk) break;
    tam -= 1;
    linhas = montarLinhas(tam);
  }

  // Ancorado embaixo, como no modelo.
  const h = alturaLinha(tam);
  let y = limite - linhas.length * h;
  for (const segmentos of linhas) {
    const w = larguraSegmentos(ctx, familia, tam, segmentos);
    ctx.fillStyle = "rgba(55, 60, 45, 0.55)";
    retanguloArredondado(ctx, xDireita - w - 14, y + 2, w + 28, h - 4, 10);
    ctx.fillStyle = "#ffffff";
    linhaDireita(ctx, familia, tam, segmentos, xDireita, y + h / 2 + tam * 0.36);
    y += h;
  }
}

export function desenharBannerAtibaia(ctx, { fundo, logos, foto, dados, familia, parceiros = [] }) {
  ctx.clearRect(0, 0, TAMANHO, TAMANHO);
  ctx.drawImage(fundo, 0, 0, TAMANHO, TAMANHO);
  if (logos) ctx.drawImage(logos, LOGOS.x, LOGOS.y);
  desenharCabecalho(ctx, familia, dados);
  desenharFoto(ctx, foto);
  // Com logos de parceiros, o título sobe e os logos ocupam o pé da coluna da esquerda.
  desenharTituloEDescricao(ctx, familia, dados, parceiros.length ? 580 : 665);
  desenharParceiros(ctx, parceiros, { x: 40, y: 592, w: 636, h: 78 });
  desenharInformacoes(ctx, familia, dados);
}
