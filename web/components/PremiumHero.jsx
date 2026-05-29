
export default function PremiumHero(){
  return(
    <div style={{
      background:"linear-gradient(180deg,#111827,#1d4ed8)",
      color:"#fff",
      borderRadius:24,
      padding:30,
      display:"flex",
      flexDirection:"column",
      justifyContent:"center"
    }}>
      <img src="/logo.png" style={{width:80, marginBottom:10}}/>
      <h2 style={{fontSize:32, fontWeight:900}}>Casa-Car</h2>
      <p style={{opacity:.8}}>Marketplace global</p>
      <h1 style={{fontSize:36, fontWeight:900, marginTop:20}}>
        Encontrá propiedades, autos y más
      </h1>
    </div>
  )
}
