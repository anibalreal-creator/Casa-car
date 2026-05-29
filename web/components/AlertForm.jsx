export default function AlertForm() {
  async function createAlert(e) {
    e.preventDefault();

    const title = e.target.title.value;
    const search = e.target.search.value;

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        search_query: search,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "No se pudo guardar la alerta");
      return;
    }

    alert("Alerta guardada");
    e.target.reset();
  }

  return (
    <form onSubmit={createAlert} style={{ display: "grid", gap: 10 }}>
      <input name="title" placeholder="Nombre de la alerta" required />
      <input name="search" placeholder="Búsqueda" />
      <button type="submit">Guardar alerta</button>
    </form>
  );
}
