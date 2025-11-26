import { Link } from "react-router-dom";

export default function Navbar() {
  const navStyle = {
    backgroundColor: "#111827",
    color: "white",
    padding: "1rem 1.5rem",
    display: "flex",
    gap: "1.5rem",
    borderBottom: "1px solid #333"
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    padding: "0.5rem 0",
    transition: "color 0.3s",
  };

  return (
    <nav style={navStyle}>
      <Link to="/buscar" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#60a5fa"} onMouseLeave={(e) => e.target.style.color = "white"}>Buscar</Link>
      <Link to="/resumir" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#60a5fa"} onMouseLeave={(e) => e.target.style.color = "white"}>Resumir</Link>
      <Link to="/articulos" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#60a5fa"} onMouseLeave={(e) => e.target.style.color = "white"}>Artículos</Link>
      <Link to="/estadisticas" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#60a5fa"} onMouseLeave={(e) => e.target.style.color = "white"}>Estadísticas</Link>
      <Link to="/historial" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#60a5fa"} onMouseLeave={(e) => e.target.style.color = "white"}>Historial</Link>
      <Link to="/etiquetas" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#60a5fa"} onMouseLeave={(e) => e.target.style.color = "white"}>Etiquetas</Link>
    </nav>
  );
}