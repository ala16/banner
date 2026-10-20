"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { montserrat } from "../fonts";
import SairButton from "../SairButton";
import { desenharBannerAtibaia, PADRAO_ATIBAIA, TAMANHO } from "@/lib/bannerAtibaia";
import { carregarLocais, LOCAIS_PADRAO, salvarLocais } from "@/lib/locaisAtibaia";
import { CHAVE_REUTILIZAR } from "@/lib/cidades";

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
  { nome: "horario", rotulo: "Horário", placeholder: "8h00 às 17h00" },
];

function LocaisSalvos({ locais, onChange, onFechar }) {
  const alterar = (i, campo, valor) =>
    onChange(locais.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  return (
    <div className="locais">
      {locais.map((l, i) => (
        <div className="local-item" key={i}>
          <input aria-label="Nome do local" value={l.nome} placeholder="Nome" onChange={(e) => alterar(i, "nome", e.target.value)} />
          <textarea aria-label="Endereço" rows={3} value={l.endereco} placeholder="Endereço" onChange={(e) => alterar(i, "endereco", e.target.value)} />
          <button type="button" className="botao secundario" onClick={() => onChange(locais.filter((_, j) => j !== i))}>
            Remover
          </button>
        </div>
      ))}
      <div className="acoes-locais">
        <button type="button" className="botao secundario" onClick={() => onChange([...locais, { nome: "", endereco: "" }])}>
          + Incluir local
        </button>
        <button
          type="button"
          className="botao secundario"
          onClick={() => confirm("Voltar para a lista de locais padrão?") && onChange(LOCAIS_PADRAO)}
        >
          Restaurar padrões
        </button>
        <button type="button" className="botao" onClick={onFechar}>Concluir</button>
      </div>
    </div>
  );
}

export default function AtibaiaPage() {
  const canvasRef = useRef(null);
  const [dados, setDados] = useState(PADRAO_ATIBAIA);
  const [assets, setAssets] = useState(null);
  const [foto, setFoto] = useState(null);
  const [locais, setLocais] = useState([]);
  const [editandoLocais, setEditandoLocais] = useState(false);

  const [statusHistorico, setStatusHistorico] = useState("");

  useEffect(() => setLocais(carregarLocais()), []);

  // Vindo do histórico com "Reutilizar dados": preenche o formulário com o banner escolhido.
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_REUTILIZAR);
      if (salvo) {
        sessionStorage.removeItem(CHAVE_REUTILIZAR);
        setDados({ ...PADRAO_ATIBAIA, ...JSON.parse(salvo) });
      }
    } catch {}
  }, []);

  function atualizarLocais(novos) {
    setLocais(novos);
    salvarLocais(novos);
  }

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
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const arquivo = `atibaia-${nome || "banner"}.png`;
    canvasRef.current.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = arquivo;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      salvarNoHistorico(blob, arquivo);
    }, "image/png");
  }

  async function salvarNoHistorico(png, arquivo) {
    setStatusHistorico("Salvando no histórico...");
    // O Vercel aceita no máximo ~4,5 MB por envio; PNG muito grande vai como JPEG.
    let imagem = png;
    if (png.size > 4 * 1024 * 1024) {
      imagem = await new Promise((r) => canvasRef.current.toBlob(r, "image/jpeg", 0.92));
      arquivo = arquivo.replace(/\.png$/, ".jpg");
    }
    const form = new FormData();
    form.append("cidade", "atibaia");
    form.append("imagem", imagem, arquivo);
    form.append("arquivo", arquivo);
    form.append("dados", JSON.stringify(dados));
    try {
      const res = await fetch("/api/historico", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      setStatusHistorico(res.ok ? "Salvo no histórico." : `Não salvou no histórico: ${data.erro || res.status}`);
    } catch {
      setStatusHistorico("Não salvou no histórico: erro de conexão.");
    }
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

          <div className="campo">
            <label htmlFor="local-salvo">Local</label>
            <div className="local-escolha">
              <select
                id="local-salvo"
                value={locais.findIndex((l) => l.endereco === dados.local)}
                onChange={(e) => {
                  const local = locais[Number(e.target.value)];
                  if (local) setDados((d) => ({ ...d, local: local.endereco }));
                }}
              >
                <option value={-1}>Escolha um local salvo…</option>
                {locais.map((l, i) => (
                  <option key={i} value={i}>{l.nome || "(sem nome)"}</option>
                ))}
              </select>
              <button type="button" className="botao secundario" onClick={() => setEditandoLocais((v) => !v)}>
                Editar locais
              </button>
            </div>
            {editandoLocais && (
              <LocaisSalvos locais={locais} onChange={atualizarLocais} onFechar={() => setEditandoLocais(false)} />
            )}
            <textarea
              id="local"
              name="local"
              aria-label="Endereço do local"
              rows={3}
              value={dados.local}
              placeholder="Escolha acima ou digite o endereço"
              onChange={alterar}
              style={{ marginTop: 8 }}
            />
          </div>

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
            <Link className="botao secundario" href="/historico?cidade=atibaia">Ver histórico</Link>
            {statusHistorico && <span className="status">{statusHistorico}</span>}
          </div>
        </div>
      </div>
    </main>
  );
}
