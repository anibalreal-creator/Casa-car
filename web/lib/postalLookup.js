export async function lookupPostalCode(code){
  if(!code || code.length < 3) return null

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&postalcode=${encodeURIComponent(code)}`

  try{
    const r = await fetch(url)
    const data = await r.json()
    if(!data.length) return null

    const a = data[0].address || {}

    return {
      city: a.city || a.town || a.village || "",
      state: a.state || "",
      country: a.country || "",
      lat: data[0].lat,
      lng: data[0].lon
    }

  }catch(e){
    return null
  }
}
