from flask_restx import Namespace, Resource
from flask import request
# IMPORTACIÓN NUEVA: Importamos el servicio ya configurado desde el módulo de tareas
from modules.tasks.routes.task_routes import service 

project_ns = Namespace('projects', description='Operaciones de Proyectos')

@project_ns.route('/<int:project_id>/tasks')
class ProjectTasks(Resource):
    def post(self, project_id):
        # Ahora 'service' está disponible y tiene los adaptadores/proxy configurados
        data = request.json
        # Delegamos al servicio centralizado para crear la tarea en el proyecto específico
        new_task = service.create_task_in_project(project_id, data)
        
        # EL FRONTEND ESPERA ESTO (El objeto tarea), no solo un mensaje de éxito
        return new_task, 201