import { useState } from "react";

export default function LocationPickerMap({ lat,lng }){

  const [zoom,setZoom] = useState(15);

  const src = lat && lng
  ? `https://www.openstreetmap.org/export/embed.html?marker=${lat},${lng}&layer=mapnik`
  : "https://www.openstreetmap.org/export/embed.html";

  return (

    <div style={{marginTop:20}}>

      <div style={{display:"flex",gap:10,marginBottom:10}}>
        <button onClick={()=>setZoom(zoom+1)}>+</button>
        <button onClick={()=>setZoom(zoom-1)}>-</button>
      </div>

      <iframe
        title="map"
        src={src}
        style={{
          width:"100%",
          height:350,
          border:0,
          borderRadius:12
        }}
      />

    </div>
  )
}
