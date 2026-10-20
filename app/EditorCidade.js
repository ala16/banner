"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { montserrat, tinos } from "./fonts";
import Cabecalho from "./Cabecalho";
import ListaCursos from "./ListaCursos";
import { TAMANHO } from "@/lib/bannerAtibaia";
import { carregarLocais, salvarLocais } from "@/lib/locais";
import { PARCEIROS } from "@/lib/parceiros";
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

function baixarArquivo(blob, nome) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function Campo({ nome, rotulo, dica, multilinha, dados, onChange, prefixo = "", ...props }) {
  const Tag = multilinha ? "textarea" : "input";
  return (
    <div className="campo">
      <label htmlFor={prefixo + nome}>{rotulo}</label>
      <Tag id={prefixo + nome} name={nome} value={dados[nome]} onChange={onChange} rows={multilinha ? 2 : undefined} {...props} />
      {dica && <small>{dica}</small>}
    </div>
  );
}

function LocaisSalvos({ locais, padrao, onChange, onFechar }) {
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
          onClick={() => confirm("Voltar para a lista de locais padrão?") && onChange(padrao)}
        >
          Restaurar padrões
        </button>
        <button type="button" className="botao" onClick={onFechar}>Concluir</button>
      </div>
    </div>
  );
}

// Um banner completo: formulário, prévia e download. A página pode ter vários.
function EditorBanner({ modelo, numero, inicial, edicao, assets, locais, onLocaisChange, onRemover, registrar, onCurso }) {
  const canvasRef = useRef(null);
  const [dados, setDados] = useState(inicial);
  const [foto, setFoto] = useState(null);
  // Item do histórico que este banner atualiza ao baixar (editado, ou já salvo uma vez).
  const historicoRef = useRef(edicao ? { id: edicao.id, criadoEm: edicao.criadoEm } : null);
  const [editandoLocais, setEditandoLocais] = useState(false);
  const p = `b${numero}-`;

  const [statusHistorico, setStatusHistorico] = useState(null);
  const [nomeFoto, setNomeFoto] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const inputFotoRef = useRef(null);
  const [textoRapido, setTextoRapido] = useState("");
  const [resultadoRapido, setResultadoRapido] = useState(null);

  function preencherRapido() {
    const achados = preencherDoTexto(textoRapido, locais);
    // Só usa o que este modelo mostra no formulário.
    if (!modelo.campos.descricao) delete achados.descricao;
    if (!modelo.campos.vagasIdade) {
      delete achados.vagas;
      delete achados.idade;
    }
    setDados((d) => ({ ...d, ...achados }));
    setResultadoRapido(Object.keys(achados));
  }

  // Editando do histórico: recorta a foto do próprio banner salvo.
  useEffect(() => {
    if (!edicao?.imagemUrl) return;
    carregarImagem(`/api/historico/imagem?url=${encodeURIComponent(edicao.imagemUrl)}`)
      .then((banner) => {
        const FOTO = modelo.foto;
        const escala = banner.width / TAMANHO;
        const recorte = document.createElement("canvas");
        recorte.width = Math.round(FOTO.w * escala);
        recorte.height = Math.round(FOTO.h * escala);
        recorte
          .getContext("2d")
          .drawImage(banner, FOTO.x * escala, FOTO.y * escala, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height);
        setFoto(recorte);
        setNomeFoto("Imagem do banner salvo");
      })
      .catch(() => {});
  }, [edicao, modelo]);

  useEffect(() => {
    if (!assets || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    // Na ordem do modelo, não na ordem em que foram marcados.
    const parceiros = modelo.parceiros.filter((id) => dados.parceiros?.includes(id)).map((id) => assets.parceiros[id]);
    modelo.desenhar(ctx, { ...assets, foto, dados, parceiros });
  }, [modelo, assets, foto, dados]);

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

  async function gerarDescricao(curso = dados.curso) {
    setGerandoDescricao(true);
    setErroIA((e) => ({ ...e, descricao: "" }));
    try {
      const { descricao } = await chamarIA("/api/ia/descricao", { curso });
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
    setDados(modelo.padrao);
    removerFoto();
    setStatusHistorico(null);
    setTextoRapido("");
    setResultadoRapido(null);
  }

  function nomeArquivo() {
    const nome = (dados.curso || "banner")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `${modelo.id}-${nome || "banner"}.png`;
  }

  const gerarPng = () => new Promise((r) => canvasRef.current.toBlob(r, "image/png"));

  async function baixar() {
    const arquivo = nomeArquivo();
    const blob = await gerarPng();
    baixarArquivo(blob, arquivo);
    salvarNoHistorico(blob, arquivo);
  }

  // Usado pelo "Baixar todos" da página; sempre lê o estado mais recente.
  const exportarRef = useRef(null);
  exportarRef.current = async () => {
    const arquivo = nomeArquivo();
    const blob = await gerarPng();
    salvarNoHistorico(blob, arquivo);
    return { blob, arquivo };
  };
  useEffect(() => registrar(numero, () => exportarRef.current()), [numero, registrar]);
  useEffect(() => onCurso(numero, dados.curso), [numero, dados.curso, onCurso]);

  async function salvarNoHistorico(png, arquivo) {
    setStatusHistorico({ tipo: "info", texto: "Salvando no histórico..." });
    // O Vercel aceita no máximo ~4,5 MB por envio; PNG muito grande vai como JPEG.
    let imagem = png;
    if (png.size > 4 * 1024 * 1024) {
      imagem = await new Promise((r) => canvasRef.current.toBlob(r, "image/jpeg", 0.92));
      arquivo = arquivo.replace(/\.png$/, ".jpg");
    }
    const form = new FormData();
    form.append("cidade", modelo.id);
    form.append("imagem", imagem, arquivo);
    form.append("arquivo", arquivo);
    form.append("dados", JSON.stringify(dados));
    if (historicoRef.current) {
      form.append("id", historicoRef.current.id);
      form.append("criadoEm", historicoRef.current.criadoEm);
    }
    const atualizando = Boolean(historicoRef.current);
    try {
      const res = await fetch("/api/historico", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.item) historicoRef.current = { id: data.item.id, criadoEm: data.item.criadoEm };
      setStatusHistorico(
        res.ok
          ? { tipo: "ok", texto: atualizando ? "Banner baixado e atualizado no histórico." : "Banner baixado e salvo no histórico." }
          : { tipo: "erro", texto: `Banner baixado, mas não salvou no histórico: ${data.erro || res.status}` }
      );
    } catch {
      setStatusHistorico({ tipo: "erro", texto: "Banner baixado, mas não salvou no histórico (erro de conexão)." });
    }
  }

  const campo = { dados, onChange: alterar, prefixo: p };

  return (
    <section className="banner-bloco" id={`banner-${numero}`}>
      <div className="banner-bloco-topo">
        <h2>
          Banner {numero}{dados.curso.trim() ? ` · ${dados.curso.trim()}` : ""}
          {edicao && <span className="selo">Editando do histórico</span>}
        </h2>
        {onRemover && (
          <button type="button" className="link-acao perigo" onClick={onRemover}>Remover este banner</button>
        )}
      </div>
        <div className="editor">
          <form className="formulario" onSubmit={(e) => e.preventDefault()}>
            <fieldset className="secao rapido">
              <legend>Preenchimento rápido</legend>
              <textarea
                id={`${p}texto-rapido`}
                aria-label="Texto para preenchimento rápido"
                rows={2}
                value={textoRapido}
                placeholder={modelo.exemploRapido}
                onChange={(e) => setTextoRapido(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && textoRapido.trim()) preencherRapido();
                }}
              />
              <div className="rapido-acoes">
                <button type="button" className="botao" onClick={preencherRapido} disabled={!textoRapido.trim()}>
                  Preencher campos
                </button>
                <small>Reconhece curso, datas, local{modelo.campos.vagasIdade ? ", vagas, idade" : ""} e horário.</small>
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
              {modelo.campos.descricao && (
                <div className="campo">
                  <div className="rotulo-com-acao">
                    <label htmlFor={`${p}descricao`}>Descrição curta</label>
                    <button
                      type="button"
                      className="botao-ia"
                      onClick={() => gerarDescricao()}
                      disabled={gerandoDescricao || !dados.curso.trim()}
                      title={dados.curso.trim() ? "Criar descrição a partir do nome do curso" : "Preencha o nome do curso primeiro"}
                    >
                      {gerandoDescricao ? "Gerando..." : "✨ Gerar com IA"}
                    </button>
                  </div>
                  <input id={`${p}descricao`} name="descricao" value={dados.descricao} onChange={alterar} placeholder="Aprende-se a planejar viagens escolares educativas no campo." />
                  {erroIA.descricao && <small className="texto-erro">{erroIA.descricao}</small>}
                </div>
              )}
              {modelo.telefones && (
                <div className="linha">
                  {modelo.telefones.map((t) => (
                    <Campo key={t.nome} nome={t.nome} rotulo={t.rotulo} inputMode="tel" {...campo} />
                  ))}
                </div>
              )}
              {modelo.campos.vagasIdade && modelo.campos.contato && (
                <>
                  <div className="linha linha-4">
                    <Campo nome="vagas" rotulo="Vagas" type="number" min="1" inputMode="numeric" placeholder="16" disabled={dados.ocultarVagasIdade} {...campo} />
                    <Campo nome="idade" rotulo="Idade mín." type="number" min="0" inputMode="numeric" disabled={dados.ocultarVagasIdade} {...campo} />
                    <Campo nome="telefone" rotulo="Telefone" inputMode="tel" {...campo} />
                    <Campo nome="link" rotulo="Link" {...campo} />
                  </div>
                  <label className="opcao">
                    <input
                      type="checkbox"
                      checked={!dados.ocultarVagasIdade}
                      onChange={(e) => setDados((d) => ({ ...d, ocultarVagasIdade: !e.target.checked }))}
                    />
                    Mostrar vagas e idade no banner
                    <small>(desmarcado, fica só "CURSO GRATUITO")</small>
                  </label>
                </>
              )}
            </fieldset>

            <fieldset className="secao">
              <legend>Quando e onde</legend>
              <div className={modelo.datasMultilinha ? "" : "linha linha-datas"}>
                <Campo
                  nome="datas"
                  rotulo="Data(s)"
                  placeholder={modelo.exemploDatas}
                  multilinha={modelo.datasMultilinha}
                  rows={modelo.datasMultilinha ? 3 : undefined}
                  dica={modelo.datasMultilinha ? "Uma turma por linha. O que vem antes do \" - \" fica em negrito." : undefined}
                  {...campo}
                />
                <Campo nome="horario" rotulo="Horário" placeholder="8h00 às 17h00" {...campo} />
              </div>
              <div className="campo">
                <label htmlFor={`${p}local-salvo`}>Local</label>
                <div className="local-escolha">
                  <select
                    id={`${p}local-salvo`}
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
                  <LocaisSalvos locais={locais} padrao={modelo.locaisPadrao} onChange={onLocaisChange} onFechar={() => setEditandoLocais(false)} />
                )}
                <textarea
                  id={`${p}local`}
                  name="local"
                  aria-label="Endereço do local"
                  rows={2}
                  value={dados.local}
                  placeholder="Escolha acima ou digite o endereço"
                  onChange={alterar}
                  className="local-endereco"
                />
              </div>
            </fieldset>

            <fieldset className="secao">
              <legend>Logos de parceiros{modelo.apoio ? " e apoio" : ""}</legend>
              <div className="parceiros">
                {modelo.parceiros.map((id) => (
                  <label key={id} className={`parceiro${dados.parceiros?.includes(id) ? " marcado" : ""}`}>
                    <input
                      type="checkbox"
                      checked={dados.parceiros?.includes(id) || false}
                      onChange={(e) =>
                        setDados((d) => ({
                          ...d,
                          parceiros: e.target.checked
                            ? [...(d.parceiros || []), id]
                            : (d.parceiros || []).filter((p) => p !== id),
                        }))
                      }
                    />
                    <img src={PARCEIROS[id].src} alt="" />
                    <span>{PARCEIROS[id].nome}</span>
                  </label>
                ))}
              </div>
              {modelo.apoio && (
                <>
                  <label className="opcao">
                    <input
                      type="checkbox"
                      checked={dados.mostrarApoio || false}
                      onChange={(e) => setDados((d) => ({ ...d, mostrarApoio: e.target.checked }))}
                    />
                    Incluir texto de apoio
                  </label>
                  {dados.mostrarApoio && (
                    <input
                      id={`${p}apoio`}
                      name="apoio"
                      aria-label="Texto de apoio"
                      className="apoio-texto"
                      value={dados.apoio}
                      onChange={alterar}
                    />
                  )}
                </>
              )}
            </fieldset>

            <fieldset className="secao">
              <legend>Imagem do curso</legend>
              <div className="imagem-linha">
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
                  id={`${p}foto`}
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
                    <strong>Enviar imagem</strong>
                    <span>Clique ou arraste (em pé fica melhor)</span>
                  </>
                )}
              </label>
                <button
                  type="button"
                  className="botao secundario botao-gerar-imagem"
                  onClick={gerarImagem}
                  disabled={gerandoImagem || !dados.curso.trim()}
                  title={dados.curso.trim() ? "" : "Preencha o nome do curso primeiro"}
                >
                  {gerandoImagem ? "Gerando (até 1 min)..." : "✨ Gerar com IA"}
                </button>
              </div>
              {foto && (
                <button type="button" className="link-acao perigo" onClick={removerFoto}>Remover imagem</button>
              )}
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
                <Link className="link-acao" href={`/historico?cidade=${modelo.id}`}>Ver histórico</Link>
                <button type="button" className="link-acao" onClick={limpar}>Limpar campos</button>
              </div>
              {!dados.curso.trim() && <p className="dica">Preencha o nome do curso para baixar.</p>}
              {statusHistorico && (
                <p className={`aviso ${statusHistorico.tipo}`} role="status">{statusHistorico.texto}</p>
              )}
            </div>
          </aside>
        </div>
    </section>
  );
}

export default function EditorCidade({ modelo }) {
  const [assets, setAssets] = useState(null);
  const [locais, setLocais] = useState([]);
  const [banners, setBanners] = useState([{ numero: 1, inicial: modelo.padrao }]);
  const [baixandoTodos, setBaixandoTodos] = useState(false);
  const exportadores = useRef(new Map());
  const [cursos, setCursos] = useState({});
  const aoMudarCurso = useCallback((numero, curso) => setCursos((c) => ({ ...c, [numero]: curso })), []);

  const registrar = useCallback((numero, exportar) => {
    exportadores.current.set(numero, exportar);
    return () => exportadores.current.delete(numero);
  }, []);

  async function baixarTodos() {
    setBaixandoTodos(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const [i, b] of banners.entries()) {
        const exportar = exportadores.current.get(b.numero);
        if (!exportar) continue;
        const { blob, arquivo } = await exportar();
        zip.file(`${String(i + 1).padStart(2, "0")}-${arquivo}`, blob);
      }
      baixarArquivo(await zip.generateAsync({ type: "blob" }), `banners-${modelo.id}.zip`);
    } finally {
      setBaixandoTodos(false);
    }
  }

  useEffect(() => setLocais(carregarLocais(modelo.id, modelo.locaisPadrao)), [modelo]);

  // Vindo do histórico com "Reutilizar dados": o primeiro banner já abre preenchido.
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_REUTILIZAR);
      if (salvo) {
        sessionStorage.removeItem(CHAVE_REUTILIZAR);
        // "Editar" traz { dados, edicao }; "Reutilizar dados" traz só { dados }.
        const { dados, edicao } = JSON.parse(salvo);
        // Chave nova para o editor recomeçar com os dados reaproveitados.
        setBanners([{ numero: 1, chave: "reutilizado", inicial: { ...modelo.padrao, ...dados }, edicao }]);
      }
    } catch {}
  }, []);

  // Fundo, logos e fontes precisam estar carregados antes de desenhar.
  useEffect(() => {
    const familia = montserrat.style.fontFamily;
    Promise.all([
      carregarImagem(modelo.imagens.fundo),
      modelo.imagens.logos ? carregarImagem(modelo.imagens.logos) : null,
      Promise.all(modelo.parceiros.map((id) => carregarImagem(PARCEIROS[id].src).then((img) => [id, img]))),
      // Falha ao carregar fonte não deve travar o gerador: cai na fonte reserva.
      ...[500, 600, 700, 800, 900].map((peso) =>
        document.fonts.load(`${peso} 40px ${familia}`).catch(() => {})
      ),
      document.fonts.load(`700 40px ${tinos.style.fontFamily}`).catch(() => {}),
    ]).then(([fundo, logos, parceiros]) => setAssets({ fundo, logos, familia, familiaSerif: tinos.style.fontFamily, parceiros: Object.fromEntries(parceiros) }));
  }, [modelo]);

  function atualizarLocais(novos) {
    setLocais(novos);
    salvarLocais(modelo.id, novos);
  }

  function novoBanner() {
    const numero = Math.max(...banners.map((b) => b.numero)) + 1;
    setBanners((lista) => [...lista, { numero, inicial: modelo.padrao }]);
  }

  function removerBanner(numero) {
    if (!confirm(`Remover o banner ${numero} desta página?`)) return;
    setBanners((lista) => lista.filter((b) => b.numero !== numero));
  }

  return (
    <>
      <Cabecalho />
      <main className="container">
        <div className="titulo-pagina">
          <Link href="/" className="voltar">← Cidades</Link>
          <h1>Banners de {modelo.nome}</h1>
          <p>Preencha os dados e veja a prévia na hora. Dá para montar vários banners nesta mesma página.</p>
        </div>

        {banners.map((b) => (
          <EditorBanner
            modelo={modelo}
            key={b.chave || b.numero}
            numero={b.numero}
            inicial={b.inicial}
            edicao={b.edicao}
            registrar={registrar}
            onCurso={aoMudarCurso}
            assets={assets}
            locais={locais}
            onLocaisChange={atualizarLocais}
            onRemover={banners.length > 1 ? () => removerBanner(b.numero) : null}
          />
        ))}

        <div className="acoes-pagina">
          <button type="button" className="novo-banner" onClick={novoBanner}>
            + Criar outro banner
          </button>
          <button type="button" className="botao grande baixar-todos" onClick={baixarTodos} disabled={!assets || baixandoTodos}>
            {baixandoTodos ? "Preparando..." : `Baixar todos (${banners.length}) em .zip`}
          </button>
        </div>

        <ListaCursos titulo="Cursos desta página" cursos={banners.map((b) => cursos[b.numero] || "")} />
      </main>
    </>
  );
}
