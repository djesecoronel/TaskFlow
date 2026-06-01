from abc import ABC, abstractmethod

class INotificationTarget(ABC):
    @abstractmethod
    def send(self, title, message):
        pass

    # --- NUEVA FUNCIONALIDAD: PATRÓN OBSERVER ---
    @abstractmethod
    def update(self, event_type: str, task_data: dict) -> None:
        """
        Método estándar del patrón Observer. 
        Permite al objetivo de notificación reaccionar dinámicamente 
        cuando el TaskService (Subject) emita un evento.
        """
        pass