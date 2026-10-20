"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { montserrat } from "../fonts";
import SairButton from "../SairButton";
import { desenharBannerAtibaia, PADRAO_ATIBAIA, TAMANHO } from "@/lib/bannerAtibaia";

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const CAMPOS = [
  { nome: "curso", rotulo: "Nome do curso", placeholder: "Turismo pedagógico no meio rural" },
  { nome: "descricao", rotulo: "Descrição curta", placeholder: "Aprende-se a planejar viagens escolares educativas no campo.", multilinha: true },
  { nome: "datas", rotulo: "Data(s)", placeholder: "1, 2, 7 e 8 de outubro" },
  { nome: "horario", rotulo: "Horário (opcional)", placeholder: "8h00 às 17h00" },
  { nome: "local", rotulo: "Local", placeholder: "Secretaria da Agricultura - Estrada Municipal Juca Sanches, 400 - Atibaia - SP", multilinha: true },
];

export default function AtibaiaPage() {
  const canvasRef = useRef(null);
  const [dados, setDados] = useState(PADRAO_ATIBAIA);
  const [assets, setAssets] = useState(null);
  const [foto, setFoto] = useState(null);

  // Fundo, logos e fontes precisam estar carregados antes de desenhar.
  useEffect(() => {
    const familia = montserrat.style.fontFamily;
    Promise.all([
      carregarImagem("/atibaia/fundo.png"),
      carregarImagem("/atibaia/logos.png"),
      // Falha ao carregar fonte não deve travar o gerador: cai na fonte reserva.
      ...[500, 600, 700, 800, 900].map((peso) =>
        document.fonts.load(`${peso} 40px ${familia}`).catch(() => {})
      ),
    ]).then(([fundo, logos]) => setAssets({ fundo, logos, familia }));
  }, []);

  useEffect(() => {
    if (!assets || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    desenharBannerAtibaia(ctx, { ...assets, foto, dados });
  }, [assets, foto, dados]);

  const alterar = (e) => setDados((d) => ({ ...d, [e.target.name]: e.target.value }));

  function escolherFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) {
      setFoto(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    carregarImagem(url).then(setFoto).finally(() => URL.revokeObjectURL(url));
  }

  function baixar() {
    const nome = (dados.curso || "banner")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    canvasRef.current.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `atibaia-${nome || "banner"}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  }

  return (
    <main className="container">
      <div className="topo">
        <h1>
          <Link href="/" style={{ textDecoration: "none" }}>←</Link> Banner Atibaia
        </h1>
        <SairButton />
      </div>

      <div className="editor">
        <form className="card" onSubmit={(e) => e.preventDefault()}>
          {CAMPOS.map((c) => (
            <div className="campo" key={c.nome}>
              <label htmlFor={c.nome}>{c.rotulo}</label>
              {c.multilinha ? (
                <textarea id={c.nome} name={c.nome} rows={2} value={dados[c.nome]} placeholder={c.placeholder} onChange={alterar} />
              ) : (
                <input id={c.nome} name={c.nome} value={dados[c.nome]} placeholder={c.placeholder} onChange={alterar} />
              )}
            </div>
          ))}

          <div className="linha">
            <div className="campo">
              <label htmlFor="vagas">Vagas</label>
              <input id="vagas" name="vagas" type="number" min="1" value={dados.vagas} placeholder="16" onChange={alterar} />
            </div>
            <div className="campo">
              <label htmlFor="idade">Idade mínima</label>
              <input id="idade" name="idade" type="number" min="0" value={dados.idade} onChange={alterar} />
            </div>
          </div>

          <div className="linha">
            <div className="campo">
              <label htmlFor="telefone">Telefone</label>
              <input id="telefone" name="telefone" value={dados.telefone} onChange={alterar} />
            </div>
            <div className="campo">
              <label htmlFor="link">Link</label>
              <input id="link" name="link" value={dados.link} onChange={alterar} />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="foto">Imagem do curso</label>
            <input id="foto" type="file" accept="image/*" onChange={escolherFoto} />
            <small>Aparece no quadro à direita. Imagens em pé (retrato) ficam melhores.</small>
          </div>
        </form>

        <div className="preview">
          <canvas ref={canvasRef} width={TAMANHO} height={TAMANHO} />
          <div className="acoes">
            <button className="botao" type="button" onClick={baixar} disabled={!assets}>
              Baixar banner (PNG)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
