from abc import ABC, abstractmethod
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from openpyxl import Workbook
from datetime import datetime

# --- IMPLEMENTOR (La interfaz de implementación) ---
class ReportFormat(ABC):
    @abstractmethod
    def generate(self, data):
        pass

# --- CONCRETE IMPLEMENTOR A: MOTOR PDF (ReportLab) ---
class PDFFormat(ReportFormat):
    def generate(self, data):
        """Genera un flujo binario de PDF en memoria"""
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Estética de Cabecera
        c.setFont("Helvetica-Bold", 18)
        c.drawString(50, 750, "TASKFLOW - REPORTE OPERATIVO")
        c.setFont("Helvetica", 10)
        c.drawString(50, 735, f"Fecha de generación: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        c.line(50, 730, 550, 730)

        # Listado de Tareas
        y = 700
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Lista de Unidades de Trabajo:")
        y -= 20
        
        c.setFont("Helvetica", 10)
        for task in data:
            if y < 50: # Salto de página preventivo
                c.showPage()
                y = 750
            
            title = task.get('title', 'SIN_TITULO')
            status = task.get('status', 'N/A')
            priority = task.get('priority', 'MEDIA')
            
            line = f"• [{status}] {title} - PRIORIDAD: {priority}"
            c.drawString(60, y, line)
            y -= 15

        c.save()
        buffer.seek(0)
        return buffer

# --- CONCRETE IMPLEMENTOR B: MOTOR EXCEL (OpenPyXL) ---
class ExcelFormat(ReportFormat):
    def generate(self, data):
        """Genera un flujo binario de Excel en memoria"""
        buffer = io.BytesIO()
        wb = Workbook()
        ws = wb.active
        ws.title = "TASKFLOW_DATA"

        # Estilo de Cabeceras
        headers = ["ID", "TÍTULO", "ESTADO", "PRIORIDAD", "TIPO"]
        ws.append(headers)

        # Inyección de Datos (Celdas)
        for task in data:
            ws.append([
                str(task.get('id', task.get('task_id', 'N/A'))),
                task.get('title', ''),
                task.get('status', ''),
                task.get('priority', ''),
                task.get('type', '')
            ])

        wb.save(buffer)
        buffer.seek(0)
        return buffer

# --- ABSTRACCIÓN REFINADA (El Bridge en sí) ---
class DetailedTaskReport:
    def __init__(self, implementor: ReportFormat):
        self.implementor = implementor

    def run(self, data):
        # El Puente: Conecta la solicitud con la implementación binaria
        return self.implementor.generate(data)