# backend/app/main.py

from fastapi import FastAPI, HTTPException, Request, Depends, Response
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from gotrue.errors import AuthApiError
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import date, timedelta, datetime

# --- NUEVAS IMPORTACIONES PARA RECORDATORIOS ---
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from .models import (
    EmpresaCrear, EmpresaLeer, ObligacionCrear, 
    ObligacionLeer, ObligacionUpdate, DashboardSummary, ObligacionResumen
)
from .settings import settings

# --- Configuración del Cliente de Supabase (sin cambios) ---
opts = ClientOptions(postgrest_client_timeout=10, storage_client_timeout=10)
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY, options=opts)

# --- Aplicación FastAPI (sin cambios) ---
app = FastAPI(title="TrámiteFácil API", version="1.0.0")

# --- Configuración de CORS (sin cambios) ---
origins = ["http://localhost:3000", "https://tr-mite-f-cil.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencia de Seguridad y Endpoints CRUD (sin cambios) ---
# ... (Todo tu código para get_current_user, empresas, y obligaciones se mantiene aquí)
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
    resp = supabase_client.table('Obligacion').select('id').eq('id', obligacion_id).eq('user_id', user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Obligación no encontrada o no pertenece al usuario.")
    try:
        update_dict = update_data.model_dump()
        data = supabase_client.table('Obligacion').update(update_dict).eq('id', obligacion_id).execute()
        return data.data[0]
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

# --- NUEVA LÓGICA DE RECORDATORIOS POR CORREO ---

async def enviar_recordatorios_diarios():
    print(f"[{datetime.now()}] Ejecutando tarea de envío de recordatorios...")
    today = date.today()
    limite_recordatorio = today + timedelta(days=7)

    try:
        resp = supabase_client.table('Obligacion').select('*, Empresa(nombre_comercial)').eq('completada', False).gte('fecha_vencimiento', today.isoformat()).lte('fecha_vencimiento', limite_recordatorio.isoformat()).execute()
        if not resp.data:
            print("No hay obligaciones próximas a vencer. Tarea finalizada.")
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

                html_content = "<h3>Hola,</h3><p>Tienes las siguientes obligaciones a punto de vencer:</p><ul>"
                for o in obligaciones:
                    # Usamos parse para convertir el string de fecha de nuevo a objeto date
                    fecha_obj = date.fromisoformat(o['fecha_vencimiento'])
                    # Ahora formateamos el objeto date
                    fecha_formateada = fecha_obj.strftime('%d de %B')
                    html_content += f"<li><strong>{o['titulo']}</strong> ({o['Empresa']['nombre_comercial']}) - Vence el <strong>{fecha_formateada}</strong></li>"
                html_content += "</ul><p>Inicia sesión en TrámiteFácil para gestionarlas.</p>"

                message = Mail(
                    from_email=('s4mma3l@pentestercr.com', 'Alertas TrámiteFácil'),
                    to_emails=email_usuario,
                    subject='Recordatorio de Obligaciones Pendientes',
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
    scheduler.add_job(
        enviar_recordatorios_diarios, 
        trigger=CronTrigger(hour=8, minute=0, timezone='America/Costa_Rica')
    )
    scheduler.start()
    print("Planificador de tareas iniciado. Los recordatorios se enviarán a las 8:00 AM (CST).")

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