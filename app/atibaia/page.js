"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { montserrat } from "../fonts";
import Cabecalho from "../Cabecalho";
import { desenharBannerAtibaia, PADRAO_ATIBAIA, TAMANHO } from "@/lib/bannerAtibaia";
import { carregarLocais, LOCAIS_PADRAO, salvarLocais } from "@/lib/locaisAtibaia";
import { CHAVE_REUTILIZAR } from "@/lib/cidades";
import { preencherDoTexto } from "@/lib/preenchimentoRapido";

const NOMES_CAMPOS = {
  curso: "curso",
  descricao: "descrição",
  datas: "datas",
  horario: "horário",
  local: "local",
  vagas: "vagas",
  idade: "idade",
};

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function Campo({ nome, rotulo, dica, multilinha, dados, onChange, ...props }) {
  const Tag = multilinha ? "textarea" : "input";
  return (
    <div className="campo">
      <label htmlFor={nome}>{rotulo}</label>
      <Tag id={nome} name={nome} value={dados[nome]} onChange={onChange} rows={multilinha ? 2 : undefined} {...props} />
      {dica && <small>{dica}</small>}
    </div>
  );
}

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

  const [statusHistorico, setStatusHistorico] = useState(null);
  const [nomeFoto, setNomeFoto] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const inputFotoRef = useRef(null);
  const [textoRapido, setTextoRapido] = useState("");
  const [resultadoRapido, setResultadoRapido] = useState(null);

  function preencherRapido() {
    const achados = preencherDoTexto(textoRapido, locais);
    setDados((d) => ({ ...d, ...achados }));
    setResultadoRapido(Object.keys(achados));
  }

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

  function usarFoto(arquivo) {
    if (!arquivo || !arquivo.type.startsWith("image/")) return;
    const url = URL.createObjectURL(arquivo);
    carregarImagem(url)
      .then((img) => {
        setFoto(img);
        setNomeFoto(arquivo.name);
      })
      .finally(() => URL.revokeObjectURL(url));
  }

  const [gerandoDescricao, setGerandoDescricao] = useState(false);
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [erroIA, setErroIA] = useState({});

  async function chamarIA(rota, corpo) {
    const res = await fetch(rota, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
    return data;
  }

  async function gerarDescricao() {
    setGerandoDescricao(true);
    setErroIA((e) => ({ ...e, descricao: "" }));
    try {
      const { descricao } = await chamarIA("/api/ia/descricao", { curso: dados.curso });
      setDados((d) => ({ ...d, descricao }));
    } catch (err) {
      setErroIA((e) => ({ ...e, descricao: err.message }));
    }
    setGerandoDescricao(false);
  }

  async function gerarImagem() {
    setGerandoImagem(true);
    setErroIA((e) => ({ ...e, imagem: "" }));
    try {
      const { imagem } = await chamarIA("/api/ia/imagem", { curso: dados.curso, descricao: dados.descricao });
      setFoto(await carregarImagem(imagem));
      setNomeFoto("Imagem gerada com IA");
      if (inputFotoRef.current) inputFotoRef.current.value = "";
    } catch (err) {
      setErroIA((e) => ({ ...e, imagem: err.message }));
    }
    setGerandoImagem(false);
  }

  function removerFoto() {
    setFoto(null);
    setNomeFoto("");
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  }

  function limpar() {
    if (!confirm("Limpar todos os campos e a imagem?")) return;
    setDados(PADRAO_ATIBAIA);
    removerFoto();
    setStatusHistorico(null);
    setTextoRapido("");
    setResultadoRapido(null);
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
    setStatusHistorico({ tipo: "info", texto: "Salvando no histórico..." });
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
      setStatusHistorico(
        res.ok
          ? { tipo: "ok", texto: "Banner baixado e salvo no histórico." }
          : { tipo: "erro", texto: `Banner baixado, mas não salvou no histórico: ${data.erro || res.status}` }
      );
    } catch {
      setStatusHistorico({ tipo: "erro", texto: "Banner baixado, mas não salvou no histórico (erro de conexão)." });
    }
  }

  const campo = { dados, onChange: alterar };

  return (
    <>
      <Cabecalho />
      <main className="container">
        <div className="titulo-pagina">
          <Link href="/" className="voltar">← Cidades</Link>
          <h1>Banner de Atibaia</h1>
          <p>Preencha os dados e veja a prévia do banner na hora.</p>
        </div>

        <div className="editor">
          <form className="formulario" onSubmit={(e) => e.preventDefault()}>
            <fieldset className="secao rapido">
              <legend>Preenchimento rápido</legend>
              <textarea
                id="texto-rapido"
                aria-label="Texto para preenchimento rápido"
                rows={3}
                value={textoRapido}
                placeholder="Ex.: artesanato em argila - utilitários e decorativos, dias 03, 04, 05, 27 e 28/11 na Jessica"
                onChange={(e) => setTextoRapido(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && textoRapido.trim()) preencherRapido();
                }}
              />
              <div className="rapido-acoes">
                <button type="button" className="botao" onClick={preencherRapido} disabled={!textoRapido.trim()}>
                  Preencher campos
                </button>
                <small>Reconhece curso, datas, local salvo, vagas, idade e horário. Confira e corrija abaixo.</small>
              </div>
              {resultadoRapido && (
                <p className={`aviso ${resultadoRapido.length ? "ok" : "erro"}`} role="status">
                  {resultadoRapido.length
                    ? `Preenchido: ${resultadoRapido.map((c) => NOMES_CAMPOS[c]).join(", ")}.`
                    : "Não reconheci nenhum dado nesse texto."}
                </p>
              )}
            </fieldset>

            <fieldset className="secao">
              <legend>Curso</legend>
              <Campo nome="curso" rotulo="Nome do curso" placeholder="Turismo pedagógico no meio rural" {...campo} />
              <div className="campo">
                <div className="rotulo-com-acao">
                  <label htmlFor="descricao">Descrição curta</label>
                  <button
                    type="button"
                    className="botao-ia"
                    onClick={gerarDescricao}
                    disabled={gerandoDescricao || !dados.curso.trim()}
                    title={dados.curso.trim() ? "Criar descrição a partir do nome do curso" : "Preencha o nome do curso primeiro"}
                  >
                    {gerandoDescricao ? "Gerando..." : "✨ Gerar com IA"}
                  </button>
                </div>
                <textarea id="descricao" name="descricao" rows={2} value={dados.descricao} onChange={alterar} placeholder="Aprende-se a planejar viagens escolares educativas no campo." />
                {erroIA.descricao ? <small className="texto-erro">{erroIA.descricao}</small> : <small>Até 8 palavras. Aparece no quadro azul.</small>}
              </div>
              <div className="linha">
                <Campo nome="vagas" rotulo="Vagas" type="number" min="1" inputMode="numeric" placeholder="16" {...campo} />
                <Campo nome="idade" rotulo="Idade mínima" type="number" min="0" inputMode="numeric" {...campo} />
              </div>
            </fieldset>

            <fieldset className="secao">
              <legend>Quando e onde</legend>
              <Campo nome="datas" rotulo="Data(s)" placeholder="1, 2, 7 e 8 de outubro" {...campo} />
              <Campo nome="horario" rotulo="Horário" placeholder="8h00 às 17h00" {...campo} />
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
                    {editandoLocais ? "Fechar" : "Editar locais"}
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
                  className="local-endereco"
                />
              </div>
            </fieldset>

            <fieldset className="secao">
              <legend>Inscrições</legend>
              <div className="linha">
                <Campo nome="telefone" rotulo="Telefone" inputMode="tel" {...campo} />
                <Campo nome="link" rotulo="Link" {...campo} />
              </div>
            </fieldset>

            <fieldset className="secao">
              <legend>Imagem do curso</legend>
              <label
                className={`upload${arrastando ? " arrastando" : ""}${foto ? " com-foto" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastando(false);
                  usarFoto(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={inputFotoRef}
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => usarFoto(e.target.files?.[0])}
                />
                {foto ? (
                  <>
                    <strong>{nomeFoto}</strong>
                    <span>Clique para trocar</span>
                  </>
                ) : (
                  <>
                    <strong>Clique ou arraste uma imagem aqui</strong>
                    <span>Imagens em pé (retrato) ficam melhores</span>
                  </>
                )}
              </label>
              <div className="imagem-acoes">
                <button
                  type="button"
                  className="botao secundario"
                  onClick={gerarImagem}
                  disabled={gerandoImagem || !dados.curso.trim()}
                >
                  {gerandoImagem ? "Gerando imagem (até 1 min)..." : "✨ Gerar imagem com IA"}
                </button>
                {foto && (
                  <button type="button" className="link-acao perigo" onClick={removerFoto}>Remover imagem</button>
                )}
              </div>
              {!dados.curso.trim() && <small className="dica-pequena">Preencha o nome do curso para gerar com IA.</small>}
              {erroIA.imagem && <p className="aviso erro">{erroIA.imagem}</p>}
            </fieldset>
          </form>

          <aside className="preview">
            <div className="preview-moldura">
              {!assets && <div className="carregando">Carregando modelo...</div>}
              <canvas ref={canvasRef} width={TAMANHO} height={TAMANHO} />
            </div>
            <div className="acoes">
              <button className="botao grande" type="button" onClick={baixar} disabled={!assets || !dados.curso.trim()}>
                Baixar banner
              </button>
              <div className="acoes-secundarias">
                <Link className="link-acao" href="/historico?cidade=atibaia">Ver histórico</Link>
                <button type="button" className="link-acao" onClick={limpar}>Limpar campos</button>
              </div>
              {!dados.curso.trim() && <p className="dica">Preencha o nome do curso para baixar.</p>}
              {statusHistorico && (
                <p className={`aviso ${statusHistorico.tipo}`} role="status">{statusHistorico.texto}</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
