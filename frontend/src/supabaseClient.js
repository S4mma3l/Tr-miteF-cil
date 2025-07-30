// frontend/src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// ¡IMPORTANTE! En un proyecto real, estas claves deben estar en variables de entorno.
// Para React, se usa un archivo .env con variables que empiezan con REACT_APP_
const supabaseUrl = 'https://kcvqttmdimryybpvmcmx.supabase.co'; // Pega tu URL aquí
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdnF0dG1kaW1yeXlicHZtY214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTkzMjEsImV4cCI6MjA2OTI5NTMyMX0.eoz2xcV-344GPO28wQwKNbg3mzojIalOxc5jT5sPFkE'; // Pega tu Key aquí

export const supabase = createClient(supabaseUrl, supabaseAnonKey);