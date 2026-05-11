from modules.tasks.models.task import Task

# Clase Base Decoradora: Actúa como una Tarea pero contiene una Tarea
class TaskDecorator(Task):
    def __init__(self, task: Task):
        self._task = task

    @property
    def task_id(self): return self._task.task_id

    @property
    def title(self): return self._task.title

    def get_type(self):
        return self._task.get_type()

    def to_dict(self):
        return self._task.to_dict()

# Decorador Concreto: Añade una capa de "Urgencia"
class EmergencyDecorator(TaskDecorator):
    def to_dict(self):
        data = self._task.to_dict()
        # Añadimos metadatos extra dinámicamente
        data["is_emergency"] = True
        data["visual_style"]["border"] = "2px solid red"
        data["title"] = f"🚨 EMERGENCIA: {data['title']}"
        return data

    def send_alert(self):
        """Funcionalidad extra que solo tienen las tareas decoradas"""
        return f"Alerta enviada para la tarea {self._task.task_id}"