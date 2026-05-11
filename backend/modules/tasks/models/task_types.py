from modules.tasks.models.task import Task
from modules.tasks.models.enum import TaskType

# Bug Task: Especialización para errores del sistema
class BugTask(Task):
    def __init__(self, task_id, title, description, due_date=None, severity="medium", **kwargs):
        # El visual_style entra por kwargs y se sube a la clase Task
        super().__init__(task_id, title, description, due_date=due_date, **kwargs)
        self.severity = severity

    def get_type(self):
        return TaskType.Bug

    def to_dict(self):
        # Extendemos el diccionario base con el atributo específico
        data = super().to_dict()
        data["severity"] = self.severity
        return data


# Feature Task: Especialización para nuevas funcionalidades
class FeatureTask(Task):
    def __init__(self, task_id, title, description, due_date=None, module="general", **kwargs):
        super().__init__(task_id, title, description, due_date=due_date, **kwargs)
        self.module = module

    def get_type(self):
        return TaskType.Feature

    def to_dict(self):
        data = super().to_dict()
        data["module"] = self.module
        return data


# Normal Task: Tarea simple sin atributos adicionales
class SimpleTask(Task):
    def __init__(self, task_id, title, description, due_date=None, **kwargs):
        super().__init__(task_id, title, description, due_date=due_date, **kwargs)

    def get_type(self):
        return TaskType.Task


# Improvement Task: Especialización para optimizaciones
class ImprovementTask(Task):
    def __init__(self, task_id, title, description, due_date=None, impact="medium", **kwargs):
        super().__init__(task_id, title, description, due_date=due_date, **kwargs)
        self.impact = impact

    def get_type(self):
        return TaskType.Improvement

    def to_dict(self):
        data = super().to_dict()
        data["impact"] = self.impact
        return data