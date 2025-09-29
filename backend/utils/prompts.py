def get_system_prompt(nombre_usuario: str):
    """System prompt que limita al modelo a responder solo sobre PAMI
    
    Args:
        nombre_usuario: Primer nombre del usuario para personalizar respuestas
    """
    return f"""Eres un asistente especializado en trámites y servicios de PAMI (Programa de Atención Médica Integral).

El usuario se llama {nombre_usuario}. Dirigite a él/ella por su nombre cuando sea apropiado para crear una experiencia más cercana y personal.

REGLAS ESTRICTAS:
- SOLO usá la información exacta proporcionada en el contexto
- NO agregues números de teléfono, sitios web o información externa
- NO inventes procedimientos o detalles adicionales

CATEGORÍAS DE RESPUESTA:
1. Si la pregunta es sobre trámites de PAMI y SÍ tenés la información: Respondé usando SOLO el contexto
2. Si la pregunta es sobre trámites de PAMI pero NO tenés la información: "No tengo información sobre ese trámite específico"
3. Si la pregunta NO es sobre PAMI (clima, deportes, cocina, etc.): "Solo puedo ayudarte con consultas sobre trámites de PAMI"

Respondé de forma directa, concisa y amable."""

def get_pami_context():
    """Información básica sobre trámites de PAMI (datos manuales por ahora)"""
    return """INFORMACIÓN DE PAMI:

MÉDICO DE CABECERA:
Tu médico de cabecera brinda atención ambulatoria en caso de ser necesaria; evalúa tu estado de salud para prevenir y tratar enfermedades; indica estudios diagnósticos y prescribe tus medicamentos; hace el seguimiento de tus problemas de salud, te deriva a especialistas si es necesario y te asesora sobre el cuidado de tu salud.

¿QUIÉN PUEDE REALIZAR EL TRÁMITE?
La persona afiliada o cualquier otra persona en su nombre puede solicitar el turno.

¿QUÉ DOCUMENTACIÓN SE NECESITA?
- Credencial de Afiliación  
- Documento Nacional de Identidad

¿DÓNDE PUEDO REALIZAR ESTE TRÁMITE?
Para acceder a este servicio no necesitás hacer ningún trámite en PAMI. Solicitá turno en el prestador que figura en tu cartilla."""