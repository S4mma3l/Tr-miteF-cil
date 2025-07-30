# TrámiteFácil 🇨🇷

**Tu Asistente Inteligente para la Gestión de Obligaciones y Pymes en Costa Rica.**

TrámiteFácil es una aplicación web moderna (SaaS) diseñada para ayudar a freelancers, emprendedores y dueños de pequeñas y medianas empresas en Costa Rica a gestionar sus obligaciones recurrentes y fechas límite de manera sencilla y proactiva. Olvídate de las multas por olvido; TrámiteFácil te mantiene al día.

---

## ✨ Características Principales

* **🔐 Autenticación Segura de Usuarios**: Registro e inicio de sesión gestionados por Supabase, con plantillas de correo personalizadas.
* **🏢 Gestión Multi-Empresa**: Un solo usuario puede gestionar múltiples empresas o perfiles.
* **📋 Gestión de Obligaciones (CRUD)**: Crea, lee, actualiza y elimina obligaciones (impuestos, pagos, permisos) para cada empresa.
* **🔄 Obligaciones Recurrentes**: Marca una obligación como "mensual" y el sistema la creará automáticamente para el mes siguiente una vez completada. La lógica de "deshacer" también está implementada.
* **📊 Dashboard Inteligente**: Una vista principal que resume la información más crítica: obligaciones próximas a vencer, tareas vencidas y un total de gastos estimados del mes.
* **📧 Recordatorios Automáticos por Correo**: Un sistema automatizado que se ejecuta dos veces al día para enviar recordatorios por correo sobre las obligaciones que vencen en los próximos 3 días.
* **🚀 Interfaz Ultra Moderna y Responsiva**: Un diseño limpio, minimalista y agradable inspirado en las mejores prácticas de UI/UX, totalmente adaptable a dispositivos móviles.
* **☁️ Desplegado en la Nube**: Backend desplegado en Railway y frontend en Vercel para un rendimiento y escalabilidad óptimos.

---

## 🛠️ Pila Tecnológica (Tech Stack)

| Área | Tecnología |
| :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) |
| **Backend** | ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white) |
| **Base de Datos** | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) |
| **Estilos CSS** | ![Pico.css](https://img.shields.io/badge/Pico.css-1890FF?style=for-the-badge) CSS Personalizado |
| **Notificaciones** | ![SendGrid](https://img.shields.io/badge/SendGrid-2377E8?style=for-the-badge&logo=sendgrid&logoColor=white) |
| **Despliegue** | ![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white) ![Railway](https://img.shields.io/badge/railway-%230B0D12.svg?style=for-the-badge&logo=railway&logoColor=white) |

---

## ⚙️ Configuración y Puesta en Marcha Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 16 o superior)
* [Python](https://www.python.org/) (versión 3.10 o superior)
* Una cuenta de [Supabase](https://supabase.com/)
* Una cuenta de [SendGrid](https://sendgrid.com/)

### 1. Clonar el Repositorio
```bash
git clone [https://github.com/tu-usuario/tramitefacil.git](https://github.com/tu-usuario/tramitefacil.git)
cd tramitefacil

2. Configuración del Backend

    Navega a la carpeta del backend:
    Bash

cd backend

Crea y activa un entorno virtual:
Bash

# En Mac/Linux
python -m venv venv
source venv/bin/activate

# En Windows (CMD)
python -m venv venv
venv\Scripts\activate

Instala las dependencias:
Bash

pip install -r requirements.txt

Configura las variables de entorno:
Crea un archivo llamado .env dentro de la carpeta backend/ y añade tus claves secretas:
Fragmento de código

    SUPABASE_URL="la_url_de_tu_proyecto_supabase"
    SUPABASE_KEY="tu_clave_service_role_de_supabase"
    SENDGRID_API_KEY="tu_api_key_de_sendgrid"

3. Configuración del Frontend

    Navega a la carpeta del frontend (en una nueva terminal):
    Bash

cd frontend

Instala las dependencias:
Bash

npm install

Configura las variables de entorno:
Crea un archivo llamado .env.local dentro de la carpeta frontend/ y añade tus claves públicas de Supabase:
Fragmento de código

    REACT_APP_SUPABASE_URL="la_url_de_tu_proyecto_supabase"
    REACT_APP_SUPABASE_ANON_KEY="tu_clave_anon_public_de_supabase"

        Asegúrate de que tu archivo frontend/src/supabaseClient.js lea estas variables.

4. Ejecutar la Aplicación

Necesitarás dos terminales abiertas al mismo tiempo.

    En la Terminal 1 (Backend):
    Bash

# Dentro de la carpeta backend/ con el venv activado
uvicorn app.main:app --reload

En la Terminal 2 (Frontend):
Bash

    # Dentro de la carpeta frontend/
    npm start

La aplicación estará disponible en http://localhost:3000.

🚀 Despliegue

    El Backend está configurado para ser desplegado en Railway. Requiere un Procfile y la configuración del Root Directory en backend/.

    El Frontend está configurado para ser desplegado en Vercel. Requiere un archivo vercel.json para gestionar las rutas de la SPA.

Ambos despliegues se activan automáticamente al hacer git push a la rama principal.