"use client";

import { useState } from "react";

export default function LoginPage() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      setErro(data.erro || "Não foi possível entrar.");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    }
    setCarregando(false);
  }

  return (
    <main className="login">
      <form className="card" onSubmit={entrar}>
        <h1>Gerador de Banners</h1>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        {erro && <p className="erro">{erro}</p>}
        <button className="botao" type="submit" disabled={carregando || !senha} style={{ width: "100%" }}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
