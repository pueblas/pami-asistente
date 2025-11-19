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
                d3 = datetime(2025, 10, 5, 22, 0, 0)
                d4 = datetime(2025, 9, 3, 14, 0, 0)

                sample_feedback = []

                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta 4", mensaje_bot="Respuesta A", fecha_creacion=d3))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta 3", mensaje_bot="Respuesta A", fecha_creacion=d3))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta 2", mensaje_bot="Respuesta A", fecha_creacion=d3))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta 1", mensaje_bot="Respuesta A", fecha_creacion=d3))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta R", mensaje_bot="Respuesta A", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta 4", mensaje_bot="Respuesta A", fecha_creacion=d1))

                # Likes: 1 en 1/11/25 y 2 en 2/11/25
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta A", mensaje_bot="Respuesta A", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta B", mensaje_bot="Respuesta B", fecha_creacion=d2))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta C", mensaje_bot="Respuesta C", fecha_creacion=d2))

                # Dislikes: 3 en 1/11/25 y 1 en 2/11/25
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta D", mensaje_bot="Respuesta D", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta E", mensaje_bot="Respuesta E", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta F", mensaje_bot="Respuesta F", fecha_creacion=d1))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta G", mensaje_bot="Respuesta G", fecha_creacion=d2))

                # Agregar 2 likes el día 3 de septiembre de 2025
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta H", mensaje_bot="Respuesta H", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta I", mensaje_bot="Respuesta I", fecha_creacion=d4))

                # Agregar 10 dislikes el día 3 de septiembre de 2025
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta J", mensaje_bot="Respuesta J", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta K", mensaje_bot="Respuesta K", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta L", mensaje_bot="Respuesta L", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta M", mensaje_bot="Respuesta M", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta N", mensaje_bot="Respuesta N", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta O", mensaje_bot="Respuesta O", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta P", mensaje_bot="Respuesta P", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta Q", mensaje_bot="Respuesta Q", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta R", mensaje_bot="Respuesta R", fecha_creacion=d4))
                sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta S", mensaje_bot="Respuesta S", fecha_creacion=d4))
                
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
