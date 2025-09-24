from fastapi import APIRouter, Depends, HTTPException
from schemas.chat import ChatMessage, ChatResponse
from utils.security import get_current_user
from utils.prompts import get_system_prompt, get_pami_context
import httpx

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/consulta", response_model=ChatResponse)
async def procesar_consulta(
    mensaje: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """Procesar consulta del usuario con el asistente de IA"""
    
    try:
        # Construir prompt completo con sistema + contexto + pregunta usuario
        system_prompt = get_system_prompt()
        context = get_pami_context()
        full_prompt = f"{system_prompt}\n\n{context}\n\nUsuario: {mensaje.mensaje}\n\nAsistente:"
        
        async with httpx.AsyncClient() as client:
            ollama_response = await client.post(
                "http://nodo-ia:11434/api/generate",
                json={
                    "model": "llama3.2:3b",
                    "prompt": full_prompt,
                    "stream": False
                },
                timeout=30.0
            )
            
        if ollama_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error comunicándose con IA")
            
        resultado = ollama_response.json()
        respuesta_ia = resultado.get("response", "No pude procesar tu consulta")
        
        return ChatResponse(
            respuesta=respuesta_ia,
            contexto_id=str(current_user.get("user_id"))
        )
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout conectando con IA")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")