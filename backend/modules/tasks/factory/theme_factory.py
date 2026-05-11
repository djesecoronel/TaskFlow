from abc import ABC, abstractmethod
from modules.tasks.models.enum import ThemeType

# =========================================================
# PRODUCTOS ABSTRACTOS (Interfaces de Estilo)
# =========================================================
class VisualStyle(ABC):
    @abstractmethod
    def get_colors(self):
        """Retorna el esquema de colores del tema"""
        pass

    @abstractmethod
    def get_component_styles(self):
        """Retorna estilos específicos para componentes (bordes, sombras)"""
        pass

# =========================================================
# PRODUCTOS CONCRETOS (Implementaciones por Tema)
# =========================================================

class LightStyle(VisualStyle):
    def get_colors(self):
        return {
            "background": "#FFFFFF",
            "text": "#333333",
            "accent": "#007BFF",  # Azul profesional
            "secondary_text": "#666666"
        }
    
    def get_component_styles(self):
        return {
            "border": "1px solid #E0E0E0",
            "shadow": "0 2px 4px rgba(0,0,0,0.1)",
            "card_bg": "#F8F9FA"
        }

class DarkStyle(VisualStyle):
    def get_colors(self):
        return {
            "background": "#121212",
            "text": "#FFFFFF",
            "accent": "#BB86FC",  # Morado neón/vibrante
            "secondary_text": "#B0B0B0"
        }
    
    def get_component_styles(self):
        return {
            "border": "1px solid #333333",
            "shadow": "0 4px 6px rgba(0,0,0,0.5)",
            "card_bg": "#1E1E1E"
        }

# =========================================================
# ABSTRACT FACTORY (La Interfaz Maestra)
# =========================================================
class ThemeFactory(ABC):
    @abstractmethod
    def create_style(self) -> VisualStyle:
        pass

# =========================================================
# FÁBRICAS CONCRETAS
# =========================================================

class LightThemeFactory(ThemeFactory):
    def create_style(self) -> VisualStyle:
        return LightStyle()

class DarkThemeFactory(ThemeFactory):
    def create_style(self) -> VisualStyle:
        return DarkStyle()

# =========================================================
# PROVEEDOR DE FÁBRICAS (Selector Global)
# =========================================================
class ThemeFactoryProvider:
    """
    Punto de acceso único para obtener la fábrica correcta 
    basada en el tipo de tema.
    """
    _factories = {
        ThemeType.LIGHT.value: LightThemeFactory(),
        ThemeType.DARK.value: DarkThemeFactory()
    }

    @staticmethod
    def get_factory(theme_type: str) -> ThemeFactory:
        # Por defecto devolvemos Light si el tipo no existe
        return ThemeFactoryProvider._factories.get(theme_type, LightThemeFactory())