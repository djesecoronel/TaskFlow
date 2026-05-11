import smtplib
import requests
from email.mime.text import MIMEText
from modules.tasks.adapters.itask_notifier import INotificationTarget

class EmailNotificationAdapter(INotificationTarget):
    def __init__(self):
        # Credenciales de misión crítica (Usa variables de entorno en prod)
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = "tu_correo@gmail.com"
        self.password = "tu_app_password" # Password de aplicación de Google

    def send(self, title, message):
        try:
            msg = MIMEText(message)
            msg['Subject'] = title
            msg['From'] = self.sender_email
            msg['To'] = "operativo_destino@gmail.com"

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.password)
                server.send_message(msg)
            
            print(f"✅ [REAL_ADAPTER_SMTP]: Email enviado con éxito.")
            return True
        except Exception as e:
            print(f"❌ [ADAPTER_ERROR]: Fallo en envío SMTP -> {e}")
            return False

class SlackNotificationAdapter(INotificationTarget):
    def __init__(self):
        # URL de Webhook real (Obtenla en api.slack.com)
        self.webhook_url = "https://hooks.slack.com/services/T000/B000/XXXX"

    def send(self, title, message):
        try:
            payload = {"text": f"🚨 *{title}*\n{message}"}
            response = requests.post(self.webhook_url, json=payload)
            
            if response.status_code == 200:
                print(f"✅ [REAL_ADAPTER_SLACK]: Mensaje publicado en canal.")
                return True
        except Exception as e:
            print(f"❌ [ADAPTER_ERROR]: Fallo en Slack -> {e}")
            return False