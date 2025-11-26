# backend.py - API REST para Agente Curador
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
import sys
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

# Verificación de API key
if 'GOOGLE_API_KEY' not in os.environ:
    print("Error: La variable de entorno 'GOOGLE_API_KEY' no está configurada.")
    sys.exit(1)

# ==================== MODELOS PYDANTIC ====================
class ArticuloRequest(BaseModel):
    titulo: str
    resumen: str
    etiquetas: List[str]
    url: Optional[str] = None

class BusquedaRequest(BaseModel):
    tema: str

class ResumenRequest(BaseModel):
    contenido: str

class Articulo(BaseModel):
    id: int
    fecha_guardado: str
    titulo: str
    resumen: str
    etiquetas: List[str]
    url: Optional[str] = None

class EstadisticasResponse(BaseModel):
    total_busquedas: int
    total_articulos_guardados: int
    etiquetas_unicas: int

# ==================== MEMORIA PERSISTENTE ====================
class MemoriaPersistente:
    def __init__(self, archivo="curator_memory.json"):
        self.archivo = archivo
        self.datos = self.cargar_memoria()
    
    def cargar_memoria(self):
        if os.path.exists(self.archivo):
            try:
                with open(self.archivo, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error al cargar memoria: {e}")
                return self.estructura_inicial()
        return self.estructura_inicial()
    
    def estructura_inicial(self):
        return {
            "historial_busquedas": [],
            "articulos_guardados": [],
            "etiquetas": [],
            "preferencias": {
                "temas_favoritos": [],
                "idioma_preferido": "español"
            },
            "estadisticas": {
                "total_busquedas": 0,
                "total_articulos_guardados": 0
            }
        }
    
    def guardar_memoria(self):
        try:
            with open(self.archivo, 'w', encoding='utf-8') as f:
                json.dump(self.datos, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error al guardar memoria: {e}")
            return False
    
    def agregar_busqueda(self, query, resultados):
        busqueda = {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "query": query,
            "num_resultados": resultados
        }
        self.datos["historial_busquedas"].append(busqueda)
        self.datos["estadisticas"]["total_busquedas"] += 1
        self.guardar_memoria()
    
    def guardar_articulo(self, titulo, resumen, etiquetas, url=None):
        articulo = {
            "id": len(self.datos["articulos_guardados"]) + 1,
            "fecha_guardado": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "titulo": titulo,
            "resumen": resumen,
            "etiquetas": etiquetas,
            "url": url
        }
        self.datos["articulos_guardados"].append(articulo)
        self.datos["estadisticas"]["total_articulos_guardados"] += 1
        
        for etiqueta in etiquetas:
            if etiqueta not in self.datos["etiquetas"]:
                self.datos["etiquetas"].append(etiqueta)
        
        self.guardar_memoria()
        return articulo["id"]
    
    def obtener_estadisticas(self):
        return self.datos["estadisticas"]
    
    def buscar_por_etiqueta(self, etiqueta):
        return [art for art in self.datos["articulos_guardados"] 
                if etiqueta.lower() in [e.lower() for e in art["etiquetas"]]]
    
    def obtener_articulos(self):
        return self.datos["articulos_guardados"]
    
    def obtener_historial(self, limite=10):
        return self.datos["historial_busquedas"][-limite:]
    
    def obtener_etiquetas(self):
        return self.datos["etiquetas"]
    
    def eliminar_articulo(self, id_articulo):
        """Elimina un artículo por ID"""
        self.datos["articulos_guardados"] = [
            art for art in self.datos["articulos_guardados"] 
            if art["id"] != id_articulo
        ]
        self.datos["estadisticas"]["total_articulos_guardados"] = len(self.datos["articulos_guardados"])
        self.guardar_memoria()
        return True
    
    def eliminar_busqueda(self, index):
        """Elimina una búsqueda por índice"""
        if 0 <= index < len(self.datos["historial_busquedas"]):
            self.datos["historial_busquedas"].pop(index)
            self.datos["estadisticas"]["total_busquedas"] = len(self.datos["historial_busquedas"])
            self.guardar_memoria()
            return True
        return False
    
    def limpiar_historial(self):
        """Limpia todo el historial"""
        self.datos["historial_busquedas"] = []
        self.datos["estadisticas"]["total_busquedas"] = 0
        self.guardar_memoria()
        return True

# ==================== HERRAMIENTA BUSCADOR ====================
class HerramientaBuscador:
    def __init__(self, llm):
        self.llm = llm
        self.prompt_busqueda = PromptTemplate(
            input_variables=["tema"],
            template="""Eres un experto curador de contenido técnico. 
            
Genera una lista de 5 artículos técnicos recomendados sobre: {tema}

Para cada artículo proporciona:
- Título sugerido
- Breve descripción (2-3 líneas)
- Conceptos clave
- Nivel de dificultad (Principiante/Intermedio/Avanzado)
- 2-3 etiquetas relevantes

Formato de respuesta:
ARTÍCULO 1:
Título: [título]
Descripción: [descripción]
Conceptos: [conceptos separados por comas]
Nivel: [nivel]
Etiquetas: [etiquetas separadas por comas]

[Repite para los 5 artículos]"""
        )
        
        self.prompt_resumen = PromptTemplate(
            input_variables=["contenido"],
            template="""Analiza el siguiente contenido técnico y genera un resumen estructurado:

CONTENIDO:
{contenido}

Proporciona:
1. Resumen ejecutivo (3-4 líneas)
2. Puntos clave (máximo 5 puntos)
3. Tecnologías mencionadas
4. Público objetivo
5. 3-5 etiquetas descriptivas

Formato estructurado y claro."""
        )
        
        self.chain_busqueda = LLMChain(llm=self.llm, prompt=self.prompt_busqueda)
        self.chain_resumen = LLMChain(llm=self.llm, prompt=self.prompt_resumen)
    
    def buscar_articulos(self, tema):
        try:
            respuesta = self.chain_busqueda.invoke({"tema": tema})
            return respuesta["text"]
        except Exception as e:
            raise Exception(f"Error en búsqueda: {str(e)}")
    
    def resumir_contenido(self, contenido):
        try:
            respuesta = self.chain_resumen.invoke({"contenido": contenido})
            return respuesta["text"]
        except Exception as e:
            raise Exception(f"Error al resumir: {str(e)}")

# ==================== INICIALIZACIÓN FASTAPI ====================
app = FastAPI(
    title="API Agente Curador de Artículos",
    description="Backend para gestionar y curar artículos técnicos",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar componentes
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
memoria = MemoriaPersistente()
buscador = HerramientaBuscador(llm)

# ==================== RUTAS ====================

@app.get("/", tags=["Info"])
def root():
    return {
        "mensaje": "Bienvenido a la API del Agente Curador",
        "version": "1.0.0",
        "documentacion": "/docs"
    }

@app.post("/buscar", tags=["Búsqueda"])
def buscar_articulos(request: BusquedaRequest):
    """Busca artículos recomendados sobre un tema"""
    try:
        resultados = buscador.buscar_articulos(request.tema)
        memoria.agregar_busqueda(request.tema, 5)
        
        return {
            "exito": True,
            "tema": request.tema,
            "resultados": resultados,
            "fecha": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resumir", tags=["Análisis"])
def resumir_contenido(request: ResumenRequest):
    """Genera un resumen estructurado de contenido técnico"""
    try:
        resumen = buscador.resumir_contenido(request.contenido)
        
        return {
            "exito": True,
            "resumen": resumen,
            "fecha": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/articulos", tags=["Artículos"])
def crear_articulo(articulo: ArticuloRequest):
    """Guarda un nuevo artículo"""
    try:
        id_articulo = memoria.guardar_articulo(
            articulo.titulo,
            articulo.resumen,
            articulo.etiquetas,
            articulo.url
        )
        
        return {
            "exito": True,
            "id": id_articulo,
            "mensaje": "Artículo guardado exitosamente",
            "fecha": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/articulos", tags=["Artículos"], response_model=List[Articulo])
def obtener_articulos():
    """Obtiene todos los artículos guardados"""
    return memoria.obtener_articulos()

@app.get("/articulos/etiqueta/{etiqueta}", tags=["Artículos"], response_model=List[Articulo])
def buscar_por_etiqueta(etiqueta: str):
    """Busca artículos por etiqueta"""
    resultados = memoria.buscar_por_etiqueta(etiqueta)
    
    if not resultados:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontraron artículos con la etiqueta '{etiqueta}'"
        )
    
    return resultados

@app.get("/etiquetas", tags=["Etiquetas"])
def obtener_etiquetas():
    """Obtiene todas las etiquetas disponibles"""
    return {
        "etiquetas": memoria.obtener_etiquetas(),
        "total": len(memoria.obtener_etiquetas())
    }

@app.get("/estadisticas", tags=["Estadísticas"], response_model=EstadisticasResponse)
def obtener_estadisticas():
    """Obtiene estadísticas de uso"""
    stats = memoria.obtener_estadisticas()
    etiquetas = memoria.obtener_etiquetas()
    
    return EstadisticasResponse(
        total_busquedas=stats["total_busquedas"],
        total_articulos_guardados=stats["total_articulos_guardados"],
        etiquetas_unicas=len(etiquetas)
    )

@app.get("/historial", tags=["Historial"])
def obtener_historial(limite: int = 10):
    """Obtiene el historial de búsquedas"""
    historial = memoria.obtener_historial(limite)
    
    return {
        "historial": historial,
        "total": len(historial)
    }

@app.get("/health", tags=["Sistema"])
def health_check():
    """Verifica el estado de la API"""
    return {
        "estado": "operativo",
        "timestamp": datetime.now().isoformat(),
        "articulos_guardados": len(memoria.obtener_articulos())
    }

@app.delete("/articulos/{articulo_id}", tags=["Artículos"])
def eliminar_articulo(articulo_id: int):
    """Elimina un artículo por ID"""
    try:
        exito = memoria.eliminar_articulo(articulo_id)
        if exito:
            return {
                "exito": True,
                "mensaje": "Artículo eliminado correctamente"
            }
        else:
            raise HTTPException(status_code=404, detail="Artículo no encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/historial/{index}", tags=["Historial"])
def eliminar_busqueda(index: int):
    """Elimina una búsqueda del historial por índice"""
    try:
        exito = memoria.eliminar_busqueda(index)
        if exito:
            return {
                "exito": True,
                "mensaje": "Búsqueda eliminada correctamente"
            }
        else:
            raise HTTPException(status_code=404, detail="Búsqueda no encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/historial", tags=["Historial"])
def limpiar_historial():
    """Limpia todo el historial de búsquedas"""
    try:
        memoria.limpiar_historial()
        return {
            "exito": True,
            "mensaje": "Historial limpiado correctamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)