import { useState } from "react";
import api from "../api/api";

export default function Buscar() {
  const [tema, setTema] = useState("");
  const [resultado, setResultado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [articulos, setArticulos] = useState([]);

  const buscar = async () => {
    if (!tema.trim()) {
      alert("Por favor ingresa un tema");
      return;
    }
    
    setCargando(true);
    try {
      const res = await api.post("/buscar", { tema });
      setResultado(res.data.resultados);
      
      // Parsear artículos del resultado
      const arts = parsearArticulos(res.data.resultados);
      setArticulos(arts);
    } catch (error) {
      alert("Error en la búsqueda: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const parsearArticulos = (texto) => {
    const articulos = [];
    const matches = texto.split("ARTÍCULO").slice(1);
    
    const nivelOrden = { "Principiante": 1, "Intermedio": 2, "Avanzado": 3 };
    
    const articulosParsados = matches.map((match, index) => {
      const titulo = match.match(/Título:\s*(.+)/)?.[1] || "Sin título";
      const descripcionMatch = match.match(/Descripción:\s*([\s\S]+?)(?=Conceptos:|Nivel:|$)/);
      const descripcion = descripcionMatch?.[1] || "Sin descripción";
      const conceptos = match.match(/Conceptos:\s*(.+)/)?.[1] || "";
      const nivel = match.match(/Nivel:\s*(.+)/)?.[1]?.trim() || "Intermedio";
      const etiquetas = match.match(/Etiquetas:\s*(.+)/)?.[1]?.split(",").map(e => e.trim()) || [];
      
      return {
        id: index,
        titulo: titulo.trim(),
        resumen: descripcion.trim(),
        conceptos: conceptos.trim(),
        nivel: nivel,
        etiquetas: etiquetas,
        textoCompleto: match
      };
    });
    
    // Ordenar por nivel de dificultad
    return articulosParsados.sort((a, b) => {
      return (nivelOrden[a.nivel] || 2) - (nivelOrden[b.nivel] || 2);
    });
  };

  const guardarArticulo = async (art) => {
    const etiquetasAdicionales = prompt(
      "Etiquetas adicionales (separadas por comas):\n\nYa tiene: " + art.etiquetas.join(", ")
    );
    
    if (etiquetasAdicionales === null) return; // Cancelar
    
    const etiquetasFinales = [
      ...art.etiquetas,
      ...etiquetasAdicionales
        .split(",")
        .map(e => e.trim())
        .filter(e => e.length > 0)
    ];

    try {
      await api.post("/articulos", {
        titulo: art.titulo,
        resumen: art.resumen,
        etiquetas: etiquetasFinales.length > 0 ? etiquetasFinales : art.etiquetas
      });
      alert("Artículo guardado correctamente");
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>Buscar artículos</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            flex: 1,
            fontSize: "16px",
            boxSizing: "border-box"
          }}
          placeholder="Ingresa un tema"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && buscar()}
        />
        <button
          onClick={buscar}
          disabled={cargando}
          style={{
            backgroundColor: cargando ? "#999" : "#2563eb",
            color: "white",
            padding: "10px 20px",
            border: "none",
            cursor: cargando ? "not-allowed" : "pointer",
            borderRadius: "4px",
            fontSize: "16px"
          }}
        >
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {articulos.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "15px", fontWeight: "bold" }}>Artículos encontrados ({articulos.length}):</h2>
          <div style={{ display: "grid", gap: "15px" }}>
            {articulos.map((art) => (
              <div key={art.id} style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <h3 style={{ fontWeight: "bold", margin: 0, flex: 1 }}>{art.titulo}</h3>
                  <span style={{
                    backgroundColor: art.nivel === "Avanzado" ? "#dc2626" : art.nivel === "Intermedio" ? "#ea580c" : "#16a34a",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    marginLeft: "10px"
                  }}>
                    {art.nivel}
                  </span>
                </div>
                <p style={{ marginBottom: "10px", color: "#666", fontSize: "14px", maxHeight: "60px", overflow: "hidden" }}>
                  {art.resumen}
                </p>
                {art.conceptos && (
                  <p style={{ marginBottom: "10px", color: "#999", fontSize: "12px" }}>
                    <strong>Conceptos:</strong> {art.conceptos}
                  </p>
                )}
                <p style={{ marginBottom: "10px", color: "#2563eb", fontSize: "13px" }}>
                  {art.etiquetas.join(" · ")}
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => guardarArticulo(art)}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontSize: "13px"
                    }}
                  >
                    Guardar artículo
                  </button>
                  <button
                    onClick={() => {
                      // Expandir vista completa
                      setResultado(art.textoCompleto);
                    }}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontSize: "13px"
                    }}
                  >
                    Ver más
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resultado && !articulos.length && (
        <pre style={{
          marginTop: "20px",
          backgroundColor: "#f3f4f6",
          padding: "20px",
          whiteSpace: "pre-wrap",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "12px"
        }}>
          {resultado}
        </pre>
      )}
    </div>
  );
}