import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Publicar() {
  const [categoria, setCategoria] = useState("propiedad")
  const [titulo, setTitulo] = useState("")
  const [precio, setPrecio] = useState("")
  const [descripcion, setDescripcion] = useState("")

  const [marca, setMarca] = useState("")
  const [modelo, setModelo] = useState("")
  const [anio, setAnio] = useState("")
  const [kilometraje, setKilometraje] = useState("")

  const [tipo, setTipo] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [dormitorios, setDormitorios] = useState("")
  const [banos, setBanos] = useState("")
  const [metros, setMetros] = useState("")

  const [fotos, setFotos] = useState([])

  async function publicar(e) {
    e.preventDefault()

    const { data, error } = await supabase
      .from("listings")
      .insert([
        {
          titulo,
          precio: precio ? Number(precio) : null,
          descripcion,
          categoria,
          marca,
          modelo,
          anio: anio ? Number(anio) : null,
          kilometraje: kilometraje ? Number(kilometraje) : null,
          tipo,
          ciudad,
          dormitorios: dormitorios ? Number(dormitorios) : null,
          banos: banos ? Number(banos) : null,
          metros: metros ? Number(metros) : null,
        },
      ])
      .select()
      .single()

    if (error) {
      alert("Error publicando")
      console.log(error)
      return
    }

    const listingId = data.id

    if (fotos.length > 0) {
      for (let i = 0; i < fotos.length; i++) {
        const file = fotos[i]
        const ext = file.name.split(".").pop()
        const path = `${listingId}/${Date.now()}_${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("listings")
          .upload(path, file)

        if (uploadError) {
          console.log(uploadError)
          continue
        }

        await supabase.from("anuncio_fotos").insert([
          {
            anuncio_id: listingId,
            path,
            orden: i,
          },
        ])
      }
    }

    alert("Publicado correctamente")
    window.location.href = "/"
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Publicar anuncio</h1>

      <form onSubmit={publicar}>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="propiedad">Propiedad</option>
          <option value="auto">Auto</option>
        </select>

        <br /><br />

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

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <br /><br />

        {categoria === "auto" && (
          <>
            <h3>Datos del auto</h3>

            <input
              placeholder="Marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />

            <input
              placeholder="Modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
            />

            <input
              placeholder="Año"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
            />

            <input
              placeholder="Kilometraje"
              value={kilometraje}
              onChange={(e) => setKilometraje(e.target.value)}
            />
          </>
        )}

        {categoria === "propiedad" && (
          <>
            <h3>Datos de propiedad</h3>

            <input
              placeholder="Tipo (casa, depto)"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            />

            <input
              placeholder="Ciudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
            />

            <input
              placeholder="Dormitorios"
              value={dormitorios}
              onChange={(e) => setDormitorios(e.target.value)}
            />

            <input
              placeholder="Baños"
              value={banos}
              onChange={(e) => setBanos(e.target.value)}
            />

            <input
              placeholder="Metros"
              value={metros}
              onChange={(e) => setMetros(e.target.value)}
            />
          </>
        )}

        <br /><br />

        <input
          type="file"
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