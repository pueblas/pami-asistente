import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Tuple
import json
import re

def limpiar_texto(texto: str) -> str:
    """
    Limpia y normaliza el texto extraído del HTML
    """
    if not texto:
        return ""
    
    # Reemplazar múltiples espacios/tabs/newlines por un solo espacio
    texto = re.sub(r'\s+', ' ', texto)
    
    # Eliminar espacios antes de puntuación
    texto = re.sub(r'\s+([.,;:!?])', r'\1', texto)
    
    # Limpiar espacios al inicio y final
    texto = texto.strip()
    
    return texto

def extraer_texto_y_enlaces(elemento) -> Tuple[str, List[str]]:
    """
    Extrae texto y enlaces de un elemento BeautifulSoup
    Agrega espacios entre elementos inline para evitar palabras pegadas
    
    Returns:
        Tuple[str, List[str]]: (texto_limpio, lista_de_urls)
    """
    if not elemento:
        return "", []
    
    # Agregar espacios alrededor de ciertos tags antes de extraer texto
    for tag in elemento.find_all(['strong', 'b', 'span', 'a']):
        # Agregar espacio antes y después del contenido del tag
        if tag.string:
            tag.string.replace_with(f" {tag.string} ")
    
    # Extraer texto
    texto = limpiar_texto(elemento.get_text())
    
    # Extraer enlaces
    enlaces = []
    for a in elemento.find_all('a', href=True):
        href = a['href']
        # Convertir enlaces relativos a absolutos
        if href.startswith('/'):
            href = f"https://www.pami.org.ar{href}"
        enlaces.append(href)
    
    return texto, enlaces

def load_tramites_urls() -> List[str]:
    """Carga las URLs desde el archivo de configuración"""
    config_path = "/app/config/tramites_urls.json"
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            return config.get("tramites_urls", [])
    except FileNotFoundError:
        print(f"❌ Archivo de configuración no encontrado: {config_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {e}")
        return []

def extract_id_from_url(url: str) -> str:
    """Extrae el ID del trámite desde la URL"""
    # URL ejemplo: https://www.pami.org.ar/tramite/cambio-medico
    # ID: cambio-medico
    return url.rstrip('/').split('/')[-1]

def scrape_tramite(url: str) -> Optional[Dict]:
    """
    Scrapea un trámite individual desde su URL
    
    Returns:
        Dict con la estructura JSON del trámite o None si falla
    """
    try:
        print(f"🔍 Scrapeando: {url}")
        
        # Hacer request
        response = httpx.get(url, timeout=30.0, follow_redirects=True)
        response.raise_for_status()
        
        # Parsear HTML
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Extraer ID
        tramite_id = extract_id_from_url(url)
        
        # Extraer título (h2)
        titulo_tag = soup.find('h2')
        titulo = titulo_tag.get_text(strip=True) if titulo_tag else "Sin título"
        
        # Extraer descripción (primer <p> después del h2)
        descripcion = ""
        if titulo_tag:
            next_p = titulo_tag.find_next('p')
            if next_p:
                descripcion, _ = extraer_texto_y_enlaces(next_p)
        
        # Extraer secciones por h3
        h3_tags = soup.find_all('h3')
        
        # Inicializar estructura
        quien_puede_realizar = {"texto": "", "enlaces": []}
        documentacion_necesaria = {"items": [], "enlaces": []}
        donde_realizar = {"texto": "", "enlaces": []}
        
        for h3 in h3_tags:
            seccion = h3.get_text(strip=True).upper()
            
            if "QUIÉN PUEDE REALIZAR" in seccion:
                next_p = h3.find_next('p')
                if next_p:
                    texto, enlaces = extraer_texto_y_enlaces(next_p)
                    quien_puede_realizar["texto"] = texto
                    quien_puede_realizar["enlaces"] = enlaces
            
            elif "QUÉ DOCUMENTACIÓN" in seccion or "DOCUMENTACIÓN SE NECESITA" in seccion:
                next_ul = h3.find_next('ul')
                if next_ul:
                    items = next_ul.find_all('li')
                    for item in items:
                        texto, item_enlaces = extraer_texto_y_enlaces(item)
                        if texto:
                            documentacion_necesaria["items"].append(texto)
                            # Agregar enlaces de este item (si los hay)
                            documentacion_necesaria["enlaces"].extend(item_enlaces)
            
            elif "DÓNDE PUEDO REALIZAR" in seccion or "DÓNDE REALIZAR" in seccion:
                # Buscar el siguiente H5 que marca el fin de la sección
                h5_fin = None
                current = h3.find_next()
                while current:
                    if current.name == 'h5':
                        h5_fin = current
                        break
                    current = current.find_next()
                
                # Extraer todos los <p> entre el H3 y el H5
                textos = []
                todos_enlaces = []
                current = h3.find_next()
                
                while current and current != h5_fin:
                    if current.name == 'p':
                        texto, enlaces = extraer_texto_y_enlaces(current)
                        if texto and texto not in ['', '\xa0', ' ']:
                            textos.append(texto)
                            todos_enlaces.extend(enlaces)
                    current = current.find_next()
                
                donde_realizar["texto"] = " ".join(textos)
                donde_realizar["enlaces"] = todos_enlaces
        
        # Construir estructura JSON
        tramite = {
            "id": tramite_id,
            "titulo": titulo,
            "descripcion": descripcion,
            "quien_puede_realizar": quien_puede_realizar,
            "documentacion_necesaria": documentacion_necesaria,
            "donde_realizar": donde_realizar,
            "url_oficial": url,
            "metadata": {
                "keywords": []  # Se generarán después con Ollama
            }
        }
        
        print(f"✅ Trámite scrapeado: {tramite_id}")
        return tramite
        
    except httpx.HTTPError as e:
        print(f"❌ Error HTTP scrapeando {url}: {e}")
        return None
    except Exception as e:
        print(f"❌ Error inesperado scrapeando {url}: {e}")
        import traceback
        traceback.print_exc()
        return None

def scrape_all_tramites() -> List[Dict]:
    """
    Scrapea todos los trámites desde el archivo de configuración
    
    Returns:
        Lista de trámites (sin keywords aún)
    """
    urls = load_tramites_urls()
    
    if not urls:
        print("⚠️ No hay URLs para scrapear")
        return []
    
    print(f"📋 Se van a scrapear {len(urls)} trámites")
    
    tramites = []
    for url in urls:
        tramite = scrape_tramite(url)
        if tramite:
            tramites.append(tramite)
    
    print(f"\n✅ Scraping completado: {len(tramites)}/{len(urls)} exitosos")
    return tramites

async def generar_keywords_con_ollama(tramite: Dict) -> List[str]:
    """
    Genera keywords para un trámite usando Ollama
    
    Args:
        tramite: Dict con la estructura del trámite
    
    Returns:
        Lista de 5-7 keywords relevantes
    """
    try:
        # Construir prompt para Ollama
        prompt = f"""Dado el siguiente trámite de PAMI, generá entre 5 y 7 palabras clave (keywords) relevantes que ayuden a identificar y buscar este trámite. Las palabras deben ser simples, en español, y representar los conceptos más importantes.

Título: {tramite['titulo']}
Descripción: {tramite['descripcion']}

Respondé ÚNICAMENTE con las palabras separadas por comas, sin numeración ni explicaciones adicionales.
Ejemplo de respuesta válida: medico, cabecera, cambio, asignacion, afiliado"""

        # Llamar a Ollama
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://nodo-ia:11434/api/generate",
                json={
                    "model": "llama3.2:3b",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                print(f"⚠️ Error en Ollama para {tramite['id']}: {response.status_code}")
                return []
            
            resultado = response.json()
            respuesta = resultado.get("response", "").strip()
            
            # Parsear la respuesta (viene como: "palabra1, palabra2, palabra3")
            keywords = [k.strip().lower() for k in respuesta.split(',') if k.strip()]
            
            # Limitar a máximo 7 keywords
            keywords = keywords[:7]
            
            print(f"✅ Keywords generadas para {tramite['id']}: {keywords}")
            return keywords
            
    except Exception as e:
        print(f"❌ Error generando keywords para {tramite['id']}: {e}")
        return []


async def scrape_and_generate_keywords() -> List[Dict]:
    """
    Función principal: scrapea todos los trámites y genera sus keywords
    
    Returns:
        Lista de trámites completos (con keywords)
    """
    # Primero scrapear todo
    tramites = scrape_all_tramites()
    
    if not tramites:
        return []
    
    print(f"\n🤖 Generando keywords con Ollama para {len(tramites)} trámites...")
    
    # Generar keywords para cada trámite
    for tramite in tramites:
        keywords = await generar_keywords_con_ollama(tramite)
        tramite["metadata"]["keywords"] = keywords
    
    print(f"\n✅ Proceso completo: {len(tramites)} trámites con keywords generadas")
    return tramites