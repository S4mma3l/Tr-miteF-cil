// frontend/src/components/FormularioEmpresa.js

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const API_URL = 'http://127.0.0.1:8000';

function FormularioEmpresa({ onEmpresaCreada }) {
  const [nombreComercial, setNombreComercial] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [cedulaJuridica, setCedulaJuridica] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("No estás autenticado.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/empresas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nombre_comercial: nombreComercial,
          razon_social: razonSocial,
          cedula_juridica: cedulaJuridica,
        }),
      });

      // Si la respuesta no es 'ok' (ej: error 400, 500), leemos el error del backend
      if (!response.ok) {
        // response.json() lee el cuerpo del error, que contiene el "detail"
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo crear la empresa.');
      }
      
      // Si todo va bien, recargamos la lista y limpiamos el formulario
      onEmpresaCreada();
      setNombreComercial('');
      setRazonSocial('');
      setCedulaJuridica('');

    } catch (error) {
      // Mostramos el mensaje de error que capturamos
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article>
      <h3>Crear Nueva Empresa</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid">
            <input type="text" placeholder="Nombre Comercial" value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} required />
            <input type="text" placeholder="Razón Social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required />
        </div>
        <input type="text" placeholder="Cédula Jurídica" value={cedulaJuridica} onChange={(e) => setCedulaJuridica(e.target.value)} required />
        <button type="submit" aria-busy={loading}>Guardar Empresa</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </article>
  );
}

export default FormularioEmpresa;