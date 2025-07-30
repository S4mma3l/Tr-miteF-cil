// frontend/src/components/FormularioObligacion.js

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { API_URL } from '../config';

function FormularioObligacion({ empresaId, onObligacionCreada }) {
  const [titulo, setTitulo] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [montoEstimado, setMontoEstimado] = useState('');
  const [frecuencia, setFrecuencia] = useState('Única'); // Nuevo estado
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const promise = fetch(`${API_URL}/obligaciones/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
      },
      body: JSON.stringify({
        empresa_id: empresaId,
        titulo: titulo,
        fecha_vencimiento: fechaVencimiento,
        monto_estimado: montoEstimado ? parseFloat(montoEstimado) : null,
        frecuencia: frecuencia, // Se envía la frecuencia a la API
      }),
    });

    toast.promise(promise, {
      loading: 'Guardando obligación...',
      success: (response) => {
        if (!response.ok) throw new Error('No se pudo crear la obligación.');
        onObligacionCreada();
        // Limpiar formulario
        setTitulo('');
        setFechaVencimiento('');
        setMontoEstimado('');
        setFrecuencia('Única'); // Se resetea la frecuencia
        return '¡Obligación creada con éxito!';
      },
      error: 'Error al crear la obligación.',
    }).finally(() => setLoading(false));
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
          placeholder="Ej: Pago de Alquiler" 
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

        {/* Nuevo campo para seleccionar la frecuencia */}
        <label htmlFor="frecuencia">Frecuencia</label>
        <select 
          id="frecuencia" 
          name="frecuencia"
          value={frecuencia} 
          onChange={(e) => setFrecuencia(e.target.value)}
        >
          <option value="Única">Única</option>
          <option value="Mensual">Mensual</option>
          <option value="Anual" disabled>Anual (Próximamente)</option>
        </select>

        <button type="submit" aria-busy={loading}>
          Guardar Obligación
        </button>
      </form>
    </article>
  );
}

export default FormularioObligacion;