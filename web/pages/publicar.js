import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Publicar() {
  const [titulo, setTitulo] = useState("")
  const [precio, setPrecio] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [telefono, setTelefono] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [dormitorios, setDormitorios] = useState("")
  const [banos, setBanos] = useState("")
  const [pileta, setPileta] = useState(false)
  const [fotos, setFotos] = useState([])
  const [preview, setPreview] = useState(null)
  const [cargando, setCargando] = useState(false)

  function seleccionarFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotos([file])
    setPreview(URL.createObjectURL(file))
  }

  async function publicar(e) {
    e.preventDefault()
    setCargando(true)

    try {
      let nombresFotos = []

      for (let i = 0; i < fotos.length; i++) {
        const file = fotos[i]
        const filename = Date.now() + "_" + file.name

        const { error: uploadError } = await supabase
          .storage
          .from("listings")
          .upload(filename, file)

        if (uploadError) {
          alert(uploadError.message)
          setCargando(false)
          return
        }

        nombresFotos.push(filename)
      }

      const precioNumero = precio ? Number(precio) : 0

      const payload = {
        title: titulo,
        price: precioNumero,
        precio: precioNumero,
        city: ciudad,
        telefono: telefono,
        description: descripcion,
        dormitorios: dormitorios ? Number(dormitorios) : null,
        banos: banos ? Number(banos) : null,
        pileta: pileta,
        photos: nombresFotos,
        currency: "USD"
      }

      const { error } = await supabase
        .from("listings")
        .insert([payload])

      if (error) {
        alert(error.message)
        setCargando(false)
        return
      }

      alert("Publicado correctamente")
      window.location.href = "/"
    } catch (err) {
      alert(err.message)
      setCargando(false)
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Publicar anuncio</h1>

      <form onSubmit={publicar} style={styles.form}>
        <input
          placeholder="Título"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          style={styles.input}
        />

        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={e => setPrecio(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Ciudad"
          value={ciudad}
          onChange={e => setCiudad(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Teléfono (WhatsApp)"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          style={styles.input}
        />

        <input
          type="number"
          placeholder="Dormitorios"
          value={dormitorios}
          onChange={e => setDormitorios(e.target.value)}
          style={styles.input}
        />

        <input
          type="number"
          placeholder="Baños"
          value={banos}
          onChange={e => setBanos(e.target.value)}
          style={styles.input}
        />

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={pileta}
            onChange={e => setPileta(e.target.checked)}
          />
          <span style={styles.checkboxText}>¿Tiene pileta?</span>
        </label>

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          style={styles.textarea}
        />

        <input
          type="file"
          accept="image/*"
          onChange={seleccionarFoto}
        />

        {preview && (
          <img src={preview} style={styles.preview} />
        )}

        <button disabled={cargando} style={styles.button}>
          {cargando ? "Publicando..." : "Publicar anuncio"}
        </button>
      </form>
    </div>
  )
}

const styles = {
  page: {
    padding: 30,
    maxWidth: 600,
    margin: "auto",
    fontFamily: "Arial"
  },
  title: {
    fontSize: 32,
    marginBottom: 20
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 15
  },
  input: {
    padding: 14,
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #ddd"
  },
  textarea: {
    padding: 14,
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #ddd",
    minHeight: 100
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 16
  },
  checkboxText: {
    color: "#111827",
    fontWeight: "bold"
  },
  button: {
    padding: 16,
    fontSize: 18,
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },
  preview: {
    marginTop: 10,
    width: "100%",
    borderRadius: 12
  }
}