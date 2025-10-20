# Agente Curador de Artículos Técnicos con Memoria Persistente
import os
import json
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv

# Carga variables de entorno
load_dotenv()

# Verificación de API key
if 'GOOGLE_API_KEY' not in os.environ:
    print("Error: La variable de entorno 'GOOGLE_API_KEY' no está configurada.")
    exit()

class MemoriaPersistente:
    """Herramienta de memoria persistente en JSON"""
    
    def __init__(self, archivo="curator_memory.json"):
        self.archivo = archivo
        self.datos = self.cargar_memoria()
    
    def cargar_memoria(self):
        """Carga la memoria desde archivo JSON"""
        if os.path.exists(self.archivo):
            try:
                with open(self.archivo, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error al cargar memoria: {e}")
                return self.estructura_inicial()
        return self.estructura_inicial()
    
    def estructura_inicial(self):
        """Estructura inicial de la memoria"""
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
        """Guarda la memoria en archivo JSON"""
        try:
            with open(self.archivo, 'w', encoding='utf-8') as f:
                json.dump(self.datos, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error al guardar memoria: {e}")
            return False
    
    def agregar_busqueda(self, query, resultados):
        """Registra una búsqueda en el historial"""
        busqueda = {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "query": query,
            "num_resultados": resultados
        }
        self.datos["historial_busquedas"].append(busqueda)
        self.datos["estadisticas"]["total_busquedas"] += 1
        self.guardar_memoria()
    
    def guardar_articulo(self, titulo, resumen, etiquetas, url=None):
        """Guarda un artículo en la colección"""
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
        
        # Actualizar lista de etiquetas únicas
        for etiqueta in etiquetas:
            if etiqueta not in self.datos["etiquetas"]:
                self.datos["etiquetas"].append(etiqueta)
        
        self.guardar_memoria()
        return articulo["id"]
    
    def obtener_estadisticas(self):
        """Retorna estadísticas de uso"""
        return self.datos["estadisticas"]
    
    def buscar_por_etiqueta(self, etiqueta):
        """Busca artículos por etiqueta"""
        return [art for art in self.datos["articulos_guardados"] 
                if etiqueta.lower() in [e.lower() for e in art["etiquetas"]]]

class HerramientaBuscador:
    """Herramienta de búsqueda y análisis de contenido técnico"""
    
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
        """Busca artículos sobre un tema"""
        try:
            respuesta = self.chain_busqueda.invoke({"tema": tema})
            return respuesta["text"]
        except Exception as e:
            return f"Error en búsqueda: {str(e)}"
    
    def resumir_contenido(self, contenido):
        """Genera resumen de contenido"""
        try:
            respuesta = self.chain_resumen.invoke({"contenido": contenido})
            return respuesta["text"]
        except Exception as e:
            return f"Error al resumir: {str(e)}"

class HerramientaExportador:
    """Herramienta para exportar colecciones en diferentes formatos"""
    
    @staticmethod
    def exportar_markdown(articulos, nombre_archivo="coleccion_articulos.md"):
        """Exporta artículos a formato Markdown"""
        try:
            with open(nombre_archivo, 'w', encoding='utf-8') as f:
                f.write("# Mi Colección de Artículos Técnicos\n\n")
                f.write(f"*Generado el {datetime.now().strftime('%Y-%m-%d')}*\n\n")
                f.write("---\n\n")
                
                for art in articulos:
                    f.write(f"## {art['titulo']}\n\n")
                    f.write(f"**ID:** {art['id']} | **Guardado:** {art['fecha_guardado']}\n\n")
                    if art.get('url'):
                        f.write(f"**URL:** {art['url']}\n\n")
                    f.write(f"### Resumen\n\n{art['resumen']}\n\n")
                    f.write(f"**Etiquetas:** {', '.join(art['etiquetas'])}\n\n")
                    f.write("---\n\n")
            
            return True, nombre_archivo
        except Exception as e:
            return False, str(e)

class AgenteCurador:
    """Agente principal que integra todas las herramientas"""
    
    def __init__(self):
        # Inicialización del modelo LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7
        )
        
        # Inicialización de herramientas
        self.memoria = MemoriaPersistente()
        self.buscador = HerramientaBuscador(self.llm)
        self.exportador = HerramientaExportador()
        
        # Memoria conversacional
        self.memoria_conversacion = ConversationBufferMemory()
    
    def mostrar_menu(self):
        """Muestra el menú principal"""
        print("\n" + "="*60)
        print("AGENTE CURADOR DE ARTÍCULOS TÉCNICOS")
        print("="*60)
        print("1. Buscar artículos sobre un tema")
        print("2. Resumir contenido técnico")
        print("3. Guardar artículo manualmente")
        print("4. Ver artículos guardados")
        print("5. Buscar por etiqueta")
        print("6. Exportar colección a Markdown")
        print("7. Ver estadísticas")
        print("8. Ver historial de búsquedas")
        print("9. Salir")
        print("="*60)
    
    def buscar_y_sugerir(self):
        """Opción 1: Buscar artículos"""
        tema = input("\n Ingresa el tema de búsqueda: ")
        print("\n Buscando artículos recomendados...\n")
        
        resultados = self.buscador.buscar_articulos(tema)
        print(resultados)
        
        self.memoria.agregar_busqueda(tema, 5)
        
        guardar = input("\n¿Deseas guardar algún artículo? (s/n): ")
        if guardar.lower() == 's':
            self.guardar_articulo_interactivo()
    
    def resumir_contenido(self):
        """Opción 2: Resumir contenido"""
        print("\n Pega el contenido a resumir (finaliza con una línea vacía):")
        lineas = []
        while True:
            linea = input()
            if linea == "":
                break
            lineas.append(linea)
        
        contenido = "\n".join(lineas)
        
        if contenido.strip():
            print("\n Generando resumen...\n")
            resumen = self.buscador.resumir_contenido(contenido)
            print(resumen)
        else:
            print(" No se ingresó contenido.")
    
    def guardar_articulo_interactivo(self):
        """Opción 3: Guardar artículo manualmente"""
        print("\n Guardar nuevo artículo")
        titulo = input("Título: ")
        resumen = input("Resumen: ")
        etiquetas_str = input("Etiquetas (separadas por comas): ")
        etiquetas = [e.strip() for e in etiquetas_str.split(",")]
        url = input("URL (opcional, presiona Enter para omitir): ")
        
        url = url if url.strip() else None
        
        id_articulo = self.memoria.guardar_articulo(titulo, resumen, etiquetas, url)
        print(f" Artículo guardado con ID: {id_articulo}")
    
    def ver_articulos_guardados(self):
        """Opción 4: Ver artículos guardados"""
        articulos = self.memoria.datos["articulos_guardados"]
        
        if not articulos:
            print("\n No hay artículos guardados.")
            return
        
        print(f"\n Artículos guardados ({len(articulos)}):\n")
        for art in articulos:
            print(f"ID: {art['id']} | {art['titulo']}")
            print(f"   Etiquetas: {', '.join(art['etiquetas'])}")
            print(f"   Guardado: {art['fecha_guardado']}")
            print()
    
    def buscar_por_etiqueta(self):
        """Opción 5: Buscar por etiqueta"""
        etiquetas_disponibles = self.memoria.datos["etiquetas"]
        
        if not etiquetas_disponibles:
            print("\n No hay etiquetas disponibles.")
            return
        
        print(f"\n Etiquetas disponibles: {', '.join(etiquetas_disponibles)}")
        etiqueta = input("Buscar por etiqueta: ")
        
        resultados = self.memoria.buscar_por_etiqueta(etiqueta)
        
        if resultados:
            print(f"\n {len(resultados)} artículo(s) encontrado(s):\n")
            for art in resultados:
                print(f"• {art['titulo']}")
                print(f"  {art['resumen'][:100]}...")
                print()
        else:
            print(f"\n No se encontraron artículos con la etiqueta '{etiqueta}'")
    
    def exportar_coleccion(self):
        """Opción 6: Exportar a Markdown"""
        articulos = self.memoria.datos["articulos_guardados"]
        
        if not articulos:
            print("\n No hay artículos para exportar.")
            return
        
        exito, resultado = self.exportador.exportar_markdown(articulos)
        
        if exito:
            print(f"\n Colección exportada exitosamente a: {resultado}")
        else:
            print(f"\n Error al exportar: {resultado}")
    
    def ver_estadisticas(self):
        """Opción 7: Ver estadísticas"""
        stats = self.memoria.obtener_estadisticas()
        etiquetas = self.memoria.datos["etiquetas"]
        
        print("\n ESTADÍSTICAS DEL CURADOR")
        print("="*40)
        print(f"Total de búsquedas: {stats['total_busquedas']}")
        print(f"Artículos guardados: {stats['total_articulos_guardados']}")
        print(f"Etiquetas únicas: {len(etiquetas)}")
        if etiquetas:
            print(f"Etiquetas: {', '.join(etiquetas[:10])}")
    
    def ver_historial(self):
        """Opción 8: Ver historial de búsquedas"""
        historial = self.memoria.datos["historial_busquedas"]
        
        if not historial:
            print("\n No hay historial de búsquedas.")
            return
        
        print(f"\n HISTORIAL DE BÚSQUEDAS (últimas 10):\n")
        for busqueda in historial[-10:]:
            print(f"• {busqueda['fecha']} - '{busqueda['query']}' ({busqueda['num_resultados']} resultados)")
    
    def ejecutar(self):
        """Bucle principal del agente"""
        print("\n Agente Curador iniciado correctamente.")
        print(f" Memoria cargada: {len(self.memoria.datos['articulos_guardados'])} artículos")
        
        while True:
            self.mostrar_menu()
            opcion = input("\nSelecciona una opción (1-9): ")
            
            if opcion == "1":
                self.buscar_y_sugerir()
            elif opcion == "2":
                self.resumir_contenido()
            elif opcion == "3":
                self.guardar_articulo_interactivo()
            elif opcion == "4":
                self.ver_articulos_guardados()
            elif opcion == "5":
                self.buscar_por_etiqueta()
            elif opcion == "6":
                self.exportar_coleccion()
            elif opcion == "7":
                self.ver_estadisticas()
            elif opcion == "8":
                self.ver_historial()
            elif opcion == "9":
                print("\n ¡Hasta luego! Memoria guardada exitosamente.")
                break
            else:
                print("\n Opción no válida. Intenta de nuevo.")

if __name__ == "__main__":
    agente = AgenteCurador()
    agente.ejecutar()