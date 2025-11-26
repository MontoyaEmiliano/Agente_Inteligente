import { useState } from "react";
import api from "../api/api";

export default function Resumir() {
  const [texto, setTexto] = useState("");
  const [resumen, setResumen] = useState("");
  const [cargando, setCargando] = useState(false);
  const [etiquetas, setEtiquetas] = useState("");

  const enviar = async () => {
    if (!texto.trim()) {
      alert("Por favor pega contenido");
      return;
    }

    setCargando(true);
    try {
      const res = await api.post("/resumir", { contenido: texto });
      setResumen(res.data.resumen);
      
      // Extraer etiquetas del resumen
      const etiquetasMatch = res.data.resumen.match(/etiquetas?[:\s]+(.+)/i);
      if (etiquetasMatch) {
        setEtiquetas(etiquetasMatch[1]);
      }
    } catch (error) {
      alert("Error al resumir: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const guardarResumen = async () => {
    if (!resumen.trim()) {
      alert("No hay resumen para guardar");
      return;
    }

    try {
      const etiquetasArray = etiquetas
        .split(",")
        .map(e => e.trim())
        .filter(e => e.length > 0);

      await api.post("/articulos", {
        titulo: "Resumen: " + texto.substring(0, 50) + "...",
        resumen: resumen,
        etiquetas: etiquetasArray.length > 0 ? etiquetasArray : ["resumen"]
      });
      
      alert("Resumen guardado correctamente");
      setTexto("");
      setResumen("");
      setEtiquetas("");
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>Resumir contenido</h1>

      <textarea
        style={{
          border: "1px solid #ddd",
          padding: "12px",
          width: "100%",
          height: "160px",
          fontSize: "16px",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif"
        }}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Pega tu contenido aquí…"
      />

      <button
        onClick={enviar}
        disabled={cargando}
        style={{
          backgroundColor: cargando ? "#999" : "#16a34a",
          color: "white",
          padding: "10px 20px",
          marginTop: "15px",
          border: "none",
          cursor: cargando ? "not-allowed" : "pointer",
          borderRadius: "4px",
          fontSize: "16px"
        }}
      >
        {cargando ? "Resumiendo..." : "Resumir"}
      </button>

      {resumen && (
        <div style={{ marginTop: "30px" }}>
          <pre style={{
            backgroundColor: "#f3f4f6",
            padding: "20px",
            whiteSpace: "pre-wrap",
            borderRadius: "4px",
            fontFamily: "monospace"
          }}>
            {resumen}
          </pre>

          <textarea
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              width: "100%",
              height: "80px",
              marginTop: "15px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
            placeholder="Etiquetas (separadas por comas)"
            value={etiquetas}
            onChange={(e) => setEtiquetas(e.target.value)}
          />

          <button
            onClick={guardarResumen}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "10px 20px",
              marginTop: "15px",
              border: "none",
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            Guardar resumen
          </button>
        </div>
      )}
    </div>
  );
}
