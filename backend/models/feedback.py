from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from db.connection import Base
ult=func.now()
class Feedback(Base):
    __tablename__ = "feedback"
    
    id_feedback = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Store the submitter's email (we identify users by JWT 'sub')
    correo_electronico = Column(String(255),nullable=True, index=True)
    me_gusta = Column(Boolean, nullable=False)
    mensaje_usuario = Column(Text, nullable=True)
    mensaje_bot = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, server_default=func.now())
    
