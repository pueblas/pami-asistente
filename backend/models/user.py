from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from db.connection import Base

class Usuario(Base):
    __tablename__ = "usuario"
    
    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    primer_nombre = Column(String(50), nullable=False)
    segundo_nombre = Column(String(50), nullable=True)
    apellido = Column(String(50), nullable=False)
    correo_electronico = Column(String(100), unique=True, nullable=False, index=True)
    contraseña = Column(Text, nullable=False)
    token_recuperacion = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())