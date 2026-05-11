from modules.tasks.factory.task_factory import TaskFactory
from modules.tasks.models.enum import TaskType, TaskStatus, PriorityTask
from datetime import datetime

class TaskBuilder:
    """
    Patrón Builder: Permite la construcción paso a paso de tareas complejas.
    Cumple con el requisito de 'Creación Avanzada' de la tabla.
    """
    def __init__(self):
        self.reset()

    def reset(self):
        """Reinicia el estado del constructor para una nueva tarea"""
        self._task_id = None
        self._task_type = TaskType.Task
        self._title = "Nueva Tarea"
        self._description = ""
        self._due_date = datetime.now()
        self._kwargs = {
            "status": TaskStatus.To_Do,
            "priority": PriorityTask.Medium,
            "comments": [],
            "history": [f"BUILDER_LOG: Inicio de construcción avanzada en {datetime.now().isoformat()}"],
            "time_logs": [],
            "attachments": [],
            "column_id": None
        }
        return self

    def set_basic_info(self, task_id, task_type, title, description):
        self._task_id = task_id
        self._task_type = task_type
        self._title = title
        self._description = description
        return self

    def set_status(self, status: TaskStatus):
        self._kwargs["status"] = status
        return self

    def set_priority(self, priority: PriorityTask):
        self._kwargs["priority"] = priority
        return self

    def set_due_date(self, due_date):
        self._due_date = due_date
        return self
    
    def set_column(self, column_id):
        self._kwargs["column_id"] = column_id
        return self

    def add_comment(self, comment_text):
        self._kwargs["comments"].append({
            "text": comment_text,
            "created_at": datetime.now().isoformat()
        })
        return self

    def add_attachment(self, file_url):
        self._kwargs["attachments"].append({
            "file": file_url,
            "uploaded_at": datetime.now().isoformat()
        })
        return self

    def build(self):
        """
        Ensambla el objeto final delegando en la TaskFactory.
        """
        task = TaskFactory.create_task(
            task_id=self._task_id,
            task_type=self._task_type,
            title=self._title,
            description=self._description,
            due_date=self._due_date,
            **self._kwargs
        )
        # Limpiamos para el siguiente uso
        self.reset()
        return task