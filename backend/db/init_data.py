from sqlalchemy.orm import Session
from db.connection import engine, SessionLocal
from models.user import Usuario
from models.role import Rol, usuario_rol
from models.feedback import Feedback
from passlib.context import CryptContext
from datetime import datetime

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

            # ===== Crear datos de feedback de ejemplo =====
            try:
                print("🧾 Creando datos de feedback de ejemplo...")

                # Fechas solicitadas (día/mes/año) -> crear como datetime
                d1 = datetime(2025, 11, 1, 10, 0, 0)
                d2 = datetime(2025, 11, 2, 12, 0, 0)

                sample_feedback = []

                # Likes: 1 en 1/11/25 y 2 en 2/11/25
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta A", mensaje_bot="Respuesta A", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta B", mensaje_bot="Respuesta B", fecha_creacion=d2))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta C", mensaje_bot="Respuesta C", fecha_creacion=d2))

                # Dislikes: 3 en 1/11/25 y 1 en 2/11/25
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta D", mensaje_bot="Respuesta D", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta E", mensaje_bot="Respuesta E", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta F", mensaje_bot="Respuesta F", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta G", mensaje_bot="Respuesta G", fecha_creacion=d2))

                db.add_all(sample_feedback)
                db.commit()
                print("✅ Datos de feedback de ejemplo creados")
            except Exception as fe_err:
                print(f"⚠️ No se pudieron crear datos de feedback de ejemplo: {fe_err}")
                db.rollback()
        else:
            print("ℹ️ Los datos iniciales ya existen")
            
    except Exception as e:
        print(f"❌ Error creando datos iniciales: {e}")
        db.rollback()
    finally:
        db.close()
