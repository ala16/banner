// Rodar com: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { preencherDoTexto, separarCursos, lerDoisCursos } from "../lib/preenchimentoRapido.js";
import { lerMensagemWhatsApp, pareceWhatsApp } from "../lib/mensagemWhatsApp.js";

const LOCAIS_ATIBAIA = [
  { nome: "Jéssica", endereco: "Estação Maracanã – Rua João Netto, 405, Jardim Maracanã, Atibaia" },
  { nome: "Iara", endereco: "Centro Comunitario Iara, Estrada Campo Limpo Paulista, 0 - Iara, Atibaia - SP" },
  { nome: "Pinguim", endereco: "Toca do Pinguim 1\nRua Canários 100 - portão 3\nBairro Santa Maria do Portão - Atibaia - SP" },
];
const LOCAIS_BRAGANCA = [{ nome: "Sindicato", endereco: "Sindicato Rural de Bragança Pta." }];

const lerTodos = (texto, locais, opcoes) => separarCursos(texto, opcoes).map((c) => preencherDoTexto(c, locais));

test("data numa linha e curso na linha de baixo viram um curso só", () => {
  const texto =
    "- dias 02, 03, 04 e 05 dezembro\njardineiro: implantação do jardim no Maracanã\n" +
    "- dias 02, 03, 04 e 05 dezembro\njardineiro: manutenção do jardim no iara";
  assert.deepEqual(lerTodos(texto, LOCAIS_ATIBAIA), [
    {
      curso: "Jardineiro",
      descricao: "Implantação do jardim",
      datas: "2, 3, 4 e 5 de dezembro",
      local: LOCAIS_ATIBAIA[0].endereco,
    },
    {
      curso: "Jardineiro",
      descricao: "Manutenção do jardim",
      datas: "2, 3, 4 e 5 de dezembro",
      local: LOCAIS_ATIBAIA[1].endereco,
    },
  ]);
});

test("mês sem \"de\" antes", () => {
  assert.equal(preencherDoTexto("jardineiro, dias 02, 03, 04 e 05 dezembro").datas, "2, 3, 4 e 5 de dezembro");
});

test("bairro desconhecido continua na descrição", () => {
  const r = preencherDoTexto("jardineiro: manutenção do jardim no Centro, dias 2 e 3/12", LOCAIS_ATIBAIA);
  assert.equal(r.descricao, "Manutenção do jardim no Centro");
  assert.equal(r.local, undefined);
});

test("formato de uma linha com datas no meio (exemplo de Atibaia)", () => {
  const r = preencherDoTexto(
    "artesanato em argila - utilitários e decorativos, dias 03, 04, 05, 27 e 28/11 na Jessica",
    LOCAIS_ATIBAIA
  );
  assert.equal(r.curso, "Artesanato em argila - utilitários e decorativos");
  assert.equal(r.datas, "3, 4, 5, 27 e 28 de novembro");
  assert.equal(r.local, LOCAIS_ATIBAIA[0].endereco);
});

test("vários cursos, um por linha", () => {
  const r = lerTodos("- horta: 3 e 4/12 no Pinguim\n- jardinagem: 10 e 11/12 na Iara", LOCAIS_ATIBAIA);
  assert.equal(r.length, 2);
  assert.equal(r[0].curso, "Horta");
  assert.equal(r[0].local, LOCAIS_ATIBAIA[2].endereco);
  assert.equal(r[1].curso, "Jardinagem");
  assert.equal(r[1].datas, "10 e 11 de dezembro");
});

test("curso / dias / local em linhas (Bragança)", () => {
  const texto = "PROCESSAMENTO CARNE DE AVES\n16/17 de dezembro\nNo Sindicato\n\nOVINOCULTURA\n20 e 21/12\nNo Wanda";
  const r = lerTodos(texto, LOCAIS_BRAGANCA, { doisCursos: true });
  assert.equal(r.length, 2);
  assert.equal(r[0].curso, "Processamento carne de aves");
  assert.equal(r[0].datas, "16 e 17 de dezembro");
  assert.equal(r[0].local, LOCAIS_BRAGANCA[0].endereco);
  assert.equal(r[1].curso, "Ovinocultura");
  assert.equal(r[1].local, "Wanda");
});

test("dois cursos no mesmo banner (Bragança)", () => {
  const r = lerDoisCursos("IATF: 09 e 10 de Novembro\nInseminação Artificial: 16 a 20 de Novembro\nNo Sindicato", LOCAIS_BRAGANCA);
  assert.equal(r.curso, "IATF");
  assert.equal(r.datas, "9 e 10 de novembro");
  assert.equal(r.curso2, "Inseminação Artificial");
  assert.equal(r.datas2, "16 a 20 de novembro");
});

test("mensagens copiadas do WhatsApp", () => {
  const texto = [
    "[17/11/2026, 14:37:30] Rose Sindicato Bragança: PROCESSAMENTO CASEIRO DE CARNE BOVINA",
    "[17/11/2026, 14:37:57] Rose Sindicato Bragança: DIAS",
    "25/26/27 de Novembro",
    "[17/11/2026, 14:38:01] Rose Sindicato Bragança: Local",
    "[17/11/2026, 14:38:21] Rose Sindicato Bragança: IGREJA SÃO BENEDITO",
    "[17/11/2026, 14:38:38] Rose Sindicato Bragança: CONTATO NOSSO",
    "[17/11/2026, 14:41:00] Rose Sindicato Bragança: 8:00/12:00   13:00/17:00",
  ].join("\n");
  assert.ok(pareceWhatsApp(texto));
  const r = lerMensagemWhatsApp(texto, LOCAIS_BRAGANCA);
  assert.equal(r.curso, "Processamento caseiro de carne bovina");
  assert.equal(r.datas, "25, 26 e 27 de novembro");
  assert.equal(r.local, "Igreja São Benedito");
  assert.equal(r.contatoSindicato, true);
  assert.equal(r.horario, "das 8h às 12h e das 13h às 17h");
});

test("o texto do jardineiro não é confundido com WhatsApp", () => {
  assert.equal(pareceWhatsApp("- dias 02, 03, 04 e 05 dezembro\njardineiro: implantação do jardim no Maracanã"), false);
});
