import Link from "next/link";

// Barra do topo com logo e navegação, usada em todas as páginas internas.
export default function Cabecalho({ ativo }) {
  return (
    <header className="cabecalho">
      <div className="cabecalho-conteudo">
        <Link href="/" className="marca">
          <img src="/logo-icone.png" alt="" width="40" height="40" />
          <span>
            <strong>SENAR</strong> Banners
          </span>
        </Link>
        <nav className="menu">
          <Link href="/" aria-current={ativo === "inicio" ? "page" : undefined}>Início</Link>
          <Link href="/historico" aria-current={ativo === "historico" ? "page" : undefined}>Histórico</Link>
          <form action="/api/logout" method="post">
            <button type="submit">Sair</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
