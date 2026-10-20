// Locais padrão de Atibaia. A lista editada pelo usuário fica salva no navegador.

export const LOCAIS_PADRAO = [
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
];

const CHAVE = "banner:atibaia:locais";

export function carregarLocais() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (Array.isArray(salvo)) return salvo;
  } catch {}
  return LOCAIS_PADRAO;
}

export function salvarLocais(locais) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(locais));
  } catch {}
}
