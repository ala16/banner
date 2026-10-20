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
          <div className="cidade ativa">
            <div className="cidade-texto">
              <strong>Atibaia</strong>
              <span>Sindicato Rural de Atibaia</span>
            </div>
            <div className="cidade-botoes">
              <Link href="/atibaia" className="botao">+ Criar banner</Link>
              <Link href="/historico?cidade=atibaia" className="botao secundario">Ver histórico</Link>
            </div>
          </div>
          <div className="cidade desativada" aria-disabled="true">
            <div className="cidade-texto">
              <strong>Bragança</strong>
              <span>Em breve</span>
            </div>
          </div>
          <div className="cidade desativada" aria-disabled="true">
            <div className="cidade-texto">
              <strong>Outro</strong>
              <span>Em breve</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
