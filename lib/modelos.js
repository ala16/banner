// Configuração de cada cidade: template, campos do formulário e locais padrão.

import { desenharBannerAtibaia, FOTO, PADRAO_ATIBAIA } from "./bannerAtibaia";
import { desenharBannerBraganca, FOTO_BRAGANCA, PADRAO_BRAGANCA } from "./bannerBraganca";

export const MODELOS = {
  atibaia: {
    id: "atibaia",
    nome: "Atibaia",
    padrao: PADRAO_ATIBAIA,
    foto: FOTO,
    desenhar: desenharBannerAtibaia,
    imagens: { fundo: "/atibaia/fundo.png", logos: "/atibaia/logos.png" },
    // Campos que aparecem no formulário além de curso, datas, horário, local e imagem.
    campos: { descricao: true, vagasIdade: true, contato: true },
    exemploRapido: "Ex.: artesanato em argila - utilitários e decorativos, dias 03, 04, 05, 27 e 28/11 na Jessica",
    exemploDatas: "1, 2, 7 e 8 de outubro",
    parceiros: ["sebrae", "jarinu"],
    apoio: false,
    datasMultilinha: false,
    locaisPadrao: [
      { nome: "Jéssica", endereco: "Estação Maracanã – Rua João Netto, 405, Jardim Maracanã, Atibaia" },
      { nome: "Iara", endereco: "Centro Comunitario Iara, Estrada Campo Limpo Paulista, 0 - Iara, Atibaia - SP" },
      {
        nome: "Secretaria da Agricultura",
        endereco: "Secretaria da Agricultura - Estrada Municipal Juca Sanches, 400 – Jardim Brogotá / Parque das Nações, Atibaia - SP",
      },
      {
        nome: "Pinguim",
        endereco: "Toca do Pinguim 1\nRua Canários 100 - portão 3\nBairro Santa Maria do Portão - Atibaia - SP",
      },
      { nome: "Recanto Lotus", endereco: "Estrada Municipal do Tanque, s/n - bairro do Tanque - Atibaia - SP" },
    ],
  },
  braganca: {
    id: "braganca",
    nome: "Bragança Paulista",
    padrao: PADRAO_BRAGANCA,
    foto: FOTO_BRAGANCA,
    desenhar: desenharBannerBraganca,
    imagens: { fundo: "/braganca/fundo.png" },
    campos: { descricao: false, vagasIdade: false, contato: false },
    telefones: [
      { nome: "telefone", rotulo: "Telefone" },
      { nome: "celular", rotulo: "Celular do sindicato" },
    ],
    exemploRapido: "Ex.: PROCESSAMENTO CARNE DE AVES\n16/17\nNo Sindicato\n(vários cursos: deixe uma linha em branco entre eles)",
    exemploDatas: "Turma 1 - 6 e 7 de novembro\nTurma 2 - 30 de novembro e 1 de dezembro",
    parceiros: ["sebrae", "vargem", "tuiuti"],
    apoio: true,
    datasMultilinha: true,
    locaisPadrao: [
      {
        nome: "Sindicato",
        endereco: "Sindicato Rural de Bragança Pta.\nRua Cândido Morães Leme, 455, Vila Municipal, Bragança Paulista - SP",
      },
    ],
  },
};
