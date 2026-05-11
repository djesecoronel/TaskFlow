from abc import ABC, abstractmethod
import copy
# IMPORTANTE: Añadimos timezone para el fix del error 500
from datetime import datetime, timezone
from modules.tasks.models.enum import TaskType, TaskStatus, PriorityTask

class Task(ABC):

    def __init__(self, task_id, title, description, status=TaskStatus.To_Do, priority=PriorityTask.Medium, due_date=None, column_id=None, **kwargs):
        # Mapeo: Si recibimos 'id' de Supabase, lo asignamos a task_id
        self.task_id = task_id or kwargs.get("id")
        self.title = title
        self.description = description
        self.parent_task = kwargs.get("parent_task")
        self.status = status
        self.priority = priority
        self.due_date = due_date
        self.column_id = column_id
        self.user_id = kwargs.get("user_id") # FK con tabla users en tu esquema
        
        # --- ATRIBUTO PARA ABSTRACT FACTORY ---
        self.visual_style = kwargs.get("visual_style", {})
        
        # --- PATRÓN COMPOSITE: JERARQUÍA DE TAREAS ---
        self.subtasks = kwargs.get("subtasks", []) 
        
        # Inicialización de listas (Audit Trail y Metadatos)
        self.history = kwargs.get("history", [])
        self.comments = kwargs.get("comments", [])
        self.time_logs = kwargs.get("time_logs", [])
        self.attachments = kwargs.get("attachments", [])

    # --- MÉTODOS DEL PATRÓN COMPOSITE ---

    def add_subtask(self, task):
        """Añade un componente hijo a la estructura"""
        if task.task_id == self.task_id:
            return False
            
        self.subtasks.append(task)
        task.parent_task = self.task_id
        self.history.append(f"COMPOSITE_LOG: Subtarea {task.task_id} vinculada")
        return True

    def remove_subtask(self, task_id):
        """Elimina un componente hijo por su ID"""
        self.subtasks = [s for s in self.subtasks if s.task_id != task_id]
        self.history.append(f"COMPOSITE_LOG: Subtarea {task_id} desvinculada")

    @abstractmethod
    def get_type(self):
        """Patrón Factory Method: Obliga a las subclases a definir su tipo"""
        pass

    def to_dict(self):
        """
        Serialización completa sincronizada con el esquema de Supabase.
        Mapea 'task_id' a 'id' para que la DB lo reconozca como PK.
        """
        subtasks_dict = [
            sub.to_dict() if hasattr(sub, 'to_dict') else sub 
            for sub in self.subtasks
        ]

        return {
            "id": self.task_id, # Sincronizado con columna 'id' (uuid) de tu esquema
            "column_id": self.column_id,
            "user_id": self.user_id,
            "parent_task": self.parent_task,
            "title": self.title,
            "description": self.description,
            "status": self.status.value if isinstance(self.status, TaskStatus) else self.status,
            "priority": self.priority.value if isinstance(self.priority, PriorityTask) else self.priority,
            "type": self.get_type().value,
            "due_date": self.due_date.isoformat() if isinstance(self.due_date, datetime) else self.due_date,
            "history": self.history,
            "comments": self.comments, # Campo jsonb en Supabase
            "time_logs": self.time_logs,
            "attachments": self.attachments, # Campo jsonb en Supabase
            "visual_style": self.visual_style,
            "subtasks": subtasks_dict
        }

    def clone(self):
        """Patrón Prototype: Clonación profunda"""
        cloned_task = copy.deepcopy(self)
        # Al clonar reseteamos el ID para que la DB genere uno nuevo
        cloned_task.task_id = None
        cloned_task.history.append(f"Cloned from original at {datetime.now().isoformat()}")
        return cloned_task

    def update_task(self, data: dict):
        """Actualización dinámica de atributos"""
        if "title" in data: self.title = data["title"]
        if "description" in data: self.description = data["description"]
        
        if "status" in data:
            self.status = data["status"] if isinstance(data["status"], TaskStatus) else TaskStatus(data["status"])
            
        if "priority" in data:
            self.priority = data["priority"] if isinstance(data["priority"], PriorityTask) else PriorityTask(data["priority"])
            
        if "due_date" in data:
            self.due_date = datetime.fromisoformat(data["due_date"].replace('Z', '+00:00')) if isinstance(data["due_date"], str) else data["due_date"]
            
        if "column_id" in data: self.column_id = data["column_id"]
        if "visual_style" in data: self.visual_style = data["visual_style"]

        for key, value in data.items():
            forbidden = ["title", "description", "status", "priority", "due_date", "column_id", "task_id", "visual_style", "subtasks"]
            if key not in forbidden:
                setattr(self, key, value)

        self.history.append(f"UPDATE_LOG: Tarea modificada en {datetime.now().isoformat()}")
        return self.to_dict()

    def move_task(self, column_id):
        old_column = self.column_id
        self.column_id = column_id
        self.history.append(f"MOVE_LOG: Cambio de columna {old_column} -> {column_id}")
        return self.to_dict()

    def add_comment(self, comment):
        self.comments.append({
            "text": comment,
            "created_at": datetime.now().isoformat()
        })
        self.history.append("COMMENT_LOG: Nuevo comentario registrado")
        return self.to_dict()

    def add_time_log(self, hours):
        self.time_logs.append({
            "hours": hours,
            "date": datetime.now().isoformat()
        })
        return self.to_dict()

    def add_attachment(self, file):
        self.attachments.append({
            "file": file,
            "uploaded_at": datetime.now().isoformat()
        })
        return self.to_dict()
    
    # --- FIX DEL ERROR 500: OFFSET-NAIVE VS OFFSET-AWARE ---
    def get_deadline_hours(self):
        """Template Method: Cálculo de tiempo restante compatible con zonas horarias"""
        if not self.due_date:
            return None
            
        # Convertimos a objeto datetime si es string
        dt = self.due_date
        if isinstance(dt, str):
            # Limpiamos el formato 'Z' por '+00:00' para que Python lo entienda como UTC
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        
        # Forzamos que 'dt' tenga zona horaria UTC si no la tiene
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
            
        # Calculamos la diferencia usando el 'ahora' en UTC
        now = datetime.now(timezone.utc)
        delta = dt - now
        
        return round(max(delta.total_seconds() / 3600, 0), 2)