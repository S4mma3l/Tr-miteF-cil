// frontend/src/components/ListaObligaciones.js

import React from 'react';
import toast from 'react-hot-toast';

const API_URL = 'http://127.0.0.1:8000';

function ListaObligaciones({ obligaciones, isLoading, session, onObligacionActualizada }) {
  
  const handleToggleCompletada = async (obligacion) => {
    if (!session) return;

    const promise = fetch(`${API_URL}/obligaciones/${obligacion.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ completada: !obligacion.completada }),
    });

    toast.promise(promise, {
      loading: 'Actualizando...',
      success: (response) => {
        if (!response.ok) throw new Error('Respuesta no válida del servidor.');
        onObligacionActualizada();
        return '¡Estado actualizado!';
      },
      error: 'No se pudo actualizar.',
    });
  };

  const handleDelete = async (obligacionId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta obligación?")) {
      return;
    }

    const promise = fetch(`${API_URL}/obligaciones/${obligacionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    toast.promise(promise, {
      loading: 'Eliminando...',
      success: (response) => {
        if (!response.ok) throw new Error('Respuesta no válida del servidor.');
        onObligacionActualizada();
        return 'Obligación eliminada.';
      },
      error: 'No se pudo eliminar.',
    });
  };

  if (isLoading) {
    return <article aria-busy="true">Cargando obligaciones...</article>;
  }

  if (obligaciones.length === 0) {
    return <p>Esta empresa no tiene obligaciones registradas.</p>;
  }

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    if (!fechaString.includes('T')) {
      fecha.setDate(fecha.getDate() + 1);
    }
    return fecha.toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="obligaciones-container">
      <h4>Obligaciones Pendientes</h4>
      <ul>
        {obligaciones.map((obligacion) => (
          <li key={obligacion.id} className="obligacion-item">
            <div className="obligacion-info">
              <strong>{obligacion.titulo}</strong>
              <span>Vence: {formatearFecha(obligacion.fecha_vencimiento)}</span>
              {obligacion.monto_estimado != null && (
                <span>Monto: ₡{obligacion.monto_estimado.toLocaleString('es-CR')}</span>
              )}
            </div>
            <div className="obligacion-actions">
              <div className="obligacion-status">
                  <input 
                    type="checkbox" 
                    id={`cb-${obligacion.id}`} 
                    checked={obligacion.completada}
                    onChange={() => handleToggleCompletada(obligacion)}
                  />
                  <label htmlFor={`cb-${obligacion.id}`}>Completada</label>
              </div>
              <button className="delete-button" onClick={() => handleDelete(obligacion.id)}>
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListaObligaciones;