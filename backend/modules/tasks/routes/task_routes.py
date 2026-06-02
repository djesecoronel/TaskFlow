from flask import request, send_file
from flask_restx import Namespace, Resource, fields
from modules.tasks.services.tasks_service import TaskService
from modules.tasks.repository.task_repository import TaskRepository

# --- INTEGRACIÓN DE PATRONES ESTRUCTURALES ---
from modules.tasks.services.task_service_proxy import TaskServiceProxy
from modules.tasks.adapters.notification_adapter import EmailNotificationAdapter, SlackNotificationAdapter
from modules.tasks.facade.task_facade import TaskFacade

# --- INFRAESTRUCTURA DEL PATRÓN COMMAND ---
from abc import ABC, abstractmethod

class ICommand(ABC):
    @abstractmethod
    def execute(self):
        pass

class CreateTaskCommand(ICommand):
    def __init__(self, facade, data):
        self.facade = facade
        self.data = data
    def execute(self):
        sanitized_data = {k: v for k, v in self.data.items() if v is not None}
        return self.facade.execute_create_task(sanitized_data, sanitized_data.get('assigned_to'))

class DeleteTaskCommand(ICommand):
    def __init__(self, service, task_id):
        self.service = service
        self.task_id = task_id
    def execute(self):
        return self.service.delete_task(self.task_id)

class MoveTaskCommand(ICommand):
    def __init__(self, service, task_id, column_id):
        self.service = service
        self.task_id = task_id
        self.column_id = column_id
    def execute(self):
        return self.service.move_task(self.task_id, self.column_id)

class CloneTaskCommand(ICommand):
    def __init__(self, service, task_id):
        self.service = service
        self.task_id = task_id
    def execute(self):
        return self.service.clone_task(self.task_id)

# --- NUEVA FUNCIONALIDAD: Comando de Actualización para sincronización real ---
class UpdateTaskCommand(ICommand):
    def __init__(self, service, task_id, data):
        self.service = service
        self.task_id = task_id
        self.data = data
    def execute(self):
        return self.service.update_task(self.task_id, self.data)

class CommandInvoker:
    def __init__(self):
        self._history = []
    def execute_command(self, command: ICommand):
        self._history.append(command)
        try:
            return command.execute()
        except Exception as e:
            print(f"❌ [COMMAND_INVOKER_ERROR]: {str(e)}")
            return None

command_invoker = CommandInvoker()

# --- NUEVA FUNCIONALIDAD: INFRAESTRUCTURA DEL PATRÓN STRATEGY ---
class INotificationStrategy(ABC):
    @abstractmethod
    def process_notifications(self, data, service):
        pass

class HighUrgencyStrategy(INotificationStrategy):
    def process_notifications(self, data, service):
        for notifier in service._notifiers if hasattr(service, '_notifiers') else []:
            notifier.send(f"ALERTA CRÍTICA: '{data.get('title')}'", data.get('assigned_to', 'Global'))

class StandardStrategy(INotificationStrategy):
    def process_notifications(self, data, service):
        pass

class NotificationContext:
    def __init__(self):
        self._strategy = None
    def execute_strategy(self, data, service):
        if data.get('type') == 'BUG' or data.get('priority') in ['ALTA', 'URGENTE']:
            self._strategy = HighUrgencyStrategy()
        else:
            self._strategy = StandardStrategy()
        self._strategy.process_notifications(data, service)

notification_context = NotificationContext()

task_ns = Namespace('tasks', description='OPERACIONES DE TAREAS - CORE_COMMAND')
repository = TaskRepository()
service = TaskServiceProxy(repository) 
service.add_notifier(EmailNotificationAdapter())
service.add_notifier(SlackNotificationAdapter())
facade = TaskFacade(service)

project_ns = Namespace('projects', description='Operaciones de Proyectos')

@project_ns.route('/<int:project_id>/tasks')
class ProjectTasks(Resource):
    def post(self, project_id):
        data = request.json
        # --- [ESCUDO DE SEGURIDAD CONTRA DUPLICIDAD HUÉRFANA] ---
        if not project_id:
            return {"error": "Invalid project context"}, 400
        result = service.create_task_in_project(project_id, data)
        return result, 201

task_model = task_ns.model('Task', {
    'title': fields.String(required=True),
    'description': fields.String(),
    'due_date': fields.String(),
    'priority': fields.String(),
    'type': fields.String()
})

advanced_task_model = task_ns.model('AdvancedTask', {
    'task_id': fields.String(required=True),
    'type': fields.String(required=True),
    'title': fields.String(required=True),
    'description': fields.String(),
    'priority': fields.String(),
    'status': fields.String(),
    'due_date': fields.String(),
    'comment': fields.String(),
    'attachment': fields.String()
})

theme_model = task_ns.model('Theme', {'theme': fields.String(required=True)})
report_model = task_ns.model('ReportRequest', {'format': fields.String(required=True)})
notification_test_model = task_ns.model('NotificationRequest', {'task_id': fields.String(), 'recipient': fields.String(), 'trigger': fields.String()})
move_model = task_ns.model('MoveTask', {'column_id': fields.String(required=True)})
comment_model = task_ns.model('Comment', {'comment': fields.String(required=True)})
time_model = task_ns.model('TimeLog', {'hours': fields.Float(required=True)})
attachment_model = task_ns.model('Attachment', {'file': fields.String(required=True)})

def serialize_task(task_data):
    if hasattr(task_data, 'to_dict'): return task_data.to_dict()
    if isinstance(task_data, list): return [t.to_dict() if hasattr(t, 'to_dict') else t for t in task_data]
    return task_data

@task_ns.route('/theme')
class TaskTheme(Resource):
    @task_ns.expect(theme_model)
    def post(self):
        return service.set_theme(request.json.get('theme')), 200
    
@task_ns.route('/report')
class TaskReportResource(Resource):
    @task_ns.expect(report_model)
    def post(self):
        format_type = request.json.get('format', 'pdf').lower()
        report_data = service.generate_report(format_type)
        if not report_data: return {"error": "FALLO_GENERACION"}, 500
        return send_file(report_data, mimetype='application/pdf', as_attachment=True, download_name=f"Report.{format_type}")

@task_ns.route('/test-notifications')
class TestNotification(Resource):
    @task_ns.expect(notification_test_model)
    def post(self):
        data = request.json
        return service.notify_and_log(data.get('task_id'), data.get('recipient')), 200

@task_ns.route('/')
class TaskList(Resource):
    def get(self):
        return serialize_task(facade.fetch_all_tasks()), 200

    @task_ns.expect(task_model)
    def post(self):
        data = request.json
        # --- [PREVENCIÓN DE TAREAS HUÉRFANAS] ---
        if not data.get('project_id'):
            return {"error": "Project ID required"}, 400
        if not data.get('type'): data['type'] = 'TASK'
        cmd = CreateTaskCommand(facade, data)
        result = command_invoker.execute_command(cmd)
        notification_context.execute_strategy(data, service)
        return serialize_task(result), 201 if result else 500

@task_ns.route('/advanced')
class AdvancedTask(Resource):
    @task_ns.expect(advanced_task_model)
    def post(self):
        result = service.create_advanced_task(request.json)
        return serialize_task(result), 201 if result else 400

@task_ns.route('/<string:id>')
class Task(Resource):
    def options(self, id):
        return {}, 200
        
    def get(self, id):
        task = service.get_task(id)
        return serialize_task(task), 200 if task else 404

    @task_ns.expect(task_model)
    def patch(self, id):
        cmd = UpdateTaskCommand(service, id, request.json)
        result = command_invoker.execute_command(cmd)
        return serialize_task(result), 200 if result else 404

    @task_ns.expect(task_model)
    def put(self, id):
        cmd = UpdateTaskCommand(service, id, request.json)
        result = command_invoker.execute_command(cmd)
        return serialize_task(result), 200 if result else 404

    def delete(self, id):
        result = command_invoker.execute_command(DeleteTaskCommand(service, id))
        return {"message": "PURGE_COMPLETE" if result else "PURGE_FAILED"}, 200 if result else 400

@task_ns.route('/<string:id>/subtask')
class SubtaskResource(Resource):
    @task_ns.expect(task_model)
    def post(self, id):
        return serialize_task(service.add_subtask(id, request.json)), 201

@task_ns.route('/<string:id>/tree')
class TaskTreeResource(Resource):
    def get(self, id):
        return serialize_task(service.get_task_tree(id)), 200

@task_ns.route('/<string:id>/emergency')
class EmergencyTaskResource(Resource):
    def post(self, id):
        return serialize_task(service.make_emergency_task(id)), 200

@task_ns.route('/<string:id>/move')
class MoveTask(Resource):
    @task_ns.expect(move_model)
    def post(self, id):
        cmd = MoveTaskCommand(service, id, request.json["column_id"])
        result = command_invoker.execute_command(cmd)
        return serialize_task(result), 200 if result else 404

@task_ns.route('/<string:id>/comment')
class CommentTask(Resource):
    @task_ns.expect(comment_model)
    def post(self, id):
        return serialize_task(service.add_comment(id, request.json["comment"])), 200

@task_ns.route('/<string:id>/timelog')
class TimeLogTask(Resource):
    @task_ns.expect(time_model)
    def post(self, id):
        return serialize_task(service.add_time_log(id, request.json["hours"])), 200

@task_ns.route('/<string:id>/attachment')
class AttachmentTask(Resource):
    @task_ns.expect(attachment_model)
    def post(self, id):
        return serialize_task(service.add_attachment(id, request.json["file"])), 200

@task_ns.route('/<string:id>/clone')
class CloneTask(Resource):
    def post(self, id):
        cmd = CloneTaskCommand(service, id)
        result = command_invoker.execute_command(cmd)
        return serialize_task(result), 201 if result else 404

@task_ns.route('/<string:id>/deadline')
class DeadlineTask(Resource):
    def get(self, id):
        hours = service.get_deadline_hours(id)
        return {"hours_remaining": hours}, 200 if hours is not None else 404