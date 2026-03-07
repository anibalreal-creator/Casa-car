import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
})

const fallbackPosition = [-34.6037, -58.3816]

export default function Map({ city }) {
  const [position, setPosition] = useState(fallbackPosition)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buscarUbicacion() {
      if (!city || city === "Sin ciudad") {
        setPosition(fallbackPosition)
        setLoading(false)
        return
      }

      try {
        const query = encodeURIComponent(`${city}, Argentina`)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
        )
        const data = await res.json()

        if (data && data.length > 0) {
          setPosition([Number(data[0].lat), Number(data[0].lon)])
        } else {
          setPosition(fallbackPosition)
        }
      } catch (error) {
        setPosition(fallbackPosition)
      }

      setLoading(false)
    }

    buscarUbicacion()
  }, [city])

  if (loading) {
    return (
      <div
        style={{
          height: 300,
          borderRadius: 14,
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: 18
        }}
      >
        Cargando mapa...
      </div>
    )
  }

  return (
    <div style={{ height: 300, borderRadius: 14, overflow: "hidden" }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>{city || "Ubicación"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}