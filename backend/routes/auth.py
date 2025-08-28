from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from db.connection import get_db
from models.user import Usuario
from models.role import Rol, usuario_rol
from schemas.user import UserCreate, UserLogin, UserResponse, Token
from utils.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

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
    
    # Verificar que existe y la contraseña es correcta
    if not user or not verify_password(user_login.password, user.contraseña):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Alguno de los datos ingresados es incorrecto",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.correo_electronico,
            "user_id": user.id_usuario
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}