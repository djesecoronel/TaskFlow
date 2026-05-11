from modules.tasks.factory.task_factory import TaskFactory
from modules.tasks.models.enum import TaskType, TaskStatus, PriorityTask
from datetime import datetime

class TaskBuilder:
    """
    Patrón Builder: Permite la construcción paso a paso de tareas complejas.
    Ajustado para integrarse con esquemas de DB basados en UUID.
    """
    def __init__(self):
        self.reset()

    def reset(self):
        """Limpia los datos para iniciar una nueva construcción"""
        self._task_id = None  # Dejamos que la DB genere el UUID
        self._task_type = TaskType.Task
        self._title = "Nueva Tarea Avanzada"
        self._description = ""
        self._due_date = datetime.now()
        self._kwargs = {
            "status": TaskStatus.To_Do,
            "priority": PriorityTask.Medium,
            "comments": [],
            "history": ["TASK_CREATED: Builder sequence initiated"],
            "time_logs": [],
            "attachments": []
        }
        return self

    def set_basic_info(self, task_id, task_type, title, description):
        """
        Configura la información esencial.
        NOTA: task_id se ignora si es un entero simple para evitar error 22P02.
        """
        # Blindaje: Si el ID es un número corto (como "1"), lo descartamos
        if task_id and len(str(task_id)) > 5:
            self._task_id = task_id
        else:
            self._task_id = None
        
        if isinstance(task_type, str):
            try:
                self._task_type = TaskType(task_type.upper())
            except (ValueError, KeyError):
                self._task_type = TaskType.Task
        else:
            self._task_type = task_type or TaskType.Task
            
        self._title = title or "SIN_TITULO"
        self._description = description or ""
        return self

    def set_status(self, status):
        if isinstance(status, str):
            try:
                self._kwargs["status"] = TaskStatus(status.upper())
            except ValueError:
                self._kwargs["status"] = TaskStatus.To_Do
        else:
            self._kwargs["status"] = status
        return self

    def set_priority(self, priority):
        if isinstance(priority, str):
            try:
                self._kwargs["priority"] = PriorityTask(priority.upper())
            except ValueError:
                self._kwargs["priority"] = PriorityTask.Medium
        else:
            self._kwargs["priority"] = priority
        return self

    def set_due_date(self, due_date):
        if isinstance(due_date, str):
            try:
                self._due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            except ValueError:
                self._due_date = datetime.now()
        else:
            self._due_date = due_date or datetime.now()
        return self

    def add_extra_data(self, **kwargs):
        """
        Añade datos como user_id o column_id.
        Filtra valores que no son UUIDs válidos para evitar el error '1'.
        """
        for k, v in kwargs.items():
            # Si el valor es algo como "1", lo ignoramos para evitar el crash de la DB
            if k in ["column_id", "user_id"] and v and len(str(v)) < 10:
                print(f"🛠️ [BUILDER]: Ignorando ID inválido '{v}' para '{k}'")
                continue
            self._kwargs[k] = v
        return self

    def add_comment(self, comment_text):
        if comment_text:
            self._kwargs["comments"].append({
                "text": comment_text,
                "created_at": datetime.now().isoformat()
            })
        return self

    def build(self):
        """
        Finaliza la construcción. 
        Mapea el task_id a 'id' si existe para coincidir con la DB.
        """
        try:
            # Si tenemos un task_id válido, lo pasamos en los kwargs como 'id'
            if self._task_id:
                self._kwargs["id"] = self._task_id

            task = TaskFactory.create_task(
                task_id=self._task_id,
                task_type=self._task_type,
                title=self._title,
                description=self._description,
                due_date=self._due_date,
                **self._kwargs
            )
            self.reset()
            return task
        except Exception as e:
            self.reset()
            raise RuntimeError(f"Error en el proceso de construcción (Builder): {str(e)}")