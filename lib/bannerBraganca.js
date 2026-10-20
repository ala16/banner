// Desenha o banner de Bragança Paulista (1080x1080) sobre o template, seguindo o modelo:
// foto à esquerda, título dentro da caixa verde e o bloco Datas / Horário / Local embaixo.
// Logos, "Inscrições abertas" e os telefones já fazem parte do template.

import { TAMANHO } from "./bannerAtibaia";

export const PADRAO_BRAGANCA = {
  curso: "",
  descricao: "",
  datas: "",
  horario: "das 8h às 12h e das 13h às 17h",
  local: "",
  vagas: "",
  idade: "",
  telefone: "",
  link: "",
};

export const FOTO_BRAGANCA = { x: 0, y: 13, w: 366, h: 1067 };
const CAIXA = { x: 390, y: 262, w: 664, h: 304 };
const INFO = { x: 393, topo: 598, limite: 956, largura: 672 };
const COR_TEXTO = "#111111";

const fonte = (familia, peso, tamanho) => `${peso} ${tamanho}px ${familia}`;

function quebrarLinhas(ctx, texto, larguraMax) {
  const linhas = [];
  for (const paragrafo of texto.split("\n")) {
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
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

function desenharFoto(ctx, foto) {
  if (!foto) return;
  const { x, y, w, h } = FOTO_BRAGANCA;
  const escala = Math.max(w / foto.width, h / foto.height);
  const sw = w / escala;
  const sh = h / escala;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - 30, y, w + 30, h + 30, 18);
  ctx.clip();
  ctx.drawImage(foto, (foto.width - sw) / 2, (foto.height - sh) / 2, sw, sh, x, y, w, h);
  ctx.restore();
}

// Título: maior fonte que caiba centralizada na caixa verde.
function desenharTitulo(ctx, familia, curso) {
  const titulo = curso.trim().toUpperCase();
  if (!titulo) return;
  let tam = 92;
  let linhas = [];
  for (; tam >= 30; tam -= 2) {
    ctx.font = fonte(familia, 900, tam);
    linhas = quebrarLinhas(ctx, titulo, CAIXA.w);
    const larguraOk = linhas.every((l) => ctx.measureText(l).width <= CAIXA.w);
    if (larguraOk && linhas.length * tam * 1.0 <= CAIXA.h) break;
  }
  const alturaLinha = tam * 1.0;
  let y = CAIXA.y + (CAIXA.h - linhas.length * alturaLinha) / 2;
  ctx.fillStyle = COR_TEXTO;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = fonte(familia, 900, tam);
  for (const linha of linhas) {
    ctx.fillText(linha, CAIXA.x + CAIXA.w / 2, y + tam * 0.06);
    y += alturaLinha;
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Parágrafos com trechos em negrito ([{ texto, peso }]), quebrados palavra a palavra.
function montarLinhas(ctx, familia, tam, paragrafos) {
  const linhas = [];
  for (const segmentos of paragrafos) {
    let linha = [];
    let x = 0;
    for (const s of segmentos) {
      ctx.font = fonte(familia, s.peso, tam);
      for (const pedaco of s.texto.split(/(?<=\s)/)) {
        const w = ctx.measureText(pedaco).width;
        const semEspaco = ctx.measureText(pedaco.trimEnd()).width;
        if (x > 0 && x + semEspaco > INFO.largura) {
          linhas.push(linha);
          linha = [];
          x = 0;
          if (!pedaco.trim()) continue;
        }
        linha.push({ texto: pedaco, peso: s.peso, x });
        x += w;
      }
    }
    linhas.push(linha);
  }
  return linhas;
}

function paragrafosInfo(d) {
  const paragrafos = [];
  const datas = d.datas.split("\n").map((l) => l.trim()).filter(Boolean);
  // "Turma 1 - 6 e 7 de Novembro": a parte antes do traço fica em negrito.
  const linhaData = (l) => {
    const m = l.match(/^(.{1,30}?)\s+[-–]\s+(.+)$/);
    return m ? [{ texto: m[1], peso: 800 }, { texto: ` - ${m[2]}`, peso: 500 }] : [{ texto: l, peso: 500 }];
  };
  if (datas.length === 1 && !/^.{1,30}?\s+[-–]\s+/.test(datas[0])) {
    paragrafos.push([{ texto: "Datas", peso: 800 }, { texto: `: ${datas[0]}`, peso: 500 }]);
  } else if (datas.length) {
    paragrafos.push([{ texto: "Datas", peso: 800 }, { texto: ":", peso: 500 }]);
    datas.forEach((l) => paragrafos.push(linhaData(l)));
  }
  if (d.horario.trim()) {
    paragrafos.push([{ texto: "Horário", peso: 800 }, { texto: `: ${d.horario.trim()}`, peso: 500 }]);
  }
  if (d.local.trim()) {
    const [primeira, ...resto] = d.local.trim().split("\n");
    paragrafos.push([{ texto: "Local", peso: 800 }, { texto: `: ${primeira.trim()}`, peso: 500 }]);
    resto.filter((l) => l.trim()).forEach((l) => paragrafos.push([{ texto: l.trim(), peso: 500 }]));
  }
  return paragrafos;
}

function desenharInformacoes(ctx, familia, d) {
  const paragrafos = paragrafosInfo(d);
  if (!paragrafos.length) return;
  const alturaLinha = (t) => t * 1.2;
  let tam = 38;
  let linhas = montarLinhas(ctx, familia, tam, paragrafos);
  while (tam > 16 && INFO.topo + linhas.length * alturaLinha(tam) > INFO.limite) {
    tam -= 1;
    linhas = montarLinhas(ctx, familia, tam, paragrafos);
  }
  ctx.fillStyle = COR_TEXTO;
  ctx.textBaseline = "alphabetic";
  let y = INFO.topo + tam;
  for (const linha of linhas) {
    for (const s of linha) {
      ctx.font = fonte(familia, s.peso, tam);
      ctx.fillText(s.texto, INFO.x + s.x, y);
    }
    y += alturaLinha(tam);
  }
}

export function desenharBannerBraganca(ctx, { fundo, foto, dados, familia }) {
  ctx.clearRect(0, 0, TAMANHO, TAMANHO);
  ctx.drawImage(fundo, 0, 0, TAMANHO, TAMANHO);
  desenharFoto(ctx, foto);
  desenharTitulo(ctx, familia, dados.curso);
  desenharInformacoes(ctx, familia, dados);
}
