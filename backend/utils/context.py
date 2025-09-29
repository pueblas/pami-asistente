from typing import List, Dict, Optional

# Almacenamiento en memoria del contexto por usuario
user_contexts: Dict[int, Dict] = {}

# Límite de mensajes a mantener
MAX_MESSAGES = 10

def initialize_user_context(user_id: int, nombre: str, apellido: str):
    """Inicializa el contexto de un usuario con su información personal"""
    if user_id not in user_contexts:
        user_contexts[user_id] = {
            "nombre": nombre,
            "apellido": apellido,
            "mensajes": []
        }

def get_user_context(user_id: int) -> Optional[Dict]:
    """Obtiene el contexto completo de un usuario"""
    return user_contexts.get(user_id)

def add_message(user_id: int, role: str, content: str):
    """Agrega un mensaje al contexto del usuario
    
    Args:
        user_id: ID del usuario
        role: "user" o "assistant"
        content: Contenido del mensaje
    """
    if user_id in user_contexts:
        user_contexts[user_id]["mensajes"].append({
            "role": role,
            "content": content
        })
        
        # Mantener solo los últimos MAX_MESSAGES
        if len(user_contexts[user_id]["mensajes"]) > MAX_MESSAGES:
            user_contexts[user_id]["mensajes"] = user_contexts[user_id]["mensajes"][-MAX_MESSAGES:]

def get_conversation_history(user_id: int) -> List[Dict]:
    """Obtiene el historial de mensajes de un usuario"""
    context = user_contexts.get(user_id)
    if context:
        return context["mensajes"]
    return []

def clear_context(user_id: int):
    """Elimina el contexto de un usuario (logout o fin de sesión)"""
    if user_id in user_contexts:
        del user_contexts[user_id]

def format_history_for_prompt(user_id: int) -> str:
    """Formatea el historial de conversación para incluir en el prompt"""
    history = get_conversation_history(user_id)
    
    if not history:
        return ""
    
    formatted = "\n\nHISTORIAL DE CONVERSACIÓN:\n"
    for msg in history:
        if msg["role"] == "user":
            formatted += f"Usuario: {msg['content']}\n"
        else:
            formatted += f"Asistente: {msg['content']}\n"
    
    return formatted