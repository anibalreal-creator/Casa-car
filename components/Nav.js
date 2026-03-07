export default function Nav() {
  const a = { textDecoration: "underline" };
  return (
    <div style={{ marginBottom: 14 }}>
      <a style={a} href="/">Inicio</a> &nbsp;|&nbsp; <a style={a} href="/publicar">Publicar anuncio</a> &nbsp;|&nbsp;{" "}
      <a style={a} href="/dashboard">Dashboard</a>
    </div>
  );
}
