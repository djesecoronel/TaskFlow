import os
import sys
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_restx import Api
from flask_cors import CORS

# Carga de entorno y rutas
load_dotenv()
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path: sys.path.insert(0, current_dir)

from modules.tasks.routes.task_routes import task_ns
from config.routes.db_routes import health_ns
from modules.auth.routes.auth_routes import auth_ns
# IMPORTACIÓN NUEVA: Asegúrate de tener este archivo creado
from modules.projects.routes.project_routes import project_ns 


app = Flask(__name__)

# FUNCIONALIDAD NUEVA: Configuración reforzada de CORS
# Permitimos explícitamente el origen del frontend y todos los métodos necesarios para PATCH/PUT
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

api = Api(app, version='1.0', title='TASKFLOW_API', prefix="")

api.add_namespace(task_ns, path='/api/tasks')
api.add_namespace(health_ns, path='/api/health')
api.add_namespace(auth_ns, path='/api/auth')
# FUNCIONALIDAD NUEVA: Registro del namespace de proyectos para resolver el 404
api.add_namespace(project_ns, path='/api/projects')

# FUNCIONALIDAD NUEVA: Manejador de errores global para diagnósticos rápidos
@app.errorhandler(Exception)
def handle_exception(e):
    print(f"❌ [BACKEND_ERROR]: {str(e)}")
    return jsonify({"error": "Error interno del servidor", "message": str(e)}), 500

@app.route('/')
def index():
    return jsonify({"message": "Backend Operativo"})

if __name__ == "__main__":
    # Forzamos escucha exclusiva en localhost
    app.run(debug=True, host='127.0.0.1', port=5000)