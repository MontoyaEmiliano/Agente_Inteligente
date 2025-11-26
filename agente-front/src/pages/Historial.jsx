import { useEffect, useState } from "react";
import api from "../api/api";

export default function Historial() {
  const [hist, setHist] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get("/historial").then((res) => {
      setHist(res.data.historial);
      setCargando(false);
    }).catch(error => {
      console.error("Error:", error);
      setCargando(false);
    });
  }, []);

  if (cargando) return <div style={{ padding: "20px" }}>Cargando historial...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>Historial de búsquedas</h1>

      {hist.length === 0 ? (
        <p style={{ color: "#999" }}>No hay búsquedas en el historial</p>
      ) : (
        hist.map((h, i) => (
          <div key={i} style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9"
          }}>
            <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#2563eb" }}>{h.fecha}</p>
            <p>Tema: <strong>{h.query}</strong></p>
            <p>Resultados: {h.num_resultados}</p>
          </div>
        ))
      )}
    </div>
  );
}
