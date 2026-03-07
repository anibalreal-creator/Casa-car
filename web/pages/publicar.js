import { useState } from "react";

export default function Publicar() {
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [descripcion, setDescripcion] = useState("");
  const [msg, setMsg] = useState("");

  const publicar = async () => {
    if (!titulo || !precio) {
      setMsg("Completá título y precio");
      return;
    }

    const r = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        precio: Number(precio),
        moneda,
        descripcion,
      }),
    });

    if (r.ok) {
      window.location.href = "/";
    } else {
      setMsg("Error al publicar");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Publicar anuncio</h1>

      <input
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />

      <input
        placeholder="Precio"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
      />

      <select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
        <option>USD</option>
        <option>BRL</option>
        <option>ARS</option>
      </select>

      <textarea
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      <br />
      <button onClick={publicar}>Publicar</button>

      {msg && <p>{msg}</p>}
    </div>
  );
}
