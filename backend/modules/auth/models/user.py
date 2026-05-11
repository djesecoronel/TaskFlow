from datetime import datetime

class User:
    def __init__(self, email, password_hash, role="DEVELOPER", name=None, user_id=None, **kwargs):
        self.user_id = user_id
        self.email = email
        self.password_hash = password_hash
        self.role = role # ADMIN, PROJECT_MANAGER, DEVELOPER
        self.name = name or email.split('@')[0]
        self.avatar = kwargs.get("avatar", f"https://ui-avatars.com/api/?name={self.name}&background=random")
        self.created_at = kwargs.get("created_at", datetime.now().isoformat())
        self.last_access = kwargs.get("last_access", datetime.now().isoformat())

    def to_dict(self):
        """Serialización para el Frontend y JWT"""
        return {
            "user_id": self.user_id,
            "email": self.email,
            "role": self.role,
            "name": self.name,
            "avatar": self.avatar,
            "last_access": self.last_access
        }

    @staticmethod
    def from_db(data):
        """Patrón Factory para reconstruir el objeto desde Supabase"""
        if not data:
            return None
        return User(
            user_id=data.get("id"),
            email=data.get("email"),
            password_hash=data.get("password"),
            role=data.get("role"),
            name=data.get("name"),
            avatar=data.get("avatar"),
            created_at=data.get("created_at"),
            last_access=data.get("last_access")
        )