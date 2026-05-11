from flask import request
from flask_restx import Namespace, Resource, fields
from modules.tasks.services.tasks_service import TaskService
from modules.tasks.repository.task_repository import TaskRepository

# --- INTEGRACIÓN DE PATRONES ESTRUCTURALES ---
from modules.tasks.services.task_service_proxy import TaskServiceProxy
from modules.tasks.adapters.notification_adapter import EmailNotificationAdapter, SlackNotificationAdapter

# Definición del Namespace: Punto de entrada para el CORE_COMMAND
task_ns = Namespace('tasks', description='OPERACIONES DE TAREAS - CORE_COMMAND')

# --- CONFIGURACIÓN DE INYECCIÓN DE DEPENDENCIAS (PROXY LAYER) ---
# 1. Repositorio: Acceso a la persistencia
repository = TaskRepository()

# 2. Patrón Proxy: Único punto de contacto para las rutas.
# Maneja internamente al TaskService real para auditoría y validación.
service = TaskServiceProxy(repository) 

# 3. Patrón Adapter: Registro de notificadores externos
service.add_notifier(EmailNotificationAdapter())
service.add_notifier(SlackNotificationAdapter())

# --- MODELOS DE DATOS PARA DOCUMENTACIÓN (SWAGGER/RESTX) ---

task_model = task_ns.model('Task', {
    'title': fields.String(required=True, example="Implement login feature"),
    'description': fields.String(example="Create authentication using JWT"),
    'due_date': fields.String(required=True, example="2026-03-30T12:00:00"),
    'priority': fields.String(example="ALTA"),
    'type': fields.String(example="FEATURE")
})

advanced_task_model = task_ns.model('AdvancedTask', {
    'task_id': fields.String(required=True, example="uuid-string-from-supabase"),
    'type': fields.String(required=True, example="BUG"),
    'title': fields.String(required=True, example="Error crítico en checkout"),
    'description': fields.String(example="El botón de pago no responde"),
    'priority': fields.String(example="URGENTE"),
    'status': fields.String(example="Por hacer"),
    'due_date': fields.String(example="2026-05-20T18:00:00"),
    'comment': fields.String(example="Asignado a soporte nivel 2"),
    'attachment': fields.String(example="error_log.txt")
})

theme_model = task_ns.model('Theme', {
    'theme': fields.String(required=True, example="DARK", description="Opciones: LIGHT, DARK")
})

report_model = task_ns.model('ReportRequest', {
    'format': fields.String(required=True, example="pdf", description="Opciones: pdf, excel")
})

# Cambiamos column_id a String para soportar los títulos de las columnas del Kanban
move_model = task_ns.model('MoveTask', {'column_id': fields.String(required=True, example="En progreso")})
comment_model = task_ns.model('Comment', {'comment': fields.String(required=True, example="Needs review")})
time_model = task_ns.model('TimeLog', {'hours': fields.Float(required=True, example=3.5)})
attachment_model = task_ns.model('Attachment', {'file': fields.String(required=True, example="design.png")})

# --- AUXILIAR DE SERIALIZACIÓN ---
def serialize_task(task_data):
    """Asegura que los objetos de dominio se conviertan a JSON antes de enviarlos"""
    if hasattr(task_data, 'to_dict'):
        return task_data.to_dict()
    if isinstance(task_data, list):
        return [t.to_dict() if hasattr(t, 'to_dict') else t for t in task_data]
    return task_data

# --- ENDPOINTS: CONFIGURACIÓN GLOBAL Y PATRONES TRANSVERSALES ---

@task_ns.route('/theme')
class TaskTheme(Resource):
    @task_ns.expect(theme_model)
    def post(self):
        """Abstract Factory: Cambiar Tema Global del Sistema"""
        data = request.json
        theme_val = data.get('theme')
        
        # Log de entrada en ruta
        print(f"📡 [ROUTE_IN]: Petición de tema recibida: {theme_val}")
        return service.set_theme(theme_val), 200
    
@task_ns.route('/report')
class TaskReportResource(Resource):
    @task_ns.expect(report_model)
    def post(self):
        """Patrón Bridge: Generar Reporte desacoplado (PDF/Excel) vía Proxy"""
        data = request.json
        return service.generate_report(data.get('format', 'pdf')), 200

@task_ns.route('/test-notifications')
class TestNotification(Resource):
    def post(self):
        """Patrón Adapter: Probar conexión con servicios de terceros"""
        service._notify_all("SISTEMA_OPERATIVO", "Prueba de conexión exitosa.")
        return {"status": "NOTIFICACIONES_PROCESADAS", "active_adapters": 2}, 200

# --- ENDPOINTS: CRUD PRINCIPAL (AUDITADOS POR PROXY) ---

@task_ns.route('/')
class TaskList(Resource):
    def get(self):
        """Proxy Audit: Listar todas las unidades de trabajo"""
        tasks = service.get_all_tasks()
        return serialize_task(tasks), 200

    @task_ns.expect(task_model)
    def post(self):
        """Factory Method + Chain of Responsibility: Creación validada"""
        data = request.json
        result = service.create_task(data)
        return serialize_task(result), 201

@task_ns.route('/advanced')
class AdvancedTask(Resource):
    @task_ns.expect(advanced_task_model)
    def post(self):
        """Patrón Builder: Construcción paso a paso de tareas complejas"""
        data = request.json
        result = service.create_advanced_task(data)
        if not result:
            return {"error": "FALLO_CREACION_AVANZADA"}, 400
        return serialize_task(result), 201

# --- [CIRUGÍA DE RUTAS: CAMBIO DE <INT> A <STRING> PARA SOPORTE UUID] ---

@task_ns.route('/<string:id>')
class Task(Resource):
    def get(self, id):
        """Proxy Audit: Obtener detalle (Soporte UUID)"""
        task = service.get_task(id)
        if not task:
            return {"error": "UNIDAD_NO_ENCONTRADA"}, 404
        return serialize_task(task), 200

    @task_ns.expect(task_model)
    def put(self, id):
        """Actualizar datos persistidos de la tarea"""
        data = request.json
        task = service.update_task(id, data)
        if not task:
            return {"error": "FALLO_ACTUALIZACION"}, 404
        return serialize_task(task), 200

    def delete(self, id):
        """Proxy Security: Eliminación controlada del sistema"""
        success = service.delete_task(id)
        if not success:
            return {"error": "FALLO_ELIMINACION_O_ACCESO"}, 404
        return {"message": "SISTEMA_DEPURADO", "id": id}, 200

# --- OPERACIONES ESPECÍFICAS (PATRONES ESTRUCTURALES ADICIONALES) ---

@task_ns.route('/<string:id>/subtask')
class SubtaskResource(Resource):
    @task_ns.expect(task_model)
    def post(self, id):
        """Patrón Composite: Vincular jerarquía de subtareas"""
        data = request.json
        result = service.add_subtask(id, data)
        if not result:
            return {"error": "ERROR_VINCULACION_SUBTAREA"}, 404
        return serialize_task(result), 201

@task_ns.route('/<string:id>/tree')
class TaskTreeResource(Resource):
    def get(self, id):
        """Patrón Composite: Reconstrucción del árbol jerárquico"""
        tree = service.get_task_tree(id)
        if not tree:
            return {"error": "ERROR_RECONSTRUCCION_ARBOL"}, 404
        return serialize_task(tree), 200

@task_ns.route('/<string:id>/emergency')
class EmergencyTaskResource(Resource):
    def post(self, id):
        """Patrón Decorator: Elevación dinámica a nivel Emergencia"""
        task = service.make_emergency_task(id)
        if not task:
            return {"error": "ERROR_DECORACION_EMERGENCIA"}, 404
        return serialize_task(task), 200

@task_ns.route('/<string:id>/move')
class MoveTask(Resource):
    @task_ns.expect(move_model)
    def post(self, id):
        """Kanban Logic: Movimiento entre columnas de estado (Soporte UUID)"""
        data = request.json
        # Delegamos al service.move_task que ya maneja la traducción de Enums
        task = service.move_task(id, data["column_id"])
        if not task:
            return {"error": "ERROR_MOVIMIENTO_NODO_CENTRAL"}, 404
        return serialize_task(task), 200

@task_ns.route('/<string:id>/comment')
class CommentTask(Resource):
    @task_ns.expect(comment_model)
    def post(self, id):
        """Registro de Auditoría: Añadir comentarios a la tarea"""
        data = request.json
        task = service.add_comment(id, data["comment"])
        if not task:
            return {"error": "ERROR_COMENTARIO"}, 404
        return serialize_task(task), 200

@task_ns.route('/<string:id>/timelog')
class TimeLogTask(Resource):
    @task_ns.expect(time_model)
    def post(self, id):
        """Métricas: Registro de carga horaria operativa"""
        data = request.json
        task = service.add_time_log(id, data["hours"])
        if not task:
            return {"error": "ERROR_TIMELOG"}, 404
        return serialize_task(task), 200

@task_ns.route('/<string:id>/attachment')
class AttachmentTask(Resource):
    @task_ns.expect(attachment_model)
    def post(self, id):
        """Gestión de Adjuntos: Delegación al modelo de dominio"""
        data = request.json
        task = service.add_attachment(id, data["file"])
        if not task:
            return {"error": "ERROR_ADJUNTO"}, 404
        return serialize_task(task), 200

@task_ns.route('/<string:id>/clone')
class CloneTask(Resource):
    def post(self, id):
        """Patrón Prototype: Clonación profunda de unidad de trabajo"""
        task = service.clone_task(id)
        if not task:
            return {"error": "ERROR_CLONACION"}, 404
        return serialize_task(task), 201

@task_ns.route('/<string:id>/deadline')
class DeadlineTask(Resource):
    def get(self, id):
        """Cálculo Dinámico: Tiempo restante para entrega"""
        hours = service.get_deadline_hours(id)
        if hours is None:
            return {"error": "ERROR_DEADLINE"}, 404
        return {"hours_remaining": hours}, 200