import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Publicar() {

const [categoria,setCategoria] = useState("propiedad")

const [titulo,setTitulo] = useState("")
const [precio,setPrecio] = useState("")
const [descripcion,setDescripcion] = useState("")

const [marca,setMarca] = useState("")
const [modelo,setModelo] = useState("")
const [anio,setAnio] = useState("")
const [kilometraje,setKilometraje] = useState("")

const [tipo,setTipo] = useState("")
const [ciudad,setCiudad] = useState("")
const [dormitorios,setDormitorios] = useState("")
const [banos,setBanos] = useState("")
const [metros,setMetros] = useState("")

async function publicar(e){

e.preventDefault()

const {error} = await supabase
.from("listings")
.insert([{
titulo,
precio,
descripcion,
categoria,
marca,
modelo,
anio,
kilometraje,
tipo,
ciudad,
dormitorios,
banos,
metros
}])

if(error){
alert("Error publicando")
console.log(error)
}else{
alert("Publicado correctamente")
window.location="/"
}

}

return(

<div style={{padding:20}}>

<h1>Publicar anuncio</h1>

<form onSubmit={publicar}>

<select value={categoria} onChange={(e)=>setCategoria(e.target.value)}>

<option value="propiedad">Propiedad</option>

<option value="auto">Auto</option>

</select>

<br/><br/>

<input
placeholder="Título"
value={titulo}
onChange={(e)=>setTitulo(e.target.value)}
/>

<input
placeholder="Precio"
value={precio}
onChange={(e)=>setPrecio(e.target.value)}
/>

<textarea
placeholder="Descripción"
value={descripcion}
onChange={(e)=>setDescripcion(e.target.value)}
/>

<br/><br/>

{categoria==="propiedad" && (

<>

<h3>Datos de propiedad</h3>

<input
placeholder="Tipo (casa, depto...)"
value={tipo}
onChange={(e)=>setTipo(e.target.value)}
/>

<input
placeholder="Ciudad"
value={ciudad}
onChange={(e)=>setCiudad(e.target.value)}
/>

<input
placeholder="Dormitorios"
value={dormitorios}
onChange={(e)=>setDormitorios(e.target.value)}
/>

<input
placeholder="Baños"
value={banos}
onChange={(e)=>setBanos(e.target.value)}
/>

<input
placeholder="Metros"
value={metros}
onChange={(e)=>setMetros(e.target.value)}
/>

</>

)}

{categoria==="auto" && (

<>

<h3>Datos del auto</h3>

<input
placeholder="Marca"
value={marca}
onChange={(e)=>setMarca(e.target.value)}
/>

<input
placeholder="Modelo"
value={modelo}
onChange={(e)=>setModelo(e.target.value)}
/>

<input
placeholder="Año"
value={anio}
onChange={(e)=>setAnio(e.target.value)}
/>

<input
placeholder="Kilometraje"
value={kilometraje}
onChange={(e)=>setKilometraje(e.target.value)}
/>

</>

)}

<br/><br/>

<button type="submit">

Publicar

</button>

</form>

</div>

)

}
