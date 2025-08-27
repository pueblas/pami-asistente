from sqlalchemy.orm import Session
from db.connection import engine, SessionLocal
from models.user import Usuario
from models.role import Rol, usuario_rol
from passlib.context import CryptContext

# Para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_initial_data():
    db = SessionLocal()
    
    try:
        # Verificar si ya existen roles
        existing_roles = db.query(Rol).count()
        
        if existing_roles == 0:
            print("📝 Creando roles iniciales...")
            
            # Crear roles
            role_user = Rol(
                nombre_rol="usuario",
                descripcion="Usuario regular del sistema"
            )
            role_admin = Rol(
                nombre_rol="administrador", 
                descripcion="Administrador del sistema"
            )
            
            db.add(role_user)
            db.add(role_admin)
            db.commit()
            print("✅ Roles creados")
            
            # Crear usuario admin por defecto
            admin_user = Usuario(
                primer_nombre="Administrador",
                segundo_nombre=None,
                apellido="Sistema",
                correo_electronico="admin@caece.edu.ar",
                contraseña=pwd_context.hash("admin123"),
                token_recuperacion=None
            )
            
            db.add(admin_user)
            db.commit()
            
            # Asignar rol admin al usuario
            db.execute(usuario_rol.insert().values(
                id_usuario=admin_user.id_usuario,
                id_rol=role_admin.id_rol
            ))
            db.commit()
            
            print("✅ Usuario admin creado")
            print("📧 Email: admin@pami.gob.ar")
            print("🔑 Contraseña: admin123")
        else:
            print("ℹ️ Los datos iniciales ya existen")
            
    except Exception as e:
        print(f"❌ Error creando datos iniciales: {e}")
        db.rollback()
    finally:
        db.close()