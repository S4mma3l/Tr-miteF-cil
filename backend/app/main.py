# backend/app/main.py

from fastapi import FastAPI, HTTPException, Request, Depends, Response
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from gotrue.errors import AuthApiError
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import date, timedelta, datetime
from dateutil.relativedelta import relativedelta

# --- Importaciones para Recordatorios ---
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from .models import (
    EmpresaCrear, EmpresaLeer, ObligacionCrear, 
    ObligacionLeer, ObligacionUpdate, DashboardSummary, ObligacionResumen
)
from .settings import settings

# --- Configuración del Cliente de Supabase ---
opts = ClientOptions(postgrest_client_timeout=10, storage_client_timeout=10)
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY, options=opts)

# --- Aplicación FastAPI ---
app = FastAPI(title="TrámiteFácil API", version="1.0.0")

# --- Configuración de CORS ---
origins = [
    "http://localhost:3000",
    "https://tr-mite-f-cil.vercel.app" # Asegúrate que esta URL sea la correcta
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencia de Seguridad ---
async def get_current_user(request: Request):
    token = request.headers.get('authorization')
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = token.split(" ")[-1]
    try:
        user = supabase_client.auth.get_user(token)
        return user
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Endpoints de Empresa ---
@app.post("/empresas/", response_model=EmpresaLeer)
def crear_empresa(empresa: EmpresaCrear, user=Depends(get_current_user)):
    try:
        empresa_dict = empresa.model_dump()
        empresa_dict['user_id'] = str(user.user.id)
        data = supabase_client.table('Empresa').insert(empresa_dict).execute()
        return data.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/empresas/", response_model=List[EmpresaLeer])
def leer_empresas(user=Depends(get_current_user)):
    try:
        data = supabase_client.table('Empresa').select('*').eq('user_id', str(user.user.id)).execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Endpoints de Obligacion ---
@app.post("/obligaciones/", response_model=ObligacionLeer)
def crear_obligacion(obligacion: ObligacionCrear, user=Depends(get_current_user)):
    empresa_id = obligacion.empresa_id
    user_id = str(user.user.id)
    resp = supabase_client.table('Empresa').select('id').eq('id', empresa_id).eq('user_id', user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Empresa no encontrada o no pertenece al usuario.")
    try:
        obligacion_dict = obligacion.model_dump()
        obligacion_dict['user_id'] = user_id
        data = supabase_client.table('Obligacion').insert(obligacion_dict).execute()
        return data.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo crear la obligación. Verifique los datos.")

@app.get("/empresas/{empresa_id}/obligaciones/", response_model=List[ObligacionLeer])
def leer_obligaciones_de_empresa(empresa_id: int, user=Depends(get_current_user)):
    user_id = str(user.user.id)
    resp = supabase_client.table('Empresa').select('id').eq('id', empresa_id).eq('user_id', user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Empresa no encontrada o no pertenece al usuario.")
    try:
        data = supabase_client.table('Obligacion').select('*').eq('empresa_id', empresa_id).execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/obligaciones/{obligacion_id}", response_model=ObligacionLeer)
def actualizar_obligacion(obligacion_id: int, update_data: ObligacionUpdate, user=Depends(get_current_user)):
    user_id = str(user.user.id)
    
    resp = supabase_client.table('Obligacion').select('*').eq('id', obligacion_id).eq('user_id', user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Obligación no encontrada o no pertenece al usuario.")
    
    obligacion_actual = resp.data[0]

    try:
        update_dict = update_data.model_dump(exclude_unset=True) 
        data = supabase_client.table('Obligacion').update(update_dict).eq('id', obligacion_id).execute()
        obligacion_actualizada = data.data[0]

        if update_data.completada is True and obligacion_actual.get('frecuencia') == 'Mensual':
            fecha_actual = date.fromisoformat(obligacion_actual['fecha_vencimiento'])
            proxima_fecha = fecha_actual + relativedelta(months=1)
            nueva_obligacion = {
                'empresa_id': obligacion_actual['empresa_id'],
                'user_id': user_id,
                'titulo': obligacion_actual['titulo'],
                'fecha_vencimiento': proxima_fecha.isoformat(),
                'monto_estimado': obligacion_actual.get('monto_estimado'),
                'frecuencia': 'Mensual',
                'completada': False
            }
            supabase_client.table('Obligacion').insert(nueva_obligacion).execute()
            print(f"Creada obligación recurrente para {proxima_fecha.isoformat()}")

        elif update_data.completada is False and obligacion_actual.get('frecuencia') == 'Mensual':
            fecha_actual = date.fromisoformat(obligacion_actual['fecha_vencimiento'])
            proxima_fecha = fecha_actual + relativedelta(months=1)
            
            resp_siguiente = supabase_client.table('Obligacion').select('id') \
                .eq('titulo', obligacion_actual['titulo']) \
                .eq('empresa_id', obligacion_actual['empresa_id']) \
                .eq('user_id', user_id) \
                .eq('fecha_vencimiento', proxima_fecha.isoformat()) \
                .eq('completada', False) \
                .execute()

            if resp_siguiente.data:
                id_a_borrar = resp_siguiente.data[0]['id']
                supabase_client.table('Obligacion').delete().eq('id', id_a_borrar).execute()
                print(f"Eliminada obligación recurrente del {proxima_fecha.isoformat()}")

        return obligacion_actualizada
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo actualizar la obligación: {str(e)}")


@app.delete("/obligaciones/{obligacion_id}", status_code=204)
def eliminar_obligacion(obligacion_id: int, user=Depends(get_current_user)):
    user_id = str(user.user.id)
    resp = supabase_client.table('Obligacion').select('id').eq('id', obligacion_id).eq('user_id', user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Obligación no encontrada o no pertenece al usuario.")
    try:
        supabase_client.table('Obligacion').delete().eq('id', obligacion_id).execute()
        return Response(status_code=204)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo eliminar la obligación: {str(e)}")

@app.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(user=Depends(get_current_user)):
    user_id = str(user.user.id)
    today = date.today()
    try:
        proximas_vencimiento_limite = today + timedelta(days=30)
        proximas_resp = supabase_client.table('Obligacion').select('*, Empresa(nombre_comercial)').eq('user_id', user_id).eq('completada', False).gte('fecha_vencimiento', today.isoformat()).lte('fecha_vencimiento', proximas_vencimiento_limite.isoformat()).order('fecha_vencimiento', desc=False).limit(10).execute()
        proximas_obligaciones = proximas_resp.data
        vencidas_resp = supabase_client.table('Obligacion').select('*, Empresa(nombre_comercial)').eq('user_id', user_id).eq('completada', False).lt('fecha_vencimiento', today.isoformat()).order('fecha_vencimiento', desc=False).limit(10).execute()
        obligaciones_vencidas = vencidas_resp.data
        inicio_mes = today.replace(day=1)
        fin_mes = (inicio_mes.replace(month=inicio_mes.month % 12 + 1, day=1) - timedelta(days=1)) if inicio_mes.month != 12 else inicio_mes.replace(month=12, day=31)
        mes_actual_resp = supabase_client.table('Obligacion').select('monto_estimado').eq('user_id', user_id).gte('fecha_vencimiento', inicio_mes.isoformat()).lte('fecha_vencimiento', fin_mes.isoformat()).execute()
        total_estimado_mes = sum(item['monto_estimado'] for item in mes_actual_resp.data if item.get('monto_estimado') is not None)
        return DashboardSummary(proximas_obligaciones=proximas_obligaciones, obligaciones_vencidas=obligaciones_vencidas, total_estimado_mes=total_estimado_mes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el resumen del dashboard: {str(e)}")

# --- LÓGICA DE RECORDATORIOS POR CORREO (ACTUALIZADA) ---

async def enviar_recordatorios_diarios():
    print(f"[{datetime.now()}] Ejecutando tarea de envío de recordatorios...")
    today = date.today()
    # Rango ajustado a 3 días
    limite_recordatorio = today + timedelta(days=3)

    try:
        # Consulta ajustada a 3 días
        resp = supabase_client.table('Obligacion').select('*, Empresa(nombre_comercial)') \
            .eq('completada', False) \
            .gte('fecha_vencimiento', today.isoformat()) \
            .lte('fecha_vencimiento', limite_recordatorio.isoformat()) \
            .execute()

        if not resp.data:
            print(f"No hay obligaciones venciendo en los próximos {limite_recordatorio.day - today.day} días. Tarea finalizada.")
            return

        obligaciones_por_usuario = {}
        for obligacion in resp.data:
            user_id = obligacion['user_id']
            if user_id not in obligaciones_por_usuario:
                obligaciones_por_usuario[user_id] = []
            obligaciones_por_usuario[user_id].append(obligacion)
        
        print(f"Se encontraron obligaciones para {len(obligaciones_por_usuario)} usuario(s).")

        for user_id, obligaciones in obligaciones_por_usuario.items():
            try:
                user_info = supabase_client.auth.admin.get_user_by_id(user_id)
                email_usuario = user_info.user.email

                html_content = "<h3>Hola,</h3><p>Este es un recordatorio de tus próximas obligaciones:</p><ul>"
                for o in obligaciones:
                    fecha_obj = date.fromisoformat(o['fecha_vencimiento'])
                    fecha_formateada = fecha_obj.strftime('%d de %B')
                    html_content += f"<li><strong>{o['titulo']}</strong> ({o['Empresa']['nombre_comercial']}) - Vence el <strong>{fecha_formateada}</strong></li>"
                html_content += "</ul><p>Inicia sesión en TrámiteFácil para gestionarlas.</p>"

                message = Mail(
                    from_email=('s4mma3l@pentestercr.com', 'Alertas TrámiteFácil'),
                    to_emails=email_usuario,
                    subject='Recordatorio Urgente de Obligaciones Pendientes',
                    html_content=html_content)
                
                sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
                response = sendgrid_client.send(message)
                print(f"Correo enviado a {email_usuario}, Status: {response.status_code}")
            except Exception as e:
                print(f"Error al procesar/enviar correo para el usuario {user_id}: {e}")
    except Exception as e:
        print(f"Error al obtener las obligaciones de la base de datos: {e}")

# --- Planificador (Scheduler) ---
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    # Tarea programada para ejecutarse dos veces al día
    scheduler.add_job(
        enviar_recordatorios_diarios, 
        trigger=CronTrigger(hour='8,16', minute=0, timezone='America/Costa_Rica')
    )
    scheduler.start()
    print("Planificador de tareas iniciado. Los recordatorios se enviarán a las 8:00 AM y 4:00 PM (CST).")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("Planificador de tareas detenido.")

# --- Endpoint de prueba ---
@app.get("/test/enviar-recordatorios")
async def test_enviar_recordatorios():
    print("Iniciando envío de prueba manual...")
    await enviar_recordatorios_diarios()
    return {"status": "ok", "message": "Proceso de envío de recordatorios de prueba iniciado. Revisa la terminal del backend."}