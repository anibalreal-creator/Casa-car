import { useState } from "react";
import { getImagePresentation } from "../lib/imagePresentation";

export default function ImageGallery({ images = [], initialIndex = 0, item = null }) {
  const safe = Array.isArray(images) && images.length ? images : ["https://picsum.photos/seed/casacar/1200/800"];
  const [index, setIndex] = useState(initialIndex || 0);
  const current = safe[index] || safe[0];
  const imagePresentation = getImagePresentation(item || {});

  function prev() { setIndex((i) => (i === 0 ? safe.length - 1 : i - 1)); }
  function next() { setIndex((i) => (i === safe.length - 1 ? 0 : i + 1)); }

  return (
    <div style={styles.wrap}>
      <div style={styles.heroBox}>
        {safe.length > 1 ? <button type="button" onClick={prev} style={{...styles.nav,left:10}}>‹</button> : null}
        <img src={current} alt="principal" style={styles.hero(imagePresentation)} />
        {safe.length > 1 ? <button type="button" onClick={next} style={{...styles.nav,right:10}}>›</button> : null}
      </div>
      {safe.length > 1 ? (
        <div style={styles.thumbs}>
          {safe.map((img, idx) => (
            <button key={img + idx} type="button" onClick={() => setIndex(idx)} style={styles.thumbBtn(idx === index)}>
              <img src={img} alt={"thumb-" + idx} style={styles.thumb(imagePresentation)} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
const styles = {
  wrap:{display:"grid",gap:10},
  heroBox:{position:"relative",overflow:"hidden",borderRadius:18,background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",minHeight:540},
  hero:(presentation)=>({width:"100%",height:540,objectFit:presentation?.fit || "contain",objectPosition:presentation?.position || "center center",display:"block",background:presentation?.background || "#f8fafc"}),
  nav:{position:"absolute",top:"50%",transform:"translateY(-50%)",width:42,height:42,borderRadius:"50%",border:"none",background:"#111827cc",color:"#fff",fontSize:24,cursor:"pointer"},
  thumbs:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:10},
  thumbBtn:(active)=>({border:active?"2px solid #2563eb":"1px solid #d1d5db",padding:0,borderRadius:12,overflow:"hidden",background:"#fff",cursor:"pointer"}),
  thumb:(presentation)=>({width:"100%",height:80,objectFit:presentation?.fit || "contain",objectPosition:presentation?.position || "center center",display:"block",background:presentation?.background || "#f8fafc"})
};
