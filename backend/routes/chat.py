from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.chat import ChatMessage, ChatResponse
from utils.security import get_current_user
from utils.context import (
    initialize_user_context, 
    get_user_context,
    add_message,
    format_history_for_prompt
)
from utils.rag import generar_respuesta_con_rag
from models.user import Usuario
from db.connection import get_db

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/consulta", response_model=ChatResponse)
async def procesar_consulta(
    mensaje: ChatMessage,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Procesar consulta del usuario con el asistente de IA usando RAG"""
    
    user_id = current_user.get("user_id")
    
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not get_user_context(user_id):
        initialize_user_context(user_id, usuario.primer_nombre, usuario.apellido)
    
    add_message(user_id, "user", mensaje.mensaje)
    
    try:
        historial = format_history_for_prompt(user_id)
        
        respuesta_ia = await generar_respuesta_con_rag(
            consulta=mensaje.mensaje,
            nombre_usuario=usuario.primer_nombre,
            historial=historial
        )
        
        add_message(user_id, "assistant", respuesta_ia)
        
        return ChatResponse(
            respuesta=respuesta_ia,
            contexto_id=str(user_id)
        )
        
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