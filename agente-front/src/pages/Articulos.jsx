import { useEffect, useState } from "react";
import api from "../api/api";

export default function Articulos() {
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    cargarArticulos();
  }, []);

  const cargarArticulos = async () => {
    try {
      const res = await api.get("/articulos");
      setData(res.data);
    } catch (error) {
      console.error("Error al cargar artículos:", error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <div style={{ padding: "20px" }}>Cargando artículos...</div>;

  const eliminarArticulo = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este artículo?")) {
      try {
        await api.delete(`/articulos/${id}`);
        alert("Artículo eliminado correctamente");
        setSeleccionado(null);
        cargarArticulos();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

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
            onClick={() => eliminarArticulo(seleccionado.id)}
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
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>Artículos guardados ({data.length})</h1>

      {data.length === 0 ? (
        <p style={{ color: "#999" }}>No hay artículos guardados aún</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px"
        }}>
          {data.map((a) => (
            <div key={a.id} style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
            >
              <h2 
                style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "8px", color: "#2563eb" }}
                onClick={() => setSeleccionado(a)}
              >
                {a.titulo}
              </h2>
              <p style={{ fontSize: "12px", color: "#999", marginBottom: "10px" }}>{a.fecha_guardado}</p>
              <p style={{ marginTop: "10px", lineHeight: "1.5", color: "#666", maxHeight: "80px", overflow: "hidden" }}>
                {a.resumen}
              </p>

              <p style={{ marginTop: "10px", color: "#2563eb", fontSize: "14px" }}>
                Etiquetas: {a.etiquetas.join(", ")}
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
                  marginTop: "10px",
                  fontSize: "14px"
                }}
              >
                Ver completo
              </button>

              {a.url && (
                <a
                  href={a.url}
                  style={{
                    color: "#4f46e5",
                    textDecoration: "underline",
                    marginLeft: "10px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver original
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}