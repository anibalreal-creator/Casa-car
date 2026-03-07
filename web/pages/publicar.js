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

  async function publicar(e) {
    e.preventDefault()

    let nombresFotos = []

    for (let i = 0; i < fotos.length; i++) {
      const file = fotos[i]
      const filename = `${Date.now()}_${i}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(filename, file)

      if (!uploadError) {
        nombresFotos.push(filename)
      } else {
        console.log(uploadError)
      }
    }

    const { error } = await supabase
      .from("listings")
      .insert([
        {
          title: titulo,
          price: precio ? Number(precio) : null,
          city: ciudad,
          description: descripcion,
          photos: nombresFotos
        }
      ])

    if (!error) {
      alert("Publicado correctamente")
      window.location.href = "/"
    } else {
      alert("Error al publicar")
      console.log(error)
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

        <br /><br />

        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />

        <br /><br />

        <input
          type="text"
          placeholder="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
        />

        <br /><br />

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <br /><br />

        <input
          type="file"
          id="imagenes"
          multiple
          accept="image/*"
          onChange={(e) => setFotos(Array.from(e.target.files || []))}
        />

        <br /><br />

        <button type="submit">Publicar</button>
      </form>
    </div>
  )
}