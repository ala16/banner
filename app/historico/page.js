"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Cabecalho from "../Cabecalho";
import { CHAVE_REUTILIZAR, CIDADES } from "@/lib/cidades";

const formatarData = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function HistoricoPage() {
  const [cidade, setCidade] = useState(null);
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const daUrl = new URLSearchParams(window.location.search).get("cidade");
    setCidade(CIDADES.some((c) => c.id === daUrl) ? daUrl : CIDADES[0].id);
  }, []);

  useEffect(() => {
    if (!cidade) return;
    setItens(null);
    setErro("");
    fetch(`/api/historico?cidade=${cidade}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
        setItens(data.itens);
      })
      .catch((e) => {
        setErro(e.message);
        setItens([]);
      });
  }, [cidade]);

  function trocarCidade(id) {
    setCidade(id);
    window.history.replaceState(null, "", `/historico?cidade=${id}`);
  }

  function reutilizar(item) {
    try {
      sessionStorage.setItem(CHAVE_REUTILIZAR, JSON.stringify(item.dados));
    } catch {}
    window.location.href = `/${item.cidade}`;
  }

  async function apagar(item) {
    if (!confirm(`Apagar "${item.dados.curso || "banner"}" do histórico?`)) return;
    const res = await fetch("/api/historico", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cidade: item.cidade, id: item.id }),
    });
    if (res.ok) setItens((lista) => lista.filter((i) => i.id !== item.id));
    else alert("Não foi possível apagar.");
  }

  return (
    <>
    <Cabecalho ativo="historico" />
    <main className="container">
      <div className="titulo-pagina">
        <h1>Histórico de banners</h1>
        <p>Todos os banners baixados ficam salvos aqui, separados por cidade.</p>
      </div>

      <nav className="abas">
        {CIDADES.map((c) => (
          <button
            key={c.id}
            type="button"
            className="botao secundario"
            aria-current={c.id === cidade ? "page" : undefined}
            onClick={() => trocarCidade(c.id)}
          >
            {c.nome}
          </button>
        ))}
      </nav>

      {erro && <p className="aviso erro">{erro}</p>}
      {itens === null && <p className="dica">Carregando...</p>}
      {itens?.length === 0 && !erro && (
        <div className="vazio">
          <strong>Nenhum banner salvo ainda</strong>
          <p>Os banners que você baixar aparecem aqui.</p>
          <Link className="botao" href={`/${cidade}`}>Criar banner</Link>
        </div>
      )}

      <div className="historico">
        {itens?.map((item) => (
          <div className="historico-item" key={item.id}>
            <a href={item.imagem} target="_blank" rel="noreferrer">
              <img src={item.imagem} alt={item.dados.curso || "Banner"} loading="lazy" />
            </a>
            <div className="info">
              <strong>{item.dados.curso || "(sem nome)"}</strong>
              <small>{item.dados.datas ? `${item.dados.datas} · ` : ""}criado em {formatarData(item.criadoEm)}</small>
            </div>
            <div className="botoes">
              <a className="botao" href={`${item.imagem}?download=1`}>Baixar</a>
              <button type="button" className="botao secundario" onClick={() => reutilizar(item)}>Reutilizar dados</button>
              <button type="button" className="botao secundario perigo" onClick={() => apagar(item)}>Apagar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
    </>
  );
}
