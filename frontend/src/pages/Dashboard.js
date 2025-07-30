// frontend/src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BsCalendar2Check, BsCalendar2X, BsCashCoin } from 'react-icons/bs'; // 1. Importamos iconos
import DashboardSkeleton from '../components/DashboardSkeleton'; // 2. Importamos el Skeleton

const API_URL = 'http://127.0.0.1:8000';

const ObligacionItem = ({ obligacion, vencida = false }) => {
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    if (!fechaString.includes('T')) {
      fecha.setDate(fecha.getDate() + 1);
    }
    return fecha.toLocaleDateString('es-CR', { day: 'numeric', month: 'long' });
  };

  return (
    <li className={`obligacion-resumen-item ${vencida ? 'vencida' : ''}`}>
      <div className="obligacion-resumen-info">
        <strong>{obligacion.titulo}</strong>
        <span>{obligacion.Empresa.nombre_comercial}</span>
      </div>
      <div className="obligacion-resumen-fecha">
        <span>Vence</span>
        <strong>{formatearFecha(obligacion.fecha_vencimiento)}</strong>
      </div>
    </li>
  );
};

function Dashboard({ session }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarResumen = useCallback(async () => {
    // Para apreciar la animación de carga, simulamos un pequeño retraso.
    // En producción, puedes eliminar o reducir el tiempo de este setTimeout.
    await new Promise(resolve => setTimeout(resolve, 500));

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/dashboard/summary`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('No se pudo cargar el resumen.');
      const data = await response.json();
      setSummaryData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [session.access_token]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  // 3. Si está cargando, mostramos el nuevo componente Skeleton
  if (loading) {
    return <DashboardSkeleton />;
  }
  
  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Resumen General</h2>
        <Link to="/manage" role="button" className="outline">Gestionar Empresas y Obligaciones</Link>
      </header>

      <section className="summary-cards">
        <article className="card total-mes-card">
          {/* 4. Añadimos iconos a las tarjetas */}
          <BsCashCoin className="card-icon" />
          <h4>Total Estimado del Mes</h4>
          <h2>₡{summaryData?.total_estimado_mes.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </article>
        <article className="card proximas-card">
          <BsCalendar2Check className="card-icon" />
          <h4>Próximas a Vencer</h4>
          <h2>{summaryData?.proximas_obligaciones.length}</h2>
        </article>
        <article className="card vencidas-card">
          <BsCalendar2X className="card-icon" />
          <h4>Vencidas</h4>
          <h2>{summaryData?.obligaciones_vencidas.length}</h2>
        </article>
      </section>

      <section className="lists-container">
        <article>
          <h4>Próximas Obligaciones (30 días)</h4>
          {summaryData?.proximas_obligaciones.length > 0 ? (
            <ul className="obligacion-resumen-lista">
              {summaryData.proximas_obligaciones.map(o => <ObligacionItem key={o.id} obligacion={o} />)}
            </ul>
          ) : (
            <p>No tienes obligaciones próximas. ¡Buen trabajo!</p>
          )}
        </article>
        <article>
          <h4>Obligaciones Vencidas</h4>
          {summaryData?.obligaciones_vencidas.length > 0 ? (
            <ul className="obligacion-resumen-lista">
              {summaryData.obligaciones_vencidas.map(o => <ObligacionItem key={o.id} obligacion={o} vencida={true} />)}
            </ul>
          ) : (
            <p>¡Estás al día! No tienes obligaciones vencidas.</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default Dashboard;