# modules/tasks/reports/report_implementor.py
from abc import ABC, abstractmethod

# --- IMPLEMENTOR (La interfaz de implementación) ---
class ReportFormat(ABC):
    @abstractmethod
    def generate(self, data):
        pass

# --- CONCRETE IMPLEMENTORS (Las implementaciones específicas) ---
class PDFFormat(ReportFormat):
    def generate(self, data):
        # Aquí iría la lógica real de ReportLab o FPDF
        return {
            "status": "REPORTE_GENERADO",
            "format": "PDF",
            "message": f"Documento PDF creado con {len(data)} tareas.",
            "download_url": "/downloads/report.pdf"
        }

class ExcelFormat(ReportFormat):
    def generate(self, data):
        # Aquí iría la lógica real de Openpyxl o Pandas
        return {
            "status": "REPORTE_GENERADO",
            "format": "EXCEL",
            "message": f"Libro de Excel generado con {len(data)} filas.",
            "download_url": "/downloads/report.xlsx"
        }