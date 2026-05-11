from enum import Enum

class TaskType(Enum):
    Bug = "BUG"
    Feature = "FEATURE"
    Task = "TASK"
    Improvement = "IMPROVEMENT"


class PriorityTask(Enum):
    # Cambiados a valores técnicos para que coincidan con Swagger
    Low = "LOW"
    Medium = "MEDIUM"
    High = "HIGH"
    Urgent = "URGENT"


class TaskStatus(Enum):
    # Cambiados de "Por hacer" a "TO_DO" para que el constructor TaskStatus("TO_DO") funcione
    To_Do = "TO_DO"
    In_Progress = "IN_PROGRESS"
    On_Review = "ON_REVIEW"
    Done = "DONE"

# --- NUEVOS ENUMS PARA ABSTRACT FACTORY (TEMAS) ---

class ThemeType(Enum):
    LIGHT = "LIGHT"
    DARK = "DARK"

class StyleComponent(Enum):
    BACKGROUND = "background"
    TEXT_COLOR = "text_color"
    BORDER_STYLE = "border_style"
    ACCENT_COLOR = "accent_color"