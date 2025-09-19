from fastapi import APIRouter, Depends, HTTPException
from schemas.chat import ChatMessage, ChatResponse
from utils.security import get_current_user
import httpx

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/consulta", response_model=ChatResponse)
async def procesar_consulta(
    mensaje: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """Procesar consulta del usuario con el asistente de IA"""
    
    try:
        # Conectar directamente con el servicio nodo-ia
        async with httpx.AsyncClient() as client:
            ollama_response = await client.post(
                "http://nodo-ia:11434/api/generate",
                json={
                    "model": "llama3.2:3b",
                    "prompt": mensaje.mensaje,
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