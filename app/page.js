import Link from "next/link";
import SairButton from "./SairButton";

export default function Home() {
  return (
    <main className="container">
      <div className="topo">
        <h1>Escolha a cidade</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/historico" className="botao secundario">Histórico</Link>
          <SairButton />
        </div>
      </div>
      <div className="cidades">
        <Link href="/atibaia" className="cidade">
          <strong>Atibaia</strong>
          <span>Sindicato Rural de Atibaia</span>
        </Link>
        <div className="cidade desativada" aria-disabled="true">
          <strong>Bragança</strong>
          <span>Em breve</span>
        </div>
        <div className="cidade desativada" aria-disabled="true">
          <strong>Outro</strong>
          <span>Em breve</span>
        </div>
      </div>
    </main>
  );
}
