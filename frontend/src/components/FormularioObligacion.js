// frontend/src/components/FormularioObligacion.js

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { API_URL } from '../config';

// const API_URL = 'http://127.0.0.1:8000';

function FormularioObligacion({ empresaId, onObligacionCreada }) {
  const [titulo, setTitulo] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [montoEstimado, setMontoEstimado] = useState('');
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

    const nuevaObligacion = {
      empresa_id: empresaId,
      titulo: titulo,
      fecha_vencimiento: fechaVencimiento,
      monto_estimado: montoEstimado ? parseFloat(montoEstimado) : null,
    };

    try {
      const response = await fetch(`${API_URL}/obligaciones/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(nuevaObligacion),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo crear la obligación.');
      }
      
      onObligacionCreada();
      setTitulo('');
      setFechaVencimiento('');
      setMontoEstimado('');

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="mt-2">
      <h4>Añadir Nueva Obligación</h4>
      <form onSubmit={handleSubmit}>
        <label htmlFor="titulo">Título</label>
        <input 
          type="text" 
          id="titulo"
          name="titulo"
          placeholder="Ej: Pago de IVA" 
          value={titulo} 
          onChange={(e) => setTitulo(e.target.value)} 
          required 
        />
        
        <div className="grid">
          <label htmlFor="fecha">
            Fecha de Vencimiento
            <input 
              type="date"
              id="fecha"
              name="fecha" 
              value={fechaVencimiento} 
              onChange={(e) => setFechaVencimiento(e.target.value)} 
              required 
            />
          </label>
          <label htmlFor="monto">
            Monto Estimado (Opcional)
            <input 
              type="number"
              id="monto"
              name="monto" 
              placeholder="Ej: 50000" 
              value={montoEstimado} 
              onChange={(e) => setMontoEstimado(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" aria-busy={loading}>
          Guardar Obligación
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </article>
  );
}

export default FormularioObligacion;