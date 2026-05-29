import { useEffect, useMemo, useState } from "react";
import AdminDashboard from "../components/AdminDashboard";

export default function AdminCompleto() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]));
  }, []);

  const stats = useMemo(() => ({
    total: items.length,
    premium: items.filter((x) => x.is_premium).length,
    featured: items.filter((x) => x.featured).length,
    views: items.reduce((acc, x) => acc + Number(x.views || 0), 0),
  }), [items]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Admin completo</h1>
        <p style={styles.subtitle}>Panel general de control del marketplace.</p>
        <AdminDashboard stats={stats} />
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Título</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Ciudad</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Views</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.title}</td>
                  <td style={styles.td}>{item.category}</td>
                  <td style={styles.td}>{item.city}</td>
                  <td style={styles.td}>{item.currency} {item.price}</td>
                  <td style={styles.td}>{item.views || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",padding:"28px 16px",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1300,margin:"0 auto"},
  title:{fontSize:46,margin:"0 0 6px 0"},
  subtitle:{color:"#6b7280",marginBottom:18},
  tableWrap:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden"},
  table:{width:"100%",borderCollapse:"collapse"},
  th:{textAlign:"left",padding:14,background:"#f8fafc",borderBottom:"1px solid #e5e7eb"},
  td:{padding:14,borderBottom:"1px solid #f1f5f9"}
};
