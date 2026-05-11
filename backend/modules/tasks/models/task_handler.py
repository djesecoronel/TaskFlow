from abc import ABC, abstractmethod

class ITaskHandler(ABC):
    """
    Patrón Chain of Responsibility: Interfaz base para los eslabones de la cadena.
    Permite configurar el siguiente manejador y define el método de procesamiento.
    """
    def __init__(self):
        self._next_handler = None

    def set_next(self, handler):
        """Define quién sigue en la cadena de mando."""
        self._next_handler = handler
        return handler

    @abstractmethod
    def handle(self, task_data):
        """
        Método de procesamiento. Si este eslabón no puede resolverlo
        o termina su parte, delega al siguiente.
        """
        if self._next_handler:
            return self._next_handler.handle(task_data)
        return True # Fin de la cadena sin errores