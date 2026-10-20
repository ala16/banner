"use client";

import { useState } from "react";

// Lista em texto (um curso por linha) com botão para copiar.
export default function ListaCursos({ titulo, cursos }) {
  const [copiado, setCopiado] = useState(false);
  const nomes = cursos.map((c) => c.trim()).filter(Boolean);
  if (!nomes.length) return null;
  const texto = nomes.join("\n");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      return;
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <section className="lista-cursos">
      <div className="lista-cursos-topo">
        <h2>{titulo} ({nomes.length})</h2>
        <button type="button" className="botao secundario" onClick={copiar}>
          {copiado ? "Copiado!" : "Copiar lista"}
        </button>
      </div>
      <textarea readOnly value={texto} rows={Math.min(nomes.length, 12)} onFocus={(e) => e.target.select()} />
    </section>
  );
}
