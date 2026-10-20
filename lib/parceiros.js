// Logos de parceiros opcionais: cada banner escolhe quais aparecem.

export const PARCEIROS = {
  sebrae: { nome: "Sebrae", src: "/parceiros/sebrae.png" },
  jarinu: { nome: "Prefeitura de Jarinu", src: "/parceiros/jarinu.png" },
  vargem: { nome: "Prefeitura de Vargem", src: "/parceiros/vargem.png" },
  tuiuti: { nome: "Prefeitura de Tuiuti", src: "/parceiros/tuiuti.png" },
};

// Desenha os logos escolhidos lado a lado dentro de `area`, na maior altura que couber,
// alinhados à direita (alinhar = "direita") ou centralizados.
export function desenharParceiros(ctx, imagens, area, alinhar = "centro") {
  if (!imagens.length) return;
  const gap = 12;
  const proporcoes = imagens.map((img) => img.width / img.height);
  const altura = Math.min(area.h, (area.w - gap * (imagens.length - 1)) / proporcoes.reduce((a, b) => a + b, 0));
  const total = proporcoes.reduce((a, p) => a + p * altura, 0) + gap * (imagens.length - 1);
  let x = alinhar === "direita" ? area.x + area.w - total : area.x + (area.w - total) / 2;
  const y = area.y + (area.h - altura) / 2;
  imagens.forEach((img, i) => {
    const w = proporcoes[i] * altura;
    ctx.drawImage(img, x, y, w, altura);
    x += w + gap;
  });
}
