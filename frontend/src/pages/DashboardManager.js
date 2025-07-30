// frontend/src/pages/DashboardManager.js

import React, { useEffect, useCallback, useReducer } from 'react'; // Se eliminó 'useState'
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import FormularioEmpresa from '../components/FormularioEmpresa';
import ListaObligaciones from '../components/ListaObligaciones';
import FormularioObligacion from '../components/FormularioObligacion';
import { API_URL } from '../config';

// const API_URL = 'http://127.0.0.1:8000';

const apiFetch = async (url, token) => {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Ocurrió un error en la petición a la API.');
  }
  return response.json();
};

const initialState = {
  empresas: [],
  obligaciones: [],
  selectedEmpresa: null,
  loadingEmpresas: true,
  loadingObligaciones: false,
  apiError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_EMPRESAS_START':
      return { ...state, loadingEmpresas: true, apiError: null };
    case 'FETCH_EMPRESAS_SUCCESS':
      return { ...state, loadingEmpresas: false, empresas: action.payload };
    case 'FETCH_EMPRESAS_ERROR':
      return { ...state, loadingEmpresas: false, apiError: action.payload };
    
    case 'SELECT_EMPRESA':
      return { ...state, selectedEmpresa: action.payload, obligaciones: [] };

    case 'FETCH_OBLIGACIONES_START':
      return { ...state, loadingObligaciones: true, apiError: null };
    case 'FETCH_OBLIGACIONES_SUCCESS':
      return { ...state, loadingObligaciones: false, obligaciones: action.payload };
    case 'FETCH_OBLIGACIONES_ERROR':
      return { ...state, loadingObligaciones: false, apiError: action.payload };
      
    default:
      throw new Error();
  }
}

function DashboardManager({ session }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { empresas, obligaciones, selectedEmpresa, loadingEmpresas, loadingObligaciones, apiError } = state;

  const cargarEmpresas = useCallback(async () => {
    dispatch({ type: 'FETCH_EMPRESAS_START' });
    try {
      const data = await apiFetch(`${API_URL}/empresas/`, session.access_token);
      dispatch({ type: 'FETCH_EMPRESAS_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_EMPRESAS_ERROR', payload: error.message });
    }
  }, [session.access_token]);

  const cargarObligaciones = useCallback(async (empresaId) => {
    if (!empresaId) return;
    dispatch({ type: 'FETCH_OBLIGACIONES_START' });
    try {
      const data = await apiFetch(`${API_URL}/empresas/${empresaId}/obligaciones/`, session.access_token);
      dispatch({ type: 'FETCH_OBLIGACIONES_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_OBLIGACIONES_ERROR', payload: error.message });
    }
  }, [session.access_token]);

  useEffect(() => {
    cargarEmpresas();
  }, [cargarEmpresas]);

  const handleSelectEmpresa = (empresa) => {
    dispatch({ type: 'SELECT_EMPRESA', payload: empresa });
    cargarObligaciones(empresa.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/" role="button" className="contrast outline">‹ Volver al Resumen</Link></li>
        </ul>
      </nav>
      <header className="dashboard-header">
        <hgroup>
          <h2>Gestión de Entidades</h2>
          <p>Crea, actualiza y elimina tus empresas y obligaciones.</p>
        </hgroup>
        <div className="user-display">
          <span>{session.user.email}</span>
          <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
        </div>
      </header>
      
      <div className="grid">
        <aside className="empresa-lista-container">
          <FormularioEmpresa onEmpresaCreada={cargarEmpresas} />
          <hr />
          <h3>Mis Empresas</h3>
          {loadingEmpresas ? (
            <article aria-busy="true"></article>
          ) : (
            <ul className="empresa-lista">
              {empresas.map((empresa) => (
                <li 
                  key={empresa.id} 
                  onClick={() => handleSelectEmpresa(empresa)}
                  className={selectedEmpresa?.id === empresa.id ? 'active' : ''}
                >
                  {empresa.nombre_comercial}
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section>
          {apiError && <p className='error-message'>{apiError}</p>}
          {selectedEmpresa ? (
            <>
              <h3>Detalles de: {selectedEmpresa.nombre_comercial}</h3>
              <ListaObligaciones 
                obligaciones={obligaciones} 
                isLoading={loadingObligaciones}
                session={session}
                onObligacionActualizada={() => cargarObligaciones(selectedEmpresa.id)}
              />
              <FormularioObligacion 
                empresaId={selectedEmpresa.id} 
                onObligacionCreada={() => cargarObligaciones(selectedEmpresa.id)} 
              />
            </>
          ) : (
            <article>
              <p>Selecciona una empresa de la lista para ver sus obligaciones.</p>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}

export default DashboardManager;