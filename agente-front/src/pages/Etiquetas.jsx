import { useEffect, useState } from "react";
import api from "../api/api";

export default function Etiquetas() {
  const [tags, setTags] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [seleccion, setSeleccion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    api.get("/etiquetas").then((res) => {
      setTags(res.data.etiquetas);
      setCargando(false);
    }).catch(error => {
      console.error("Error:", error);
      setCargando(false);
    });
  }, []);

  const buscar = async (etiqueta) => {
    setSeleccion(etiqueta);
    setSeleccionado(null);
    try {
      const res = await api.get(`/articulos/etiqueta/${etiqueta}`);
      setResultados(res.data);
    } catch (error) {
      setResultados([]);
    }
  };

  if (cargando) return <div style={{ padding: "20px" }}>Cargando etiquetas...</div>;

  // Vista detallada del artículo
  if (seleccionado) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setSeleccionado(null)}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          >
            ← Volver
          </button>
          <button
            onClick={() => {
              if (window.confirm("¿Estás seguro de que deseas eliminar este artículo?")) {
                try {
                  api.delete(`/articulos/${seleccionado.id}`).then(() => {
                    alert("Artículo eliminado correctamente");
                    setSeleccionado(null);
                    buscar(seleccion);
                  });
                } catch (error) {
                  alert("Error al eliminar: " + error.message);
                }
              }
            }}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          >
            🗑️ Eliminar
          </button>
        </div>

        <div style={{
          border: "1px solid #ddd",
          padding: "30px",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9"
        }}>
          <h1 style={{ fontSize: "28px", marginBottom: "15px", fontWeight: "bold" }}>
            {seleccionado.titulo}
          </h1>

          <p style={{ fontSize: "12px", color: "#999", marginBottom: "20px" }}>
            Guardado: {seleccionado.fecha_guardado}
          </p>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "4px",
            marginBottom: "20px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word"
          }}>
            {seleccionado.resumen}
          </div>

          <p style={{ marginBottom: "15px", fontSize: "14px" }}>
            <strong>Etiquetas:</strong>
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
            {seleccionado.etiquetas.map((tag, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px"
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {seleccionado.url && (
            <a
              href={seleccionado.url}
              style={{
                backgroundColor: "#4f46e5",
                color: "white",
                padding: "10px 20px",
                borderRadius: "4px",
                textDecoration: "none",
                display: "inline-block",
                cursor: "pointer"
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ir al artículo original
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>Buscar por etiqueta</h1>

      {tags.length === 0 ? (
        <p style={{ color: "#999" }}>No hay etiquetas disponibles</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => buscar(t)}
                style={{
                  border: seleccion === t ? "2px solid #2563eb" : "1px solid #ddd",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  backgroundColor: seleccion === t ? "#2563eb" : "#f3f4f6",
                  color: seleccion === t ? "white" : "black",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s"
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {seleccion && (
            <>
              <h2 style={{ fontSize: "20px", marginTop: "20px", marginBottom: "15px" }}>
                Resultados para: <strong>{seleccion}</strong> ({resultados.length})
              </h2>

              {resultados.length === 0 ? (
                <p style={{ color: "#999" }}>No hay artículos con esta etiqueta</p>
              ) : (
                <div style={{ display: "grid", gap: "15px" }}>
                  {resultados.map((a) => (
                    <div key={a.id} style={{
                      border: "1px solid #ddd",
                      padding: "20px",
                      borderRadius: "4px",
                      backgroundColor: "#f9f9f9",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    >
                      <h3 
                        style={{ fontWeight: "bold", marginBottom: "8px", color: "#2563eb", cursor: "pointer" }}
                        onClick={() => setSeleccionado(a)}
                      >
                        {a.titulo}
                      </h3>
                      <p style={{ color: "#666", marginBottom: "10px", maxHeight: "60px", overflow: "hidden" }}>
                        {a.resumen}
                      </p>
                      <button
                        onClick={() => setSeleccionado(a)}
                        style={{
                          backgroundColor: "#2563eb",
                          color: "white",
                          padding: "8px 16px",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        Ver completo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}