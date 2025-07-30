// frontend/src/pages/AuthPage.js

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 👇 DIV principal para el fondo y centrado 👇
    <div className="auth-page-wrapper"> 
      <article className="auth-container">
        <hgroup>
          <h1>TrámiteFácil</h1>
          <h2>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta para empezar'}</h2>
        </hgroup>
        
        <form onSubmit={handleAuth}>
          <input
            type="email"
            name="email"
            placeholder="Tu email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Tu contraseña"
            aria-label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" aria-busy={loading}>
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>
        
        {error && <p className="error-message">{error}</p>}
        
        <a href="#/" onClick={(e) => {e.preventDefault(); setIsLogin(!isLogin);}}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
        </a>
      </article>
    </div>
  );
}

export default AuthPage;