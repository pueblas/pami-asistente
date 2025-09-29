from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.chat import ChatMessage, ChatResponse
from utils.security import get_current_user
from utils.prompts import get_system_prompt, get_pami_context
from utils.context import (
    initialize_user_context, 
    get_user_context,
    add_message,
    format_history_for_prompt
)
from models.user import Usuario
from db.connection import get_db
import httpx

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/consulta", response_model=ChatResponse)
async def procesar_consulta(
    mensaje: ChatMessage,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Procesar consulta del usuario con el asistente de IA"""
    
    user_id = current_user.get("user_id")
    
    # Obtener información del usuario desde la BD
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Inicializar contexto si es la primera interacción
    if not get_user_context(user_id):
        initialize_user_context(user_id, usuario.primer_nombre, usuario.apellido)
    
    # Agregar mensaje del usuario al contexto
    add_message(user_id, "user", mensaje.mensaje)
    
    try:
        # Construir prompt completo
        system_prompt = get_system_prompt(usuario.primer_nombre)
        context = get_pami_context()
        history = format_history_for_prompt(user_id)
        
        # Prompt final: sistema + contexto PAMI + historial + mensaje actual
        full_prompt = f"{system_prompt}\n\n{context}{history}\n\nUsuario: {mensaje.mensaje}\n\nAsistente:"
        
        # Llamar a Ollama
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
        
        # Agregar respuesta del asistente al contexto
        add_message(user_id, "assistant", respuesta_ia)
        
        return ChatResponse(
            respuesta=respuesta_ia,
            contexto_id=str(user_id)
        )
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout conectando con IA")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    
@router.delete("/contexto")
async def limpiar_contexto(
    current_user: dict = Depends(get_current_user)
):
    """Limpia el contexto de conversación del usuario (útil para logout)"""
    from utils.context import clear_context
    
    user_id = current_user.get("user_id")
    clear_context(user_id)
    
    return {"message": "Contexto limpiado exitosamente"}