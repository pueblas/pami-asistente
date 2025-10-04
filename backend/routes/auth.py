from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta
from pydantic import EmailStr

from db.connection import get_db
from models.user import Usuario
from models.role import Rol, usuario_rol
from schemas.user import UserCreate, UserLogin, UserResponse, Token
from utils.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_reset_token,
    verify_token
)
from utils.email import send_recovery_email

from utils.auth import validar_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Registro de nuevo usuario"""
    
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
    
    # Asignar rol de usuario por defecto
    user_role = db.query(Rol).filter(Rol.nombre_rol == "usuario").first()
    if user_role:
        db.execute(usuario_rol.insert().values(
            id_usuario=db_user.id_usuario,
            id_rol=user_role.id_rol
        ))
        db.commit()
    
    return db_user

@router.post("/login", response_model=Token)
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Login de usuario"""
    
    # Buscar usuario por email
    user = db.query(Usuario).filter(
        Usuario.correo_electronico == user_login.correo_electronico
    ).first()
    
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email invalido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_login.password, user.contraseña):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )

    
    
    # Obtener rol del usuario usando ORM
    user_role_entry = db.query(Rol).join(
        usuario_rol, 
        Rol.id_rol == usuario_rol.c.id_rol
    ).filter(
        usuario_rol.c.id_usuario == user.id_usuario
    ).first()
    
    role_name = user_role_entry.nombre_rol if user_role_entry else "usuario"
    
    # Crear token con el rol incluido
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.correo_electronico,
            "user_id": user.id_usuario,
            "role": role_name
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": role_name
    }

@router.post("/recover")
def recover_password(email: EmailStr, db: Session = Depends(get_db)):
    """Solicitar recuperación de contraseña"""
    
    # Buscar usuario por email
    user = db.query(Usuario).filter(
        Usuario.correo_electronico == email
    ).first()
    
    # Siempre retornar éxito (seguridad: no revelar si el email existe)
    response = {
        "message": "Si el email existe, recibirás instrucciones para recuperar tu contraseña"
    }
    
    if user:
        # Generar token de recuperación
        reset_token = create_reset_token(email)
        
        # Guardar token en la BD (opcional, para mayor seguridad)
        user.token_recuperacion = reset_token
        db.commit()
        
        # Enviar email
        send_recovery_email(email, reset_token)
    
    return response

@router.post("/reset")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    """Restablecer contraseña con token"""
    
    # Verificar token
    payload = verify_token(token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )
    
    # Buscar usuario
    email = payload.get("sub")
    user = db.query(Usuario).filter(
        Usuario.correo_electronico == email
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que el token coincide (si lo guardamos en BD)
    if user.token_recuperacion != token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token no válido para este usuario"
        )
    
    if not validar_password(new_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Contraseña no valida")


    # Actualizar contraseña
    user.contraseña = get_password_hash(new_password)
    user.token_recuperacion = None  # Limpiar token usado
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}
