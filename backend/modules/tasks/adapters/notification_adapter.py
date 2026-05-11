from abc import ABC, abstractmethod

# Interfaz que espera nuestro sistema
class INotificationTarget(ABC):
    @abstractmethod
    def send(self, title, message):
        pass

# Adaptador para un servicio de Email (Simulado)
class EmailNotificationAdapter(INotificationTarget):
    def __init__(self):
        # Aquí se instanciaría el cliente real de SendGrid, Mailchimp, etc.
        self.service_name = "SMTP_GATEWAY"

    def send(self, title, message):
        # Traducimos la llamada a lo que el servicio externo entiende
        print(f" adapters.{self.service_name}: Enviando Email -> {title}: {message}")
        return True

# Adaptador para Slack (Simulado)
class SlackNotificationAdapter(INotificationTarget):
    def send(self, title, message):
        print(f" adapters.SLACK_BOT: Publicando en canal -> [{title}] {message}")
        return True