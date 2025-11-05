from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from db.connection import get_db
from models.feedback import Feedback
from models.user import Usuario
from models.role import Rol, usuario_rol
from schemas.feedback import FeedbackCreate, FeedbackResponse
from utils.security import require_role
from utils.auth import verify_token

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("/", response_model=FeedbackResponse)
def guardar_feedback(
    data: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Guarda o actualiza el feedback del usuario para una misma respuesta.

    Si el mismo usuario ya dejó feedback para la misma combinación
    (mensaje_usuario + mensaje_bot) se actualiza el campo `me_gusta` en
    lugar de insertar un nuevo registro. Esto evita duplicados por cambio
    de like -> dislike.
    """
    # validate token and allow both 'usuario' and 'administrador'
    auth = request.headers.get("authorization")
    if not auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Debes iniciar sesión para enviar feedback")

    token = auth.split(" ", 1)[1] if " " in auth else auth
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token inválido o expirado")

    if payload.get("role") not in ("usuario", "administrador"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Rol inválido para enviar feedback")

    # Use the token's email (sub) as the identity for feedback submissions.
    token_email = payload.get("sub")
    if not token_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="El token no contiene email del usuario")

    # Intentar encontrar un feedback existente del mismo correo para la misma respuesta
    existing = db.query(Feedback).filter(
        Feedback.correo_electronico == token_email,
        Feedback.mensaje_usuario == data.mensaje_usuario,
        Feedback.mensaje_bot == data.mensaje_bot,
    ).first()

    if existing:
        existing.me_gusta = data.me_gusta
        # ensure correo_electronico is stored
        if not getattr(existing, "correo_electronico", None):
            existing.correo_electronico = token_email
        db.commit()
        db.refresh(existing)
        return existing

    # Create new feedback record storing only correo_electronico (no id_usuario, no comentario)
    nuevo_feedback = Feedback(
        correo_electronico=token_email,
        me_gusta=data.me_gusta,
        mensaje_usuario=data.mensaje_usuario,
        mensaje_bot=data.mensaje_bot,
    )
    db.add(nuevo_feedback)
    db.commit()
    db.refresh(nuevo_feedback)
    return nuevo_feedback


@router.get("/admin/debug")
def debug_feedback(request: Request, db: Session = Depends(get_db)):
    """Endpoint de depuración (requiere token de administrador).

    Retorna el conteo total de feedbacks y una muestra corta con campos
    relevantes (incluye fecha_creacion en ISO) para facilitar debugging.
    Nota: la ruta se llamó `/debug-all` para evitar colisiones con la ruta
    dinámica `/feedback/{feedback_id}` que podría intentar parsear "debug"
    como un entero.
    """
    # require admin token/role (make auth behavior like frontend adminHome)
    _ensure_admin_from_request(request)

    rows = db.query(Feedback).order_by(Feedback.fecha_creacion.desc()).all()
    # detect if correo_electronico column exists in DB
    try:
        pragma_rows = db.execute("PRAGMA table_info('feedback')").fetchall()
        existing_cols = [r[1] for r in pragma_rows]
        has_email_col = "correo_electronico" in existing_cols
    except Exception:
        has_email_col = False

    sample = []
    for r in rows[:50]:
        item = {
            "id_feedback": r.id_feedback,
            "me_gusta": bool(r.me_gusta),
            "mensaje_usuario": r.mensaje_usuario,
            "mensaje_bot": r.mensaje_bot,
            "fecha_creacion": r.fecha_creacion.isoformat() if r.fecha_creacion else None,
        }
        if has_email_col and getattr(r, "correo_electronico", None):
            item["correo_electronico"] = r.correo_electronico
        sample.append(item)

    return {"count": len(rows), "sample": sample}


def _ensure_admin_from_request(request: Request):
    """Valida que la request incluya un token válido y rol administrador.

    Similar a la verificación que hace el frontend en adminHome (token + role).
    Lanzará HTTPException con mensajes amigables si falta/expira/no tiene rol.
    """
    auth = request.headers.get("authorization")
    if not auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="No autorizado. Iniciá sesión como administrador.")

    # extraer token (soporta 'Bearer <token>' o token directo)
    token = auth.split(" ", 1)[1] if " " in auth else auth
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token inválido o expirado")

    if payload.get("role") != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Acceso denegado. Se requiere rol de administrador.")

    return payload

@router.get("/", response_model=List[FeedbackResponse])
def listar_feedback(
    request: Request,
    db: Session = Depends(get_db),
):
    """Lista todos los feedbacks (solo admin)"""
    _ensure_admin_from_request(request)
    return db.query(Feedback).order_by(Feedback.fecha_creacion.desc()).all()


@router.post("/admin/seed")
def seed_feedback(request: Request, db: Session = Depends(get_db)):
    """Inserta datos de ejemplo en la tabla feedback (solo entorno local/admin).

    Útil para desarrollo si la inicialización no insertó los ejemplos.
    """
    # Validar admin
    _ensure_admin_from_request(request)

    # Buscar un usuario administrador para asignar los samples
    admin_user = db.query(Usuario).join(
        usuario_rol, Usuario.id_usuario == usuario_rol.c.id_usuario
    ).join(Rol, usuario_rol.c.id_rol == Rol.id_rol).filter(
        Rol.nombre_rol == "administrador"
    ).first()

    if not admin_user:
        raise HTTPException(status_code=404, detail="No se encontró usuario administrador para asignar samples")

    try:
        from datetime import datetime

        d1 = datetime(2025, 11, 1, 10, 0, 0)
        d2 = datetime(2025, 11, 2, 12, 0, 0)
        # check if correo_electronico column exists
        try:
            pragma_rows = db.execute("PRAGMA table_info('feedback')").fetchall()
            existing_cols = [r[1] for r in pragma_rows]
            has_email_col = "correo_electronico" in existing_cols
        except Exception:
            has_email_col = False

        sample_feedback = []
        if has_email_col:
            sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta A", mensaje_bot="Respuesta A", fecha_creacion=d1))
            sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta B", mensaje_bot="Respuesta B", fecha_creacion=d2))
            sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=True, mensaje_usuario="Consulta C", mensaje_bot="Respuesta C", fecha_creacion=d2))
            sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta D", mensaje_bot="Respuesta D", fecha_creacion=d1))
            sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta E", mensaje_bot="Respuesta E", fecha_creacion=d1))
            sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta F", mensaje_bot="Respuesta F", fecha_creacion=d1))
            sample_feedback.append(Feedback(correo_electronico=admin_user.correo_electronico, me_gusta=False, mensaje_usuario="Consulta G", mensaje_bot="Respuesta G", fecha_creacion=d2))
        else:
            # older DB schema: create without correo_electronico
            sample_feedback.append(Feedback(me_gusta=True, mensaje_usuario="Consulta A", mensaje_bot="Respuesta A", fecha_creacion=d1))
            sample_feedback.append(Feedback(me_gusta=True, mensaje_usuario="Consulta B", mensaje_bot="Respuesta B", fecha_creacion=d2))
            sample_feedback.append(Feedback(me_gusta=True, mensaje_usuario="Consulta C", mensaje_bot="Respuesta C", fecha_creacion=d2))
            sample_feedback.append(Feedback(me_gusta=False, mensaje_usuario="Consulta D", mensaje_bot="Respuesta D", fecha_creacion=d1))
            sample_feedback.append(Feedback(me_gusta=False, mensaje_usuario="Consulta E", mensaje_bot="Respuesta E", fecha_creacion=d1))
            sample_feedback.append(Feedback(me_gusta=False, mensaje_usuario="Consulta F", mensaje_bot="Respuesta F", fecha_creacion=d1))
            sample_feedback.append(Feedback(me_gusta=False, mensaje_usuario="Consulta G", mensaje_bot="Respuesta G", fecha_creacion=d2))

        db.add_all(sample_feedback)
        db.commit()
        return {"inserted": len(sample_feedback)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error insertando samples: {e}")

@router.get("/{feedback_id}", response_model=FeedbackResponse)
def obtener_feedback(
    feedback_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    _ensure_admin_from_request(request)
    feedback = db.query(Feedback).filter(Feedback.id_feedback == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback no encontrado")
    return feedback

@router.delete("/{feedback_id}")
def eliminar_feedback(
    feedback_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    _ensure_admin_from_request(request)
    feedback = db.query(Feedback).filter(Feedback.id_feedback == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback no encontrado")
    db.delete(feedback)
    db.commit()
    return {"message": f"Feedback {feedback_id} eliminado"}
