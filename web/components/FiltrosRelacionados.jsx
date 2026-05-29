
import React from "react";

export default function FiltrosRelacionados() {
  return (
    <div style={{marginTop:"50px",paddingTop:"30px",borderTop:"1px solid #e5e5e5"}}>
      <h3 style={{marginBottom:"20px"}}>Explorar más propiedades</h3>

      <div style={{marginBottom:"20px"}}>
        <strong>Ubicación</strong>
        <div style={{marginTop:"8px",lineHeight:1.8}}>
          <a href="#">Centro</a> ·
          <a href="#"> Candioti Norte</a> ·
          <a href="#"> Barrio Norte</a> ·
          <a href="#"> Sargento Cabral</a> ·
          <a href="#"> Constituyentes</a> ·
          <a href="#"> Barranquitas</a>
        </div>
      </div>

      <div style={{marginBottom:"20px"}}>
        <strong>Ambientes</strong>
        <div style={{marginTop:"8px",lineHeight:1.8}}>
          <a href="#">1 ambiente</a> ·
          <a href="#"> 2 ambientes</a> ·
          <a href="#"> 3 ambientes</a> ·
          <a href="#"> 4 ambientes</a> ·
          <a href="#"> 5 ambientes</a>
        </div>
      </div>

      <div>
        <strong>Servicios Generales</strong>
        <div style={{marginTop:"8px",lineHeight:1.8}}>
          <a href="#">Agua corriente</a> ·
          <a href="#"> Calefacción</a> ·
          <a href="#"> Electricidad</a> ·
          <a href="#"> Gas natural</a> ·
          <a href="#"> Internet</a>
        </div>
      </div>
    </div>
  );
}
