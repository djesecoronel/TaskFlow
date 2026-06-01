from abc import ABC, abstractmethod
from modules.tasks.models.enum import PriorityTask

class ITaskSortStrategy(ABC):
    """
    Interfaz abstracta para el patrón Strategy.
    Define el contrato para ordenar o filtrar listas de tareas.
    """
    @abstractmethod
    def sort(self, tasks: list) -> list:
        pass


class SortByPriorityStrategy(ITaskSortStrategy):
    """
    Estrategia Concreta: Ordena las tareas por nivel de prioridad (Urgent -> Low).
    """
    def sort(self, tasks: list) -> list:
        # Mapeo de peso para poder comparar los Enums técnicamente
        priority_weights = {
            "URGENT": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "LOW": 1
        }
        
        def get_weight(task):
            # Soporta tanto diccionarios nativos como objetos con atributos
            p_val = task.get("priority") if isinstance(task, dict) else getattr(task, "priority", "LOW")
            # Extrae el valor si es un Enum
            if hasattr(p_val, "value"):
                p_val = p_val.value
            return priority_weights.get(str(p_val).upper(), 0)

        print("🎯 [STRATEGY]: Aplicando ordenamiento por peso de Prioridad (Descendiente)")
        return sorted(tasks, key=get_weight, reverse=True)


class SortByTitleStrategy(ITaskSortStrategy):
    """
    Estrategia Concreta: Ordena las tareas alfabéticamente por su título.
    """
    def sort(self, tasks: list) -> list:
        def get_title(task):
            title = task.get("title") if isinstance(task, dict) else getattr(task, "title", "")
            return str(title).lower()

        print("🎯 [STRATEGY]: Aplicando ordenamiento Alfabético por Título")
        return sorted(tasks, key=get_title)