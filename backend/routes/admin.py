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
    
    # Obtener roles para cada usuario
    users_with_roles = []
    for user in users:
        # Buscar el rol del usuario
        user_role = db.query(Rol.nombre_rol).join(
            usuario_rol, Rol.id_rol == usuario_rol.c.id_rol
        ).filter(usuario_rol.c.id_usuario == user.id_usuario).first()
        
        # Crear dict con datos del usuario y su rol
        user_data = {
            "id_usuario": user.id_usuario,
            "primer_nombre": user.primer_nombre,
            "segundo_nombre": user.segundo_nombre,
            "apellido": user.apellido,
            "correo_electronico": user.correo_electronico,
            "fecha_creacion": user.fecha_creacion,
            "rol": user_role[0] if user_role else "usuario"
        }
        users_with_roles.append(user_data)
    
    return users_with_roles

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

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: dict,
    db: Session = Depends(get_db),
    admin = Depends(require_role("administrador"))
):
    """Actualizar el rol de un usuario (solo admin)"""
    
    # Extraer el nuevo rol del body
    new_role = role_data.get("new_role")
    if not new_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El campo 'new_role' es requerido"
        )
    
    # Verificar que el rol sea válido
    if new_role not in ["usuario", "administrador"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol inválido. Debe ser 'usuario' o 'administrador'"
        )
    
    # Verificar que el usuario existe
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Obtener el ID del admin actual
    current_user_id = admin.get("user_id")
    
    # No permitir cambiar el rol propio
    if user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés cambiar tu propio rol"
        )
    
    # No permitir cambiar el rol del admin principal del sistema
    if user.correo_electronico == "admin@caece.edu.ar":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cambiar el rol del admin principal del sistema"
        )
    
    # Obtener los roles
    target_role = db.query(Rol).filter(Rol.nombre_rol == new_role).first()
    if not target_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rol '{new_role}' no encontrado"
        )
    
    # Eliminar roles existentes del usuario
    db.execute(usuario_rol.delete().where(usuario_rol.c.id_usuario == user_id))
    
    # Asignar el nuevo rol
    db.execute(usuario_rol.insert().values(
        id_usuario=user_id,
        id_rol=target_role.id_rol
    ))
    
    db.commit()
    
    return {"message": f"Rol de usuario {user_id} actualizado a {new_role}"}