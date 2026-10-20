"use client";

import { useState } from "react";

export default function LoginPage() {
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
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
      <form className="login-card" onSubmit={entrar}>
        <img src="/logo.png" alt="SENAR Banners" width="200" height="200" className="login-logo" />
        <p className="login-sub">Gerador de banners de cursos</p>
        <div className="campo">
          <label htmlFor="senha">Senha de acesso</label>
          <div className="senha">
            <input
              id="senha"
              type={mostrar ? "text" : "password"}
              autoFocus
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button type="button" className="ver-senha" onClick={() => setMostrar((v) => !v)}>
              {mostrar ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>
        {erro && <p className="aviso erro" role="alert">{erro}</p>}
        <button className="botao grande" type="submit" disabled={carregando || !senha}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
