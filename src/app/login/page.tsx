export default async function Login({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="login-page">
      <form className="login-card" action="/api/login" method="post">
        <p className="eyebrow">Acceso privado</p>
        <h1>Solo administradores</h1>
        {params.error ? <p className="error">Usuario o contrasena incorrectos.</p> : null}
        <label>
          Usuario
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          Contrasena
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Entrar</button>
        <a href="/">Regresar al croquis</a>
      </form>
    </main>
  );
}
