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
  const [descripcion, setDescripcion] = useState("")
  const [fotos, setFotos] = useState([])
  const [cargando, setCargando] = useState(false)

  async function publicar(e) {
    e.preventDefault()

    try {
      setCargando(true)

      const nombresFotos = []

      for (let i = 0; i < fotos.length; i++) {
        const file = fotos[i]
        const filename = `${Date.now()}_${i}_${file.name}`

        const { error: uploadError } = await supabase.storage
          .from("listings")
          .upload(filename, file)

        if (uploadError) {
          alert("ERROR SUBIENDO FOTO: " + (uploadError.message || JSON.stringify(uploadError)))
          console.log("UPLOAD ERROR:", uploadError)
          setCargando(false)
          return
        }

        nombresFotos.push(filename)
      }

      const valorPrecio = precio ? Number(precio) : 0

      const payload = {
        title: titulo,
        price: valorPrecio,
        precio: valorPrecio,
        city: ciudad,
        description: descripcion,
        photos: nombresFotos,
        currency: "USD"
      }

      const { data, error } = await supabase
        .from("listings")
        .insert([payload])
        .select()

      if (error) {
        alert("ERROR AL PUBLICAR: " + (error.message || JSON.stringify(error)))
        console.log("INSERT ERROR:", error)
        setCargando(false)
        return
      }

      console.log("INSERT OK:", data)
      alert("Publicado correctamente")
      window.location.href = "/"
    } catch (err) {
      alert("ERROR INESPERADO: " + (err.message || JSON.stringify(err)))
      console.log("CATCH ERROR:", err)
      setCargando(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Publicar anuncio</h1>

      <form onSubmit={publicar}>
        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
        />

        <br />
        <br />

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <br />
        <br />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFotos(Array.from(e.target.files || []))}
        />

        <br />
        <br />

        <button type="submit" disabled={cargando}>
          {cargando ? "Publicando..." : "Publicar"}
        </button>
      </form>
    </div>
  )
}