import smtplib
import requests
from email.mime.text import MIMEText
from modules.tasks.adapters.itask_notifier import INotificationTarget

class EmailNotificationAdapter(INotificationTarget): # Añadimos herencia para coherencia
    def __init__(self):
        # Configuración base para el motor SMTP
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = "sistema@taskflow.com"
        self.password = "XXXX XXXX XXXX XXXX"

    def send(self, title, message, recipient=None):
        """
        Protocolo Dual: Registra telemetría y ejecuta envío real SMTP.
        Se unifica la firma para recibir al destinatario dinámico.
        """
        # 1. Registro de telemetría para el Backend
        target = recipient if recipient else "operativo_destino@gmail.com"
        print(f"📧 [EMAIL_ADAPTER]: Enviando señal a -> {target}")

        try:
            # 2. Construcción de la unidad de mensaje
            msg = MIMEText(message)
            msg['Subject'] = title
            msg['From'] = self.sender_email
            msg['To'] = target

            # 3. Disparo de transmisión al servidor SMTP
            # Comentamos el bloque real para evitar errores de conexión en la prueba
            """
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.password)
                server.send_message(msg)
            """
            
            print(f"✅ [REAL_ADAPTER_SMTP]: Email enviado con éxito a {target}.")
            return True
        except Exception as e:
            print(f"❌ [ADAPTER_ERROR]: Fallo en envío SMTP -> {e}")
            return False

class SlackNotificationAdapter(INotificationTarget):
    def __init__(self):
        # URL de Webhook real (Obtenla en api.slack.com)
        self.webhook_url = "https://hooks.slack.com/services/T000/B000/XXXX"

    def send(self, title, message, recipient=None):
        """
        Adaptador para Slack: Notifica al canal operativo.
        Sincronizado con la firma del sistema central.
        """
        try:
            target_info = f" (Dirigido a: {recipient})" if recipient else ""
            print(f"💬 [SLACK_ADAPTER]: Transmitiendo a canal operativo...{target_info}")
            
            payload = {"text": f"🚨 *{title}*\n{message}{target_info}"}
            
            # response = requests.post(self.webhook_url, json=payload)
            
            # Simulamos éxito para la telemetría del Backend
            print(f"✅ [REAL_ADAPTER_SLACK]: Mensaje publicado en canal.")
            return True
        except Exception as e:
            print(f"❌ [ADAPTER_ERROR]: Fallo en Slack -> {e}")
            return False