import Link from "next/link";
import Cabecalho from "./Cabecalho";
import { CIDADES } from "@/lib/cidades";

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
          {CIDADES.map((c) => (
            <div className="cidade ativa" key={c.id}>
              <div className="cidade-texto">
                <strong>{c.nome}</strong>
                <span>{c.sindicato}</span>
              </div>
              <div className="cidade-botoes">
                <Link href={`/${c.id}`} className="botao">+ Criar banner</Link>
                <Link href={`/historico?cidade=${c.id}`} className="botao secundario">Ver histórico</Link>
              </div>
            </div>
          ))}
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
