try:
    from modules.tasks.models.enum import PriorityTask, TaskType
except ImportError:
    # Backup para ejecuciones directas desde la carpeta de modelos
    from enum import PriorityTask, TaskType

class TaskStyleFlyweight:
    """
    Patrón Flyweight: Almacena el estado intrínseco (compartido).
    Mantiene la metadata visual pesada (iconos, colores, estilos CSS) 
    que es idéntica para todas las tareas del mismo tipo y prioridad.
    """
    def __init__(self, task_type: TaskType, priority: PriorityTask):
        self.task_type = task_type
        self.priority = priority
        
        # Metadata "pesada" que se compartirá entre miles de instancias
        self.icon = self._assign_icon(task_type)
        self.color = self._assign_color(priority)
        
        # Generación de clases de estilo para el Frontend
        type_name = str(task_type.value).lower() if hasattr(task_type, 'value') else str(task_type).lower()
        priority_name = str(priority.value).lower() if hasattr(priority, 'value') else str(priority).lower()
        self.label_style = f"task-style-{type_name}-{priority_name}"

    def _assign_icon(self, task_type):
        """Asignación de recursos visuales según el tipo de tarea"""
        icons = {
            TaskType.Task: "📝",
            TaskType.Bug: "🐛",
            TaskType.Feature: "✨",
            TaskType.Improvement: "🚀"
        }
        return icons.get(task_type, "📌")

    def _assign_color(self, priority):
        """Asignación de códigos de color según la urgencia de la tarea"""
        colors = {
            PriorityTask.Urgent: "#FF0000",
            PriorityTask.High: "#FF8C00",
            PriorityTask.Medium: "#FFD700",
            PriorityTask.Low: "#ADFF2F"
        }
        return colors.get(priority, "#FFFFFF")

    def to_dict(self):
        """Serialización de la metadata visual para el intercambio de datos"""
        return {
            "icon": self.icon,
            "color": self.color,
            "style": self.label_style
        }


class FlyweightFactory:
    """
    Fábrica de Flyweights: Gestiona el ciclo de vida y la reutilización.
    Asegura que solo exista UNA instancia de cada combinación visual en memoria.
    """
    # Caché privada de objetos Flyweight
    _flyweights = {}

    @classmethod
    def get_flyweight(cls, task_type, priority):
        """
        Método de acceso: Retorna un objeto existente o crea uno nuevo 
        si la combinación no ha sido solicitada previamente.
        """
        # Normalización de llaves para el diccionario
        key = (task_type, priority)
        
        if key not in cls._flyweights:
            # Si no existe, lo creamos (Lazy Initialization)
            cls._flyweights[key] = TaskStyleFlyweight(task_type, priority)
            
        return cls._flyweights[key]

    @classmethod
    def get_count(cls):
        """Métrica: Retorna el número de objetos únicos en memoria"""
        return len(cls._flyweights)

# --- BLOQUE DE TEST DE INTEGRIDAD (EJECUCIÓN DIRECTA) ---
if __name__ == "__main__":
    print("\n" + "="*50)
    print("🧪 DIAGNÓSTICO DEL PATRÓN FLYWEIGHT")
    print("="*50)
    
    # Simulación de solicitudes masivas
    f1 = FlyweightFactory.get_flyweight(TaskType.Bug, PriorityTask.Urgent)
    f2 = FlyweightFactory.get_flyweight(TaskType.Bug, PriorityTask.Urgent)
    f3 = FlyweightFactory.get_flyweight(TaskType.Task, PriorityTask.Low)
    
    print(f"[+] Instancia 1 (Bug-Urgent): ID {id(f1)}")
    print(f"[+] Instancia 2 (Bug-Urgent): ID {id(f2)}")
    print(f"[+] Instancia 3 (Task-Low):   ID {id(f3)}")
    
    print("\n" + "-"*50)
    print(f"¿Instancia 1 y 2 son el mismo objeto?: {'✅ SÍ (Correcto)' if f1 is f2 else '❌ NO (Error)'}")
    print(f"Total de objetos en memoria: {FlyweightFactory.get_count()} (Esperado: 2)")
    print("="*50 + "\n")