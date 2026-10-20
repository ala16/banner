// Locais salvos de cada cidade. A lista editada pelo usuário fica salva no navegador.

const chave = (cidade) => `banner:${cidade}:locais`;

export function carregarLocais(cidade, padrao) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave(cidade)));
    if (Array.isArray(salvo)) return salvo;
  } catch {}
  return padrao;
}

export function salvarLocais(cidade, locais) {
  try {
    localStorage.setItem(chave(cidade), JSON.stringify(locais));
  } catch {}
}
