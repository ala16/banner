export default function SairButton() {
  return (
    <form action="/api/logout" method="post">
      <button className="botao secundario" type="submit">Sair</button>
    </form>
  );
}
