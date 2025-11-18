import httpx
from typing import Optional, Dict, List
from utils.vector_store import search_tramites

OLLAMA_URL = "http://nodo-ia:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"

def formatear_tramite_como_texto(tramite: Dict) -> str:
    """
    Convierte un trámite (JSON) a texto estructurado y legible para el LLM
    
    Args:
        tramite: Diccionario con la estructura JSON del trámite
    
    Returns:
        str: Texto formateado con toda la información del trámite
    """
    texto = f"""TRÁMITE: {tramite['titulo']}

DESCRIPCIÓN:
{tramite['descripcion']}

¿QUIÉN PUEDE REALIZAR EL TRÁMITE?
{tramite['quien_puede_realizar']['texto']}"""
    
    if tramite['quien_puede_realizar']['enlaces']:
        texto += f"\nEnlaces útiles: {', '.join(tramite['quien_puede_realizar']['enlaces'])}"
    
    if tramite['documentacion_necesaria']['items']:
        texto += "\n\nDOCUMENTACIÓN NECESARIA:"
        for item in tramite['documentacion_necesaria']['items']:
            texto += f"\n- {item}"
        
        if tramite['documentacion_necesaria']['enlaces']:
            texto += f"\nEnlaces útiles: {', '.join(tramite['documentacion_necesaria']['enlaces'])}"
    
    texto += f"\n\n¿DÓNDE REALIZAR ESTE TRÁMITE?\n{tramite['donde_realizar']['texto']}"
    
    if tramite['donde_realizar']['enlaces']:
        texto += f"\nEnlaces útiles: {', '.join(tramite['donde_realizar']['enlaces'])}"
    
    texto += f"\n\nURL OFICIAL: {tramite['url_oficial']}"
    
    return texto

def construir_prompt_con_contexto(
    consulta: str, 
    contexto: str, 
    nombre_usuario: str,
    historial: str = ""
) -> str:
    system_prompt = f"""Eres un asistente de trámites de PAMI. El usuario es {nombre_usuario}.

El usuario se llama {nombre_usuario}. Dirigite a él/ella por su nombre cuando sea apropiado.

REGLAS ABSOLUTAS:
1. NUNCA inventes información que no esté en el CONTEXTO
2. USA EXACTAMENTE el título del trámite que aparece en el CONTEXTO
3. COPIA la información tal cual aparece en el CONTEXTO
4. NO agregues pasos o instrucciones que no estén explícitos
5. Si algo no está en el CONTEXTO, NO lo menciones

FORMATO OBLIGATORIO:

**[TITULO EXACTO DEL TRÁMITE]**

[Descripción tal cual aparece en contexto]

**👤 ¿Quién puede realizarlo?**

[Texto literal del contexto]

**📋 Documentación necesaria:**

- [Documento 1]
- [Documento 2]
- [Etc.]

**💻 ¿Dónde realizarlo?**

[Texto literal del contexto]

**🔗 Enlaces:**

[Enlaces del contexto en formato markdown]

IMPORTANTE:
- Usá markdown: **negrita**, listas con -
- Separaciones con líneas vacías
- NO cambies el título
- NO inventes pasos
- SOLO información del CONTEXTO

CONTEXTO:
{contexto}"""

    if historial:
        system_prompt += f"\n\nHistorial:\n{historial}"
    
    system_prompt += f"\n\nUsuario: {consulta}\n\nAsistente:"

    return system_prompt

async def llamar_ollama(prompt: str) -> str:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=1000.0
            )
            
            if response.status_code != 200:
                return "Error al comunicarse con el asistente de IA. Por favor, intentá nuevamente."
            
            resultado = response.json()
            respuesta = resultado.get("response", "")
            
            return respuesta
            
    except httpx.TimeoutException:
        return "El asistente está tardando mucho en responder. Por favor, intentá nuevamente."
    except Exception as e:
        print(f"❌ Error en llamar_ollama: {e}")
        return "Ocurrió un error al procesar tu consulta. Por favor, intentá nuevamente."

async def generar_respuesta_con_rag(
    consulta: str, 
    nombre_usuario: str,
    historial: str = ""
) -> str:
    """
    Función principal del RAG: busca contexto relevante y genera respuesta
    
    Args:
        consulta: Pregunta del usuario
        nombre_usuario: Nombre del usuario para personalizar
        historial: Historial de conversación previo (opcional)
    
    Returns:
        str: Respuesta generada con contexto o mensaje de no disponibilidad
    """
    tramites = search_tramites(consulta, n_results=3)

    # Filtrar solo trámites activos
    tramites_activos = [t for t in tramites if t.get('activo', True)]

    if not tramites_activos:
        return f"¡Hola, {nombre_usuario}! No encontré un resultado exacto para tu búsqueda. A veces, funciona mejor si usas el **nombre completo del trámite** (ej: en lugar de 'conyuge', prueba con 'Asignación Familiar por Cónyuge'). ¿Podrías intentar con un término más específico? Si aún así no lo encuentras, te sugiero contactar directamente a PAMI al **138** o visitar https://www.pami.org.ar para más información."

    tramite = tramites_activos[0]
    
    tramite = tramites[0]
    contexto = formatear_tramite_como_texto(tramite)
    
    prompt = construir_prompt_con_contexto(consulta, contexto, nombre_usuario, historial)
    
    respuesta = await llamar_ollama(prompt)
    
    return respuesta