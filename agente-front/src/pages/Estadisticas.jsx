import { useEffect, useState } from "react";
import api from "../api/api";

export default function Estadisticas() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get("/estadisticas").then((res) => {
      setStats(res.data);
      setCargando(false);
    }).catch(error => {
      console.error("Error:", error);
      setCargando(false);
    });
  }, []);

  if (cargando) return <div style={{ padding: "20px" }}>Cargando estadísticas...</div>;
  if (!stats) return <div style={{ padding: "20px" }}>Error al cargar estadísticas</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>Estadísticas</h1>

      <div style={{
        backgroundColor: "#f3f4f6",
        padding: "20px",
        borderRadius: "8px"
      }}>
        <div style={{ marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid #ddd" }}>
          <p style={{ fontSize: "16px", color: "#666" }}>Total búsquedas</p>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb" }}>{stats.total_busquedas}</p>
        </div>

        <div style={{ marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid #ddd" }}>
          <p style={{ fontSize: "16px", color: "#666" }}>Artículos guardados</p>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#16a34a" }}>{stats.total_articulos_guardados}</p>
        </div>

        <div>
          <p style={{ fontSize: "16px", color: "#666" }}>Etiquetas únicas</p>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#ea580c" }}>{stats.etiquetas_unicas}</p>
        </div>
      </div>
    </div>
  );
}