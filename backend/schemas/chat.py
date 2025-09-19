from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    mensaje: str

class ChatResponse(BaseModel):
    respuesta: str
    contexto_id: Optional[str] = None