import { createClient } from "https://esm.sh/@supabase/supabase-js"

const supabase = createClient(
  "https://cdmlyrjcccdxakvbmmbb.supabase.co",
  "TU_PUBLIC_ANON_KEY"
)

const form = document.querySelector("form")

form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const titulo = document.querySelector("#titulo").value
  const precio = document.querySelector("#precio").value
  const ciudad = document.querySelector("#ciudad").value
  const files = document.querySelector("#imagenes").files

  let fotos = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filename = Date.now() + "_" + file.name

    const { data, error } = await supabase.storage
      .from("listings")
      .upload(filename, file)

    if (!error) {
      fotos.push(filename)
    }
  }

  const { error } = await supabase
    .from("listings")
    .insert([
      {
        title: titulo,
        price: precio,
        city: ciudad,
        photos: fotos
      }
    ])

  if (!error) {
    alert("Publicado correctamente")
    window.location.href = "/"
  } else {
    alert("Error al publicar")
    console.log(error)
  }
})