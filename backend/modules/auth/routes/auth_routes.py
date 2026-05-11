from flask import request
from flask_restx import Namespace, Resource, fields
from modules.auth.services.auth_service import AuthService

auth_ns = Namespace('auth', description='Protocolos de Autenticación y Acceso al Nodo')

# Modelos de documentación para Swagger
login_model = auth_ns.model('Login', {
    'email': fields.String(required=True, description='Core Email del Operativo'),
    'password': fields.String(required=True, description='Security Key')
})

register_model = auth_ns.model('Register', {
    'email': fields.String(required=True),
    'password': fields.String(required=True),
    'name': fields.String(required=True),
    'role': fields.String(default='DEVELOPER')
})

service = AuthService()

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        """Autenticar operativo y generar token de sesión"""
        data = request.json
        result = service.authenticate(data.get('email'), data.get('password'))
        
        if result:
            return result, 200
        return {"message": "AUTHENTICATION_FAILED: Credenciales no reconocidas"}, 401

@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.expect(register_model)
    def post(self):
        """Dar de alta un nuevo operativo en el sistema"""
        data = request.json
        result = service.register_user(
            email=data.get('email'),
            password=data.get('password'),
            name=data.get('name'),
            role=data.get('role', 'DEVELOPER')
        )
        
        if "error" in result:
            return result, 400
        return result, 201