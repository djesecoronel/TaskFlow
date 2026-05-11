from abc import ABC, abstractmethod

class ITaskService(ABC):

    @abstractmethod
    def create_task(self, data):
        pass

    @abstractmethod
    def create_advanced_task(self, data):
        """Requerido por Patrón Builder"""
        pass

    @abstractmethod
    def get_task(self, task_id):
        pass

    @abstractmethod
    def get_all_tasks(self):
        """Requerido por Facade"""
        pass

    @abstractmethod
    def update_task(self, task_id, data):
        pass

    @abstractmethod
    def delete_task(self, task_id):
        pass

    @abstractmethod
    def move_task(self, task_id, column_id):
        pass

    @abstractmethod
    def add_comment(self, task_id, comment):
        pass

    @abstractmethod
    def add_time_log(self, task_id, hours):
        pass

    @abstractmethod
    def add_attachment(self, task_id, file):
        pass

    @abstractmethod
    def clone_task(self, task_id):
        """Requerido por Patrón Prototype"""
        pass

    @abstractmethod
    def get_deadline_hours(self, task_id):
        pass

    @abstractmethod
    def set_theme(self, theme_name):
        """Requerido por Abstract Factory"""
        pass

    @abstractmethod
    def add_notifier(self, notifier):
        """Requerido por Patrón Adapter"""
        pass

    @abstractmethod
    def _notify_all(self, title, message):
        """Requerido por Patrón Adapter"""
        pass

    @abstractmethod
    def generate_report(self, format_type):
        """Requerido por Patrón Bridge"""
        pass

    @abstractmethod
    def add_subtask(self, parent_id, subtask_data):
        """Requerido por Patrón Composite"""
        pass

    @abstractmethod
    def get_task_tree(self, task_id):
        """Requerido por Patrón Composite"""
        pass

    @abstractmethod
    def make_emergency_task(self, task_id):
        """Requerido por Patrón Decorator"""
        pass