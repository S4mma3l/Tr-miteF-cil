// Este archivo centraliza la URL de la API.
// Usará la variable de entorno en producción (Vercel),
// o la URL local si esa variable no existe.
export const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';