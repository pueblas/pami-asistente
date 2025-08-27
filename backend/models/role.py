from sqlalchemy import Column, Integer, String, ForeignKey, Table
from db.connection import Base

usuario_rol = Table(
    'usuario_rol',
    Base.metadata,
    Column('id_usuario', Integer, ForeignKey('usuario.id_usuario'), primary_key=True),
    Column('id_rol', Integer, ForeignKey('rol.id_rol'), primary_key=True)
)

class Rol(Base):
    __tablename__ = "rol"
    
    id_rol = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_rol = Column(String(20), unique=True, nullable=False)
    descripcion = Column(String(100), nullable=True)