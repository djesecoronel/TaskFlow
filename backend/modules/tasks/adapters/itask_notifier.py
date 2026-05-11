from abc import ABC, abstractmethod

class INotificationTarget(ABC):
    @abstractmethod
    def send(self, title, message):
        pass