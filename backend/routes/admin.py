from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.connection import get_db
from models.user import Usuario
from models.role import Rol, usuario_rol
from schemas.user import UserResponse, UserCreate
from utils.security import require_role
from utils.auth import get_password_hash

from utils.auth import validar_password

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin = Depends(require_role("administrador"))
):
    """Listar todos los usuarios (solo admin)"""
    users = db.query(Usuario).all()
    return users

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(require_role("administrador"))
):
    """Eliminar un usuario (solo admin)"""
    
    # Obtener el ID del admin actual
    current_user_id = current_admin.get("user_id")
    
    # No permitir auto-eliminación
    if user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés eliminarte a vos mismo"
        )
    
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir eliminar el admin principal del sistema
    if user.correo_electronico == "admin@caece.edu.ar":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el admin por defecto del sistema"
        )
    
    # Verificar que no sea el último admin
    admin_role = db.query(Rol).filter(Rol.nombre_rol == "administrador").first()
    
    db.delete(user)
    db.commit()
    
    return {"message": f"Usuario {user_id} eliminado"}

@router.post("/users", response_model=UserResponse)
def create_admin_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    admin = Depends(require_role("administrador"))
):
    """Crear un nuevo administrador (solo admin)"""
    
    # Verificar si el email ya existe
    existing_user = db.query(Usuario).filter(
        Usuario.correo_electronico == user.correo_electronico
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado"
        )
    
    if not validar_password(user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Contraseña no valida")
    
    # Crear nuevo usuario
    db_user = Usuario(
        primer_nombre=user.primer_nombre,
        segundo_nombre=user.segundo_nombre,
        apellido=user.apellido,
        correo_electronico=user.correo_electronico,
        contraseña=get_password_hash(user.password)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Asignar rol de administrador
    admin_role = db.query(Rol).filter(Rol.nombre_rol == "administrador").first()
    if admin_role:
        db.execute(usuario_rol.insert().values(
            id_usuario=db_user.id_usuario,
            id_rol=admin_role.id_rol
        ))
        db.commit()
    
    return db_user