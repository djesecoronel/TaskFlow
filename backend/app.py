import os
import sys
from dotenv import load_dotenv

# --- [FIX CRÍTICO: REPARACIÓN DE RUTAS DEL NODO] ---
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
# --------------------------------------------------

# 1. Carga de configuración de entorno
load_dotenv()

from flask import Flask
from flask_restx import Api
from flask_cors import CORS

# --- [INYECCIÓN DE COMPONENTES CORE] ---
from modules.tasks.repository.task_repository import TaskRepository
from modules.tasks.services.tasks_service import TaskService
from modules.tasks.services.task_service_proxy import TaskServiceProxy
from modules.tasks.facade.task_facade import TaskFacade  # <--- NUEVO: PATRÓN FACADE

# 2. Importación de Namespaces
from modules.tasks.routes.task_routes import task_ns
from config.routes.db_routes import health_ns
from modules.auth.routes.auth_routes import auth_ns 

# 3. Inicialización de la Aplicación
app = Flask(__name__)

# --- [INICIALIZACIÓN DE LA ESTRUCTURA MAESTRA] ---
# Creamos la cadena de mando: Repository -> Service -> Proxy -> FACADE
task_repo = TaskRepository()
base_service = TaskService(task_repo)
task_proxy = TaskServiceProxy(task_repo)  # El proxy envuelve al servicio real
# El Facade unifica el acceso para las rutas
task_facade = TaskFacade(task_proxy)

# --- [FIX: PROTOCOLO DE ACCESO MULTI-ORIGEN TOTAL] ---
# Hemos expandido los métodos para incluir PATCH (necesario en actualizaciones parciales)
# y configurado soporte de credenciales por si escalas a Cookies/Sessions.
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # En desarrollo, permitimos acceso global para evitar fallos de IP
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
        "expose_headers": ["Content-Type", "Authorization"]
    }
})

# 4. Configuración de la API (Patrón Facade de Documentación)
api = Api(
    app, 
    version='1.0', 
    title='TASKFLOW_OPERATIVE_API',
    description='Sistema de gestión de tareas con arquitectura de patrones de diseño',
    doc="/docs",
    prefix="" # Evitamos duplicidad de prefijos si ya están en los Namespaces
)

# 5. Registro de Módulos (Rutas del Sistema Central)
# Nota: El path aquí define el prefijo base para cada módulo
api.add_namespace(task_ns, path='/api/tasks')
api.add_namespace(health_ns, path='/api/health')
api.add_namespace(auth_ns, path='/api/auth')

# --- [MIDDLEWARE DE LOGGING DE PROTOCOLO] ---
@app.after_request
def after_request(response):
    """Asegura que cada respuesta lleve los headers de control de acceso"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    return response

if __name__ == "__main__":
    print("--------------------------------------------------")
    print(">>> INICIANDO NODO_CENTRAL: STATUS_OPERATIVO")
    print(">>> ARQUITECTURA: FACADE_PATTERN_LOADED")
    print(">>> PROTOCOLO: HTTP/RESTX")
    print(">>> ESCUCHANDO EN: 0.0.0.0:5000")
    print("--------------------------------------------------")
    
    # Escuchamos en 0.0.0.0 para acceso universal en la red local
    app.run(
        debug=True, 
        host='0.0.0.0', 
        port=5000
    )