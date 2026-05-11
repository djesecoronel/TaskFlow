import jwt
import bcrypt
import os
from datetime import datetime, timedelta, timezone
from modules.auth.repositories.auth_repository import AuthRepository

class AuthService:
    def __init__(self):
        self.repository = AuthRepository()
        # Clave secreta para JWT
        self.secret_key = os.getenv("JWT_SECRET", "TASKFLOW_SUPER_SECRET_2026")

    def authenticate(self, email, password):
        """Lógica central de autenticación con Debug"""
        user = self.repository.get_user_by_email(email)
        
        if not user:
            print(f"❌ [AUTH]: Usuario {email} no encontrado en la DB.")
            return None

        try:
            # DEBUG: Verificamos si la contraseña en la DB parece un hash de Bcrypt
            pw_hash = getattr(user, 'password_hash', None)
            if not pw_hash or not pw_hash.startswith('$'):
                print(f"⚠️ [AUTH]: La contraseña en la DB para {email} NO está hasheada. Bcrypt no puede validarla.")
                return None

            # Verificación de seguridad
            if bcrypt.checkpw(password.encode('utf-8'), pw_hash.encode('utf-8')):
                token = self._generate_token(user)
                return {"user": user.to_dict(), "token": token}
            
        except Exception as e:
            print(f"❌ [AUTH_ERROR]: Error durante checkpw: {e}")
            return None
        
        print(f"🔒 [AUTH]: Password incorrecto para {email}.")
        return None

    def _generate_token(self, user):
        """Genera un JWT firmado manejando el ID de forma flexible"""
        # Intentamos obtener el ID ya sea como user_id o como id (Supabase)
        uid = getattr(user, 'user_id', getattr(user, 'id', None))
        
        payload = {
            "sub": str(uid),
            "email": user.email,
            "role": getattr(user, 'role', 'DEVELOPER'),
            "exp": datetime.now(timezone.utc) + timedelta(hours=8)
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def register_user(self, email, password, name, role="DEVELOPER"):
        """Registra un nuevo usuario con hash de seguridad"""
        if self.repository.get_user_by_email(email):
            return {"error": "El email ya está registrado"}

        # Generar hash seguro
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        from modules.auth.models.user import User
        # Creamos el objeto con el hash, no con la clave plana
        new_user_obj = User(email=email, password_hash=hashed_pw, name=name, role=role)
        
        created_user = self.repository.create_user(new_user_obj)
        if created_user:
            return {"user": created_user.to_dict(), "token": self._generate_token(created_user)}
        return {"error": "Error al guardar usuario"}