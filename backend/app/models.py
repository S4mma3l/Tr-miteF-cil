# backend/app/models.py

from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

# --- Modelos para Empresa ---
class EmpresaCrear(BaseModel):
    nombre_comercial: str
    razon_social: str
    cedula_juridica: str
    telefono: Optional[str] = None

class EmpresaLeer(EmpresaCrear):
    id: int
    user_id: UUID
    created_at: str

# --- Modelos para Obligacion ---
class ObligacionBase(BaseModel):
    titulo: str
    fecha_vencimiento: str
    monto_estimado: Optional[float] = None
    frecuencia: Optional[str] = 'Única'
    completada: bool = False

class ObligacionCrear(ObligacionBase):
    empresa_id: int

class ObligacionLeer(ObligacionBase):
    id: int
    empresa_id: int
    user_id: UUID
    created_at: str

class ObligacionUpdate(BaseModel):
    titulo: Optional[str] = None
    fecha_vencimiento: Optional[str] = None
    monto_estimado: Optional[float] = None
    frecuencia: Optional[str] = None
    completada: Optional[bool] = None

# --- NUEVOS Modelos para el Dashboard ---

class ObligacionResumen(BaseModel):
    """
    Una vista simplificada de una obligación para mostrar en el dashboard.
    Incluye el nombre de la empresa a la que pertenece.
    """
    id: int
    titulo: str
    fecha_vencimiento: str
    monto_estimado: Optional[float] = None
    completada: bool
    # Supabase puede devolver un diccionario para las relaciones, ej: Empresa: {'nombre_comercial': 'Mi Tienda'}
    # Opcionalmente, podemos aplanarlo a un string simple como 'nombre_empresa' en el endpoint.
    Empresa: dict # Para capturar el nombre de la empresa

class DashboardSummary(BaseModel):
    """
    El modelo completo que representa toda la información del dashboard.
    """
    proximas_obligaciones: List[ObligacionResumen]
    obligaciones_vencidas: List[ObligacionResumen]
    total_estimado_mes: float = 0.0