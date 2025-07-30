// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // <-- 1. IMPORTAMOS Toaster
import { supabase } from './supabaseClient';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DashboardManager from './pages/DashboardManager';
import './App.css';

const MainLayout = ({ children }) => {
  return <main className="container">{children}</main>;
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="container">
        <article aria-busy="true"></article>
      </main>
    );
  }

  return (
    <Router>
      {/* 👇 2. AÑADIMOS EL COMPONENTE Toaster AQUÍ 👇 */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'toast-notification',
          duration: 4000,
          success: {
            style: {
              background: 'var(--color-success)',
              color: 'white',
            },
          },
          error: {
            style: {
              background: 'var(--color-danger)',
              color: 'white',
            },
          },
        }}
      />
      <Routes>
        <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/" />} />
        
        <Route 
          path="/" 
          element={session ? <MainLayout><Dashboard session={session} /></MainLayout> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/manage" 
          element={session ? <MainLayout><DashboardManager session={session} /></MainLayout> : <Navigate to="/auth" />} 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;