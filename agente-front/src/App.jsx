import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Buscar from "./pages/Buscar";
import Resumir from "./pages/Resumir";
import Articulos from "./pages/Articulos";
import Estadisticas from "./pages/Estadisticas";
import Historial from "./pages/Historial";
import Etiquetas from "./pages/Etiquetas";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="p-6">
        <Routes>
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/resumir" element={<Resumir />} />
          <Route path="/articulos" element={<Articulos />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/etiquetas" element={<Etiquetas />} />
          <Route path="*" element={<Buscar />} />
        </Routes>
      </div>
    </>
  );
}
