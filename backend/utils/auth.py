from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Configuración
SECRET_KEY = "pami-asistente-jwt-secret-key-desarrollo-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Contexto para hashear passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Funciones para passwords
def verify_password(plain_password, hashed_password):
    """Verifica si la contraseña es correcta"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hashea una contraseña"""
    return pwd_context.hash(password)

# Funciones para JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def verify_token(token: str):
    """Verifica y decodifica un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
    
def create_reset_token(email: str):
    """Crea un token especial para reset de contraseña"""
    data = {
        "sub": email,
        "type": "password_reset"
    }
    # Token válido por 1 hora
    expires = timedelta(hours=1)
    return create_access_token(data=data, expires_delta=expires)