from modules.tasks.models.enum import TaskType, ThemeType
from modules.tasks.models.enum import TaskStatus, PriorityTask
from modules.tasks.models.task_types import (
    BugTask,
    FeatureTask,
    SimpleTask,
    ImprovementTask
)
from datetime import datetime

# --- INTEGRACIÓN DE PATRONES ---
from modules.tasks.factory.theme_factory import ThemeFactoryProvider
from modules.tasks.models.task_flyweight import FlyweightFactory 

class TaskFactory:
    """
    Fábrica centralizada para la creación de tareas.
    Implementa: Factory Method, Abstract Factory (Temas) y Flyweight (Estilos).
    """
    
    # Mapeo de tipos de tarea a sus respectivas clases
    _creators = {
        TaskType.Bug: BugTask,
        TaskType.Feature: FeatureTask,
        TaskType.Task: SimpleTask,
        TaskType.Improvement: ImprovementTask,
    }

    @staticmethod
    def create_task(task_id, task_type, title, description, due_date, **kwargs):
        """
        Instancia la clase correspondiente al tipo de tarea.
        Maneja la inyección de estilos visuales y metadatos compartidos.
        """
        # --- Normalización de TaskType (Protocolo de Blindaje) ---
        try:
            if isinstance(task_type, str):
                task_type = TaskType(task_type.upper())
            elif task_type is None:
                task_type = TaskType.Task
        except (ValueError, KeyError):
            # Fallback operativo para no romper el flujo de datos
            task_type = TaskType.Task
            
        factory_cls = TaskFactory._creators.get(task_type, SimpleTask)
        
        # --- Lógica de Abstract Factory (Temas) ---
        theme_name = kwargs.pop("theme", ThemeType.LIGHT.value)
        theme_factory = ThemeFactoryProvider.get_factory(theme_name)
        visual_style = theme_factory.create_style()

        # --- Lógica de Flyweight (Optimización de Memoria) ---
        # Recuperamos la prioridad para el Flyweight
        priority_val = kwargs.get("priority", PriorityTask.Medium)
        if isinstance(priority_val, str):
            try: priority_val = PriorityTask(priority_val.upper())
            except: priority_val = PriorityTask.Medium

        # 🪶 [FLYWEIGHT_CORE]: Solicitamos el objeto compartido a la Fábrica
        shared_style = FlyweightFactory.get_flyweight(task_type, priority_val)
        
        # LOG DE TELEMETRÍA: Esto demuestra que el patrón Flyweight está operando
        print(f"🪶 [FLYWEIGHT_INFO]: Unidad '{title}' vinculada a objeto compartido ID: {id(shared_style)}")

        # Inyectamos el diccionario de estilos combinado para la respuesta al Front
        kwargs["visual_style"] = {
            "colors": visual_style.get_colors(),
            "components": visual_style.get_component_styles(),
            "theme_name": theme_name,
            "flyweight_metadata": shared_style.to_dict()
        }

        # --- Normalización de Status (Sincronización de Protocolo) ---
        status = kwargs.pop("status", TaskStatus.To_Do)
        if isinstance(status, str):
            status_upper = status.upper().replace(" ", "_")
            # Mapeo bidireccional para consistencia entre DB y UI
            status_map = {
                "TO_DO": TaskStatus.To_Do,
                "POR HACER": TaskStatus.To_Do,
                "POR_HACER": TaskStatus.To_Do,
                "IN_PROGRESS": TaskStatus.In_Progress,
                "EN PROGRESO": TaskStatus.In_Progress,
                "EN_PROGRESO": TaskStatus.In_Progress,
                "ON_REVIEW": TaskStatus.On_Review,
                "EN REVISIÓN": TaskStatus.On_Review,
                "EN_REVISIÓN": TaskStatus.On_Review,
                "DONE": TaskStatus.Done,
                "COMPLETADO": TaskStatus.Done
            }
            status = status_map.get(status_upper, TaskStatus.To_Do)

        # --- Normalización de Prioridad ---
        priority = kwargs.pop("priority", PriorityTask.Medium)
        if isinstance(priority, str):
            try:
                priority = PriorityTask(priority.upper())
            except:
                priority = PriorityTask.Medium

        # --- CORRECCIÓN: Inyectamos explícitamente el valor serializable del tipo ---
        kwargs["type"] = task_type.value if hasattr(task_type, 'value') else task_type

        # Creamos la instancia
        task_instance = factory_cls(
            task_id=task_id, 
            title=title, 
            description=description, 
            due_date=due_date, 
            status=status, 
            priority=priority, 
            **kwargs
        )
        
        # --- [BLINDAJE DE ESCRITURA]: Forzar tipo en la instancia final ---
        # Esto asegura que si el __init__ del modelo lo reseteara, lo corregimos aquí
        task_instance.type = kwargs["type"]
        
        return task_instance
        
    @staticmethod
    def from_dict(data):
        """
        Reconstruye un objeto Task a partir de un diccionario.
        Efectúa el anclaje de identidad (user_id) y normalización de llaves.
        """
        if not data:
            return None

        # Sincronización de llaves de persistencia: Supabase 'id' -> Kernel 'task_id'
        task_id = data.get("id") or data.get("task_id")
        # Aseguramos que 'type' no sea nulo al venir del dict
        task_type = data.get("type") or "TASK"
        title = data.get("title") or "SIN_TITULO"
        description = data.get("description") or ""
        
        # Manejo robusto de fechas (Protocolo ISO-8601 / RFC-3339)
        due_date_raw = data.get("due_date")
        try:
            if isinstance(due_date_raw, str):
                # Saneamiento de formato de zona horaria de Supabase
                due_date = datetime.fromisoformat(due_date_raw.replace('Z', '+00:00'))
            else:
                due_date = due_date_raw or datetime.now()
        except Exception:
            due_date = datetime.now()

        # --- [ANCLAJE DE ESTADO Y IDENTIDAD] ---
        kwargs = {
            "status": data.get("status") or "TO_DO",
            "priority": data.get("priority") or "MEDIA",
            "user_id": data.get("user_id"), # ANCLAJE CRÍTICO DE OPERATIVO
            "column_id": data.get("column_id"),
            "comments": data.get("comments") or [],
            "history": data.get("history") or [],
            "time_logs": data.get("time_logs") or [],
            "attachments": data.get("attachments") or [],
            "parent_task": data.get("parent_task"), # <--- AÑADIDO: PROTOCOLO COMPOSITE
            "subtasks": data.get("subtasks") or [],  # <--- AÑADIDO: RECURSIÓN COMPOSITE
            "theme": data.get("theme") or ThemeType.LIGHT.value,
            "project_id": data.get("project_id") # Aseguramos persistencia de project_id
        }

        # Preservar estilos visuales si existen en el snapshot de datos
        if "visual_style" in data:
            kwargs["visual_style"] = data["visual_style"]

        print(f"📡 [FACTORY_RECOVERY]: Unidad '{title}' vinculada a Operativo: {kwargs['user_id']}")

        return TaskFactory.create_task(
            task_id,
            task_type,
            title,
            description,
            due_date,
            **kwargs
        )