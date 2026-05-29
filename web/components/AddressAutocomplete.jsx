import { useState } from "react";

export default function AddressAutocomplete({ onSelect }) {
  const [query,setQuery] = useState("");
  const [results,setResults] = useState([]);

  async function search(v){
    setQuery(v);
    if(v.length < 3){
      setResults([]);
      return;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(v)}`;

    const r = await fetch(url);
    const data = await r.json();

    setResults(data.slice(0,5));
  }

  return (
    <div style={{position:"relative"}}>

      <input
        placeholder="Dirección o código postal"
        value={query}
        onChange={(e)=>search(e.target.value)}
        style={{width:"100%",padding:10,border:"1px solid #ccc",borderRadius:8}}
      />

      {results.length>0 && (
        <div style={{
          position:"absolute",
          background:"#fff",
          border:"1px solid #ddd",
          width:"100%",
          zIndex:10
        }}>

          {results.map((r)=>(
            <div
              key={r.place_id}
              onClick={()=>{
                setQuery(r.display_name);
                setResults([]);
                onSelect({
                  address:r.display_name,
                  lat:r.lat,
                  lng:r.lon
                });
              }}
              style={{padding:10,cursor:"pointer"}}
            >
              {r.display_name}
            </div>
          ))}

        </div>
      )}

    </div>
  );
}
