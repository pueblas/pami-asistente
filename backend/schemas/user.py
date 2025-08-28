from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Schema base con campos comunes
class UserBase(BaseModel):
    primer_nombre: str
    apellido: str
    correo_electronico: EmailStr
    segundo_nombre: Optional[str] = None

# Schema para crear usuario (registro)
class UserCreate(UserBase):
    password: str

# Schema para login
class UserLogin(BaseModel):
    correo_electronico: EmailStr
    password: str

# Schema para respuesta (sin contraseña)
class UserResponse(UserBase):
    id_usuario: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True  # Para trabajar con SQLAlchemy

# Schema para el token JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Schema para datos dentro del token
class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None