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
    system_prompt = f"""Eres un asistente especializado en trámites de PAMI (Programa de Atención Médica Integral).

El usuario se llama {nombre_usuario}. Dirigite a él/ella por su nombre cuando sea apropiado.

REGLAS ESTRICTAS Y PRIORITARIAS:
1. Tu respuesta debe basarse EXCLUSIVAMENTE en el CONTEXTO DEL TRÁMITE ACTUAL que se muestra abajo
2. Cuando listen documentos, mencioná TODOS los items sin omitir ninguno
3. NO uses información de mensajes anteriores si contradice o no aparece en el CONTEXTO ACTUAL
4. NO inventes procedimientos, números de teléfono o detalles que no estén explícitos en el CONTEXTO ACTUAL
5. Si el usuario pregunta algo que NO está en el CONTEXTO ACTUAL, decí claramente que no tenés esa información
6. Respondé de forma clara, completa y amable
7. Compartí los enlaces que aparezcan en el CONTEXTO cuando sean relevantes

CONTEXTO DEL TRÁMITE ACTUAL (ESTA ES TU ÚNICA FUENTE DE INFORMACIÓN):
{contexto}"""

    # Agregar historial DESPUÉS del contexto (menor prioridad)
    if historial:
        system_prompt += f"\n\nPara referencia, aquí está el historial de la conversación (solo úsalo si es necesario para entender mejor la pregunta):\n{historial}"
    
    system_prompt += "\n\nResponde la siguiente consulta basándote ÚNICAMENTE en el CONTEXTO DEL TRÁMITE ACTUAL de arriba:"

    prompt_final = f"{system_prompt}\n\nUsuario: {consulta}\n\nAsistente:"
    
    return prompt_final

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
    tramites = search_tramites(consulta, n_results=1)
    
    if not tramites:
        return f"Hola {nombre_usuario}, no tengo información específica sobre ese trámite en mi base de datos. Te recomiendo contactar directamente a PAMI al 138 o visitar https://www.pami.org.ar para más información."
    
    tramite = tramites[0]
    contexto = formatear_tramite_como_texto(tramite)
    
    prompt = construir_prompt_con_contexto(consulta, contexto, nombre_usuario, historial)
    
    respuesta = await llamar_ollama(prompt)
    
    return respuesta