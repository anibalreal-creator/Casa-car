import { useState } from "react"
import { lookupPostalCode } from "../lib/postalLookup"

export default function PostalCodeInput({ setFormData }){

  const [loading,setLoading] = useState(false)

  async function handleChange(code){

    setFormData(p => ({...p, postal_code:code}))

    if(code.length < 4) return

    setLoading(true)

    const res = await lookupPostalCode(code)

    if(res){
      setFormData(p => ({
        ...p,
        city: res.city || p.city,
        state: res.state || p.state,
        country: res.country || p.country,
        lat: res.lat || p.lat,
        lng: res.lng || p.lng
      }))
    }

    setLoading(false)
  }

  return (
    <div style={{display:"grid",gap:6}}>

      <label>Código postal</label>

      <input
        placeholder="Ej: 3000"
        onChange={(e)=>handleChange(e.target.value)}
        style={{padding:10,border:"1px solid #ccc",borderRadius:8}}
      />

      {loading && <small>Buscando ubicación…</small>}

    </div>
  )
}
