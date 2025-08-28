import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_recovery_email(to_email: str, token: str):
    """Envía email de recuperación de contraseña"""
    
    # Configuración SMTP (MailHog)
    SMTP_HOST = os.getenv("SMTP_HOST", "mailhog")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 1025))
    
    # Crear link de recuperación
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
    # Crear mensaje
    message = MIMEMultipart("alternative")
    message["Subject"] = "Recuperación de Contraseña - Asistente de Tramites de PAMI"
    message["From"] = "noreply@asistente-pami.com"
    message["To"] = to_email
    
    # Contenido HTML del email
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña en PAMI Asistente.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <div style="margin: 30px 0;">
            <a href="{reset_link}" 
               style="background-color: #667eea; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Si no solicitaste este cambio, puedes ignorar este email.
          </p>
          <p style="color: #666; font-size: 14px;">
            Este enlace expirará en 1 hora por seguridad.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            PAMI Asistente - Sistema de Asistencia Virtual
          </p>
        </div>
      </body>
    </html>
    """
    
    # Adjuntar contenido HTML
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)
    
    # Enviar email
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            # MailHog no necesita autenticación
            server.send_message(message)
            print(f"✉️ Email enviado a {to_email}")
            print(f"🔗 Ver email en: http://localhost:8025")
            return True
    except Exception as e:
        print(f"❌ Error enviando email: {e}")
        return False    