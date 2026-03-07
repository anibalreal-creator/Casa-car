import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Map({ city }) {

  const coords = {
    "Salta": [-24.7829, -65.4232],
    "Cordoba": [-31.4201, -64.1888],
    "Santa Fe": [-31.6333, -60.7000],
    "Buenos Aires": [-34.6037, -58.3816],
  };

  const position = coords[city] || [-34.6037, -58.3816];

  return (
    <MapContainer center={position} zoom={13} style={{ height: "350px", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Ubicación aproximada
        </Popup>
      </Marker>
    </MapContainer>
  );
}