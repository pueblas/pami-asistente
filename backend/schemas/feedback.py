from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Feedback payload: clients must send only the reaction and the
# user/bot messages. The server derives the submitter from the JWT
# (token 'sub' contains the user's email) and stores correo_electronico
# with the feedback record.
class FeedbackCreate(BaseModel):
    me_gusta: bool
    mensaje_usuario: str
    mensaje_bot: str

class FeedbackResponse(BaseModel):
    id_feedback: int
    correo_electronico: Optional[str]
    me_gusta: bool
    mensaje_usuario: Optional[str]
    mensaje_bot: Optional[str]
    fecha_creacion: Optional[datetime]

    class Config:
        orm_mode = True

