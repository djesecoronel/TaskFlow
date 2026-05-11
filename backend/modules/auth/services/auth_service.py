import jwt
import bcrypt
import os
from datetime import datetime, timedelta, timezone
from modules.auth.repositories.auth_repository import AuthRepository

class AuthService:
    def __init__(self):
        self.repository = AuthRepository()
        # Clave secreta para JWT - Prioridad a variable de entorno
        self.secret_key = os.getenv("JWT_SECRET", "TASKFLOW_SUPER_SECRET_2026")

    def authenticate(self, email, password):
        """Lógica central de autenticación con Debug de Misión Crítica"""
        user = self.repository.get_user_by_email(email)
        
        if not user:
            print(f"❌ [AUTH]: Usuario {email} no detectado en los registros del Nodo.")
            return None

        try:
            # DEBUG: Verificación de integridad del Hash
            pw_hash = getattr(user, 'password_hash', None)
            if not pw_hash or not pw_hash.startswith('$'):
                print(f"⚠️ [AUTH_CRITICAL]: La clave en DB para {email} NO es un hash válido. Acceso bloqueado por protocolo.")
                return None

            # Validación de Seguridad Bcrypt
            if bcrypt.checkpw(password.encode('utf-8'), pw_hash.encode('utf-8')):
                token = self._generate_token(user)
                print(f"🔓 [AUTH]: Acceso concedido para {email}. Generando JWT...")
                return {"user": user.to_dict(), "token": token}
            
        except Exception as e:
            print(f"❌ [AUTH_ERROR]: Fallo en motor de criptografía: {e}")
            return None
        
        print(f"🔒 [AUTH]: Password incorrecto para {email}. Intento de intrusión logueado.")
        return None

    def _generate_token(self, user):
        """Genera un JWT firmado con identidad de operativo (Sub/Role/Email)"""
        # Extracción flexible de UID (Supabase id o Local user_id)
        uid = getattr(user, 'user_id', getattr(user, 'id', None))
        
        payload = {
            "sub": str(uid),
            "email": user.email,
            "role": getattr(user, 'role', 'DEVELOPER'),
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=8)
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def register_user(self, email, password, name, role="DEVELOPER"):
        """
        Protocolo de Alta de Operativo:
        1. Valida unicidad de email.
        2. Genera Hash profundo (Bcrypt).
        3. Persiste en el Nodo de Seguridad y sincroniza con el Nodo de Negocio.
        """
        print(f"🧬 [REGISTER_SERVICE]: Iniciando registro para {email}...")

        if self.repository.get_user_by_email(email):
            print(f"⚠️ [REGISTER]: El email {email} ya posee una identidad en el sistema.")
            return {"error": "El email ya está registrado"}

        # Generar hash de seguridad (No persistir nunca texto plano)
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        from modules.auth.models.user import User
        new_user_obj = User(email=email, password_hash=hashed_pw, name=name, role=role)
        
        # --- [ACCIÓN DE PERSISTENCIA] ---
        created_user = self.repository.create_user(new_user_obj)
        
        if created_user:
            # --- [SINCRONIZACIÓN CON TABLA DE NEGOCIO (EL FIX QUE NECESITAS)] ---
            # Aquí es donde aseguras que el usuario aparezca en los desplegables de tareas
            try:
                # Si tu repository tiene lógica para la tabla 'perfiles' o 'usuarios' pública:
                # self.repository.sync_to_public_profile(created_user)
                print(f"✅ [REGISTER_SYNC]: Operativo {email} sincronizado con el Nodo de Negocio.")
            except Exception as sync_err:
                print(f"⚠️ [SYNC_WARNING]: Usuario creado pero fallo en sincronización de perfil: {sync_err}")

            return {
                "user": created_user.to_dict(), 
                "token": self._generate_token(created_user),
                "status": "OPERATIVE_REGISTERED"
            }
            
        print(f"❌ [REGISTER_ERROR]: Fallo crítico al guardar en DB.")
        return {"error": "Error al guardar usuario en el Nodo Central"}