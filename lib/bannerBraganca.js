// Desenha o banner de Bragança Paulista (1080x1080) sobre o template, seguindo o modelo:
// foto à esquerda, título dentro da caixa verde e o bloco Datas / Horário / Local embaixo.
// Logos, "Inscrições abertas" e os telefones já fazem parte do template.

import { TAMANHO } from "./bannerAtibaia";
import { desenharParceiros } from "./parceiros";

export const PADRAO_BRAGANCA = {
  curso: "",
  descricao: "",
  datas: "",
  horario: "das 8h às 12h e das 13h às 17h",
  local: "",
  vagas: "",
  idade: "",
  telefone: "11 4034-0440",
  celular: "11 94442-2266",
  // Outro telefone além dos do sindicato ("Igreja - 11 99505-4702"), um por linha.
  contatoExtra: "",
  link: "",
  parceiros: [],
  mostrarApoio: false,
  apoio: "Secretaria Municipal dos Agronegócios de Bragança Paulista",
  // Segundo curso no mesmo banner.
  doisCursos: false,
  curso2: "",
  datas2: "",
};

const temDoisCursos = (d) => Boolean(d.doisCursos && d.curso2?.trim());

export const FOTO_BRAGANCA = { x: 0, y: 13, w: 366, h: 1067 };
const CAIXA = { x: 390, y: 262, w: 664, h: 304 };
const INFO = { x: 393, topo: 598, limite: 956, largura: 672 };
const COR_TEXTO = "#111111";
const COR_CAIXA = "#3eb84d";

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

// Título: maior fonte que caiba centralizada na caixa verde. Com dois cursos,
// os nomes ficam um embaixo do outro, separados por uma linha verde.
function desenharTitulo(ctx, familia, d) {
  const titulos = (temDoisCursos(d) ? [d.curso, d.curso2] : [d.curso])
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  if (!titulos.length) return;
  const separador = titulos.length > 1 ? 34 : 0;
  let tam = 92;
  let blocos = [];
  for (; tam >= 26; tam -= 2) {
    ctx.font = fonte(familia, 900, tam);
    blocos = titulos.map((t) => quebrarLinhas(ctx, t, CAIXA.w));
    const larguraOk = blocos.flat().every((l) => ctx.measureText(l).width <= CAIXA.w);
    if (larguraOk && blocos.flat().length * tam + separador <= CAIXA.h) break;
  }
  const alturaLinha = tam * 1.0;
  const centroX = CAIXA.x + CAIXA.w / 2;
  let y = CAIXA.y + (CAIXA.h - blocos.flat().length * alturaLinha - separador) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = fonte(familia, 900, tam);
  blocos.forEach((linhas, i) => {
    if (i > 0) {
      ctx.fillStyle = COR_CAIXA;
      ctx.fillRect(centroX - CAIXA.w * 0.3, y + separador / 2 - 3, CAIXA.w * 0.6, 6);
      y += separador;
    }
    ctx.fillStyle = COR_TEXTO;
    for (const linha of linhas) {
      ctx.fillText(linha, centroX, y + tam * 0.06);
      y += alturaLinha;
    }
  });
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
  if (temDoisCursos(d)) {
    // Uma linha por curso: o nome em negrito e as datas dele.
    paragrafos.push([{ texto: "Datas", peso: 800 }, { texto: ":", peso: 500 }]);
    for (const [curso, datas] of [[d.curso, d.datas], [d.curso2, d.datas2]]) {
      const texto = datas.split("\n").map((l) => l.trim()).filter(Boolean).join(", ");
      paragrafos.push([{ texto: curso.trim(), peso: 800 }, { texto: texto ? ` - ${texto}` : "", peso: 500 }]);
    }
  }
  const datas = temDoisCursos(d) ? [] : d.datas.split("\n").map((l) => l.trim()).filter(Boolean);
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
  const contatos = (d.contatoExtra || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (contatos.length) {
    paragrafos.push([{ texto: "Contato", peso: 800 }, { texto: `: ${contatos.join(" / ")}`, peso: 500 }]);
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

// "Apoio: ..." no canto de baixo, à esquerda dos telefones.
function desenharApoio(ctx, familia, d) {
  const texto = d.apoio.trim();
  if (!d.mostrarApoio || !texto) return;
  const area = { x: 388, y: 970, w: 218, limite: 1074 };
  let tam = 24;
  let linhas;
  for (; tam >= 12; tam -= 1) {
    ctx.font = fonte(familia, 600, tam);
    linhas = quebrarLinhas(ctx, texto, area.w);
    if (area.y + (linhas.length + 1) * tam * 1.15 <= area.limite) break;
  }
  ctx.fillStyle = COR_TEXTO;
  ctx.textBaseline = "top";
  let y = area.y;
  ctx.font = fonte(familia, 800, tam);
  ctx.fillText("Apoio:", area.x, y);
  ctx.font = fonte(familia, 600, tam);
  for (const linha of linhas) {
    y += tam * 1.15;
    ctx.fillText(linha, area.x, y);
  }
  ctx.textBaseline = "alphabetic";
}

// Números ao lado de "Telefone" e "Sindicato" (os rótulos fazem parte do template).
function desenharTelefones(ctx, familiaSerif, d) {
  const numeros = [
    d.telefone?.trim() || PADRAO_BRAGANCA.telefone,
    d.celular?.trim() || PADRAO_BRAGANCA.celular,
  ];
  ctx.fillStyle = "#016e49";
  ctx.textBaseline = "alphabetic";
  numeros.forEach((numero, i) => {
    let tam = 46;
    ctx.font = fonte(familiaSerif, 700, tam);
    while (ctx.measureText(numero).width > 322 && tam > 20) ctx.font = fonte(familiaSerif, 700, --tam);
    ctx.fillText(numero, 750, i ? 1053 : 1004);
  });
}

export function desenharBannerBraganca(ctx, { fundo, foto, dados, familia, familiaSerif, parceiros = [] }) {
  ctx.clearRect(0, 0, TAMANHO, TAMANHO);
  ctx.drawImage(fundo, 0, 0, TAMANHO, TAMANHO);
  desenharFoto(ctx, foto);
  desenharTitulo(ctx, familia, dados);
  desenharInformacoes(ctx, familia, dados);
  desenharParceiros(ctx, parceiros, { x: 784, y: 10, w: 290, h: 122 });
  desenharApoio(ctx, familia, dados);
  desenharTelefones(ctx, familiaSerif || "serif", dados);
}
