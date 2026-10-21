// Lê um texto livre como
//   "artesanato em argila- utilitários e decorativos, dias 03, 04, 05, 27 e 28/11 na Jessica"
// e devolve só os campos que reconheceu: curso, descricao, datas, horario, local, vagas, idade.
// Um texto com vários cursos (um por linha) é separado com separarCursos.

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Tira acentos mantendo o mesmo tamanho do texto, para os índices continuarem valendo.
const semAcento = (texto) =>
  Array.from(texto, (c) => c.normalize("NFD")[0]).join("").toLowerCase();

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "03, 04 e 05" -> "3, 4 e 5"; "3-5" ou "3 a 5" -> "3 a 5"
function formatarDias(dias) {
  return dias
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+e\s+/gi, " e ")
    .replace(/\s*(?:-|–|\s+a\s+|\s+à\s+)\s*/gi, " a ")
    .replace(/\d+/g, (n) => String(parseInt(n, 10)));
}

// Remove do texto o trecho [inicio, fim) e devolve o restante.
const recortar = (texto, inicio, fim) => `${texto.slice(0, inicio)} ${texto.slice(fim)}`;

// Dias sem mês ("16/17", "dia 16"): mês atual, ou o seguinte se o primeiro dia já passou.
function mesProvavel(primeiroDia, hoje = new Date()) {
  const mes = primeiroDia < hoje.getDate() ? hoje.getMonth() + 1 : hoje.getMonth();
  return MESES[mes % 12];
}

export function preencherDoTexto(texto, locais = []) {
  // "16/17" são dois dias, não dia/mês: quando o segundo número passa de 12, ou quando
  // está sozinho (linha própria) e são dias seguidos ("5/6").
  let resto = ` ${texto.replace(/\s+/g, " ").trim()} `.replace(
    /(^|[,;]\s*|\D)(\d{1,2})\s*\/\s*(\d{1,2})\b(?!\s*\/)(?=(\s*(?:[,;]|$))?)/g,
    (todo, antes, a, b, depois) => {
      const [x, y] = [Number(a), Number(b)];
      const sozinho = /^\s*$|[,;]\s*$/.test(antes) && depois !== undefined;
      const dias = (y > 12 && y <= 31) || (sozinho && y > x && y - x <= 3);
      return dias ? `${antes}${a} e ${b}` : todo;
    }
  );
  const r = {};

  // Local: procura o nome de um local salvo (sem acento e sem diferenciar maiúsculas).
  const ordenados = [...locais].filter((l) => l.nome.trim()).sort((a, b) => b.nome.length - a.nome.length);
  for (const local of ordenados) {
    const nome = escapar(semAcento(local.nome.trim()));
    const re = new RegExp(`(?:[,;]?\\s*(?:local:?|na|no|em)\\s+)?\\b${nome}\\b`, "i");
    const m = re.exec(semAcento(resto));
    if (m) {
      r.local = local.endereco;
      resto = recortar(resto, m.index, m.index + m[0].length);
      break;
    }
  }

  const tirar = (re, aoAchar) => {
    const m = re.exec(semAcento(resto));
    if (!m) return;
    aoAchar(m, resto.slice(m.index, m.index + m[0].length));
    resto = recortar(resto, m.index, m.index + m[0].length);
  };

  tirar(/(\d+)\s*vagas?/, (m) => (r.vagas = String(parseInt(m[1], 10))));

  tirar(
    /(?:idade\s*(?:minima)?\s*:?\s*|maiores\s+de\s+|mais\s+de\s+|a\s+partir\s+de\s+|\+\s*)(\d{1,2})\s*(?:anos?)?|(\d{1,2})\s*anos?\s*(?:ou\s+mais|\+)?/,
    (m) => (r.idade = String(parseInt(m[1] || m[2], 10)))
  );

  tirar(
    /(?:horario:?\s*|das\s+|de\s+)?(\d{1,2})\s*(?:h|:)\s*(\d{2})?\s*h?\s*(?:as|a|ate|-|–)\s*(\d{1,2})\s*(?:h|:)\s*(\d{2})?\s*h?/,
    (m) => {
      const hora = (h, min) => `${parseInt(h, 10)}h${min || "00"}`;
      r.horario = `${hora(m[1], m[2])} às ${hora(m[3], m[4])}`;
    }
  );

  // Só o início: "às 8h", "a partir das 14h30".
  if (!r.horario) {
    tirar(/(?:\b(?:horario:?|as|a\s+partir\s+das?)\s+)?\b(\d{1,2})\s*h\s*(\d{2})?\b/, (m) => {
      r.horario = `${parseInt(m[1], 10)}h${m[2] || "00"}`;
    });
  }

  // Datas: "dias 03, 04 e 05/11", "dia 5/11/2026", "3 a 5 de novembro". Pode haver mais de um mês.
  const grupos = [];
  const lista = String.raw`\d{1,2}(?:\s*(?:,|\be\b|\ba\b|-|–)\s*\d{1,2})*`;
  const prefixo = String.raw`(?:\b(?:de|em|nos?|nas?)\s+)?(?:\bdias?\s+)?`;
  const reNumerico = new RegExp(String.raw`${prefixo}(${lista})\s*\/\s*(\d{1,2})(?:\s*\/\s*\d{2,4})?`);
  const reExtenso = new RegExp(String.raw`${prefixo}(${lista})\s+de\s+(${MESES.map(semAcento).join("|")})`);
  for (;;) {
    let achou = false;
    tirar(reNumerico, (m, original) => {
      const mes = parseInt(m[2], 10);
      if (mes < 1 || mes > 12) return;
      grupos.push(`${formatarDias(original.match(new RegExp(lista))[0])} de ${MESES[mes - 1]}`);
      achou = true;
    });
    if (!achou) {
      tirar(reExtenso, (m, original) => {
        grupos.push(`${formatarDias(original.match(new RegExp(lista))[0])} de ${MESES[MESES.map(semAcento).indexOf(m[2])]}`);
        achou = true;
      });
    }
    if (!achou) break;
  }
  if (!grupos.length) {
    // Só dias, sem mês: depois de "dia(s)", ou sozinhos entre vírgulas / numa linha própria.
    const reSoDias = new RegExp(String.raw`(?:\bdias?\s+|(?:^|[,;])\s*)(${lista})(?=\s*(?:[,;]|$))`);
    tirar(reSoDias, (m) => {
      const primeiro = parseInt(m[1], 10);
      if (primeiro >= 1 && primeiro <= 31) grupos.push(`${formatarDias(m[1])} de ${mesProvavel(primeiro)}`);
    });
  }
  if (grupos.length) r.datas = grupos.join(" e ");

  // Local que não está salvo, numa linha própria ou depois de vírgula: "..., No Wanda".
  if (!r.local) {
    tirar(/[,;]\s*(?:local:?|no|na)\s+([^,;]+?)\s*$/, (m, original) => {
      r.local = original.replace(/^[,;]\s*(?:local:?|no|na)\s+/i, "").trim();
    });
  }

  // O que sobrou é o nome do curso; depois de ":" ou "." vira a descrição.
  resto = resto
    .replace(/\s+[-–]\s*|\s*[-–]\s+/g, " - ")
    .replace(/\s+([,.;:])/g, "$1")
    // Conectivos que ficaram soltos depois de tirar datas e local ("..., e", "de" no fim).
    .replace(/(^|[,;]|\s)\s*(?:e|de|em|na|no|dias?)(?=\s*(?:[,;.]|$))/gi, "$1")
    .replace(/(?:[,;]\s*)+(?=[,;]|\s*$)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s,;:.\-–]+|[\s,;:\-–]+$/g, "");
  if (resto) {
    let [curso, ...descricao] = resto.split(/\s*[:.]\s+/);
    // Tudo em maiúsculas ("PROCESSAMENTO CARNE DE AVES") vira só a primeira letra maiúscula.
    if (curso === curso.toUpperCase()) curso = curso.toLowerCase();
    r.curso = curso.charAt(0).toUpperCase() + curso.slice(1);
    const desc = descricao.join(". ").trim();
    if (desc) r.descricao = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return r;
}

// Linha que só completa o curso de cima: só dias ("16/17"), horário ou local ("No Wanda").
const complemento = (linha) =>
  /^(?:dias?\s+)?[\d\s\/,e.–-]+(?:de\s+\p{L}+)?$/iu.test(linha) ||
  /^(?:no|na|local:?|horario:?|horário:?|das?|às|as)\s/i.test(linha);

// Um curso por linha; tira marcadores de lista ("•", "-", "*", "1.", "2)").
// Linhas de complemento (datas, local) e blocos separados por linha em branco
// se juntam ao curso de cima.
export function separarCursos(texto) {
  const cursos = [];
  let anteriorVazia = true;
  for (const bruta of texto.split("\n")) {
    const linha = bruta.replace(/^\s*(?:[•·▪●◦*\-–—]+|\d{1,2}\s*[.)-](?!\d))\s*/, "").trim();
    if (!linha) {
      anteriorVazia = true;
      continue;
    }
    const temMarcador = linha !== bruta.trim();
    if (cursos.length && !temMarcador && complemento(linha)) cursos[cursos.length - 1] += `, ${linha}`;
    else cursos.push(linha);
    anteriorVazia = false;
  }
  return cursos;
}
