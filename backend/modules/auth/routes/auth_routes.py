from flask import request
from flask_restx import Namespace, Resource, fields
from modules.auth.services.auth_service import AuthService

# Namespace con identidad visual de TaskFlow
auth_ns = Namespace('auth', description='Protocolos de Autenticación y Acceso al Nodo')

# --- MODELOS DE DOCUMENTACIÓN (SWAGGER/RESTX) ---

login_model = auth_ns.model('Login', {
    'email': fields.String(required=True, description='Core Email del Operativo', example="operativo@taskflow.com"),
    'password': fields.String(required=True, description='Security Key', example="********")
})

register_model = auth_ns.model('Register', {
    'email': fields.String(required=True, example="nuevo_agente@taskflow.com"),
    'password': fields.String(required=True, example="********"),
    'name': fields.String(required=True, example="OPERATIVO_DELTA"),
    'role': fields.String(default='DEVELOPER', example="DEVELOPER")
})

# Inicialización del servicio de identidad
service = AuthService()

# --- ENDPOINTS: GESTIÓN DE ACCESO ---

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        """
        Autenticar operativo y generar token de sesión.
        Valida las credenciales contra el Nodo Central.
        """
        data = request.json
        email = data.get('email')
        password = data.get('password')

        print(f"📡 [AUTH_LOGIN]: Intentando acceso para {email}...")
        
        result = service.authenticate(email, password)
        
        if result:
            print(f"✅ [AUTH_SUCCESS]: Token generado para {email}")
            return result, 200
            
        print(f"❌ [AUTH_FAILED]: Acceso denegado para {email}")
        return {"message": "AUTHENTICATION_FAILED: Credenciales no reconocidas"}, 401

@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.expect(register_model)
    def post(self):
        """
        Dar de alta un nuevo operativo en el sistema.
        Ejecuta el protocolo de persistencia doble: Auth + Base de Datos.
        """
        data = request.json
        email = data.get('email')
        
        print(f"🧬 [AUTH_REGISTER]: Iniciando protocolo de alta para {email}...")
        
        # El service.register_user ahora debe asegurar que el usuario 
        # se inserte en la tabla pública de usuarios/perfiles.
        result = service.register_user(
            email=email,
            password=data.get('password'),
            name=data.get('name'),
            role=data.get('role', 'DEVELOPER')
        )
        
        if "error" in result:
            print(f"⚠️ [REGISTER_ERROR]: {result.get('error')}")
            return result, 400
            
        print(f"✅ [REGISTER_COMPLETE]: Nuevo operativo registrado en el Nodo Central.")
        return result, 201