import Link from "next/link";
import Cabecalho from "./Cabecalho";

export default function Home() {
  return (
    <>
      <Cabecalho ativo="inicio" />
      <main className="container">
        <section className="intro">
          <h1>Qual cidade vai divulgar?</h1>
          <p>Escolha a cidade para preencher os dados do curso e gerar o banner pronto para postar.</p>
        </section>

        <div className="cidades">
          <Link href="/atibaia" className="cidade">
            <img src="/atibaia/capa.jpg" alt="" className="cidade-capa" />
            <div className="cidade-texto">
              <strong>Atibaia</strong>
              <span>Sindicato Rural de Atibaia</span>
            </div>
            <span className="cidade-acao">Criar banner →</span>
          </Link>
          <div className="cidade desativada" aria-disabled="true">
            <div className="cidade-capa vazia" />
            <div className="cidade-texto">
              <strong>Bragança</strong>
              <span>Em breve</span>
            </div>
          </div>
          <div className="cidade desativada" aria-disabled="true">
            <div className="cidade-capa vazia" />
            <div className="cidade-texto">
              <strong>Outro</strong>
              <span>Em breve</span>
            </div>
          </div>
        </div>

        <Link href="/historico" className="atalho-historico">
          <strong>Histórico de banners</strong>
          <span>Veja, baixe de novo ou reaproveite banners já criados →</span>
        </Link>
      </main>
    </>
  );
}
