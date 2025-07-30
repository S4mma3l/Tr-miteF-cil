// frontend/src/pages/AuthPage.js

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BsCheckCircle } from 'react-icons/bs'; // Importamos un ícono

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- 1. NUEVO ESTADO para el mensaje de éxito ---
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSignupSuccess(false);

    try {
      if (isLogin) {
        // Lógica de Inicio de Sesión (sin cambios)
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Lógica de Registro
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        if (error) throw error;
        
        // --- 2. Si el registro fue exitoso, activamos el mensaje ---
        if (data.user) {
          setSignupSuccess(true);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper"> 
      <article className="auth-container">
        {/* --- 3. Renderizado Condicional: Muestra el mensaje o el formulario --- */}
        {signupSuccess ? (
          <div className="signup-success-message">
            <BsCheckCircle className="success-icon" />
            <h2>¡Revisa tu correo!</h2>
            <p>
              Se ha enviado un enlace de confirmación a <strong>{email}</strong>.
              Por favor, haz clic en ese enlace para activar tu cuenta.
            </p>
            <a href="#/" role="button" className="outline" onClick={() => setSignupSuccess(false)}>Volver</a>
          </div>
        ) : (
          <>
            <hgroup>
              <h1>TrámiteFácil</h1>
              <h2>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta para empezar'}</h2>
            </hgroup>
            
            <form onSubmit={handleAuth}>
              {/* ... (inputs del formulario sin cambios) ... */}
              <button type="submit" aria-busy={loading}>
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            </form>
            
            {error && <p className="error-message">{error}</p>}
            
            <a href="#/" onClick={(e) => {e.preventDefault(); setIsLogin(!isLogin);}}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            </a>
          </>
        )}
      </article>
    </div>
  );
}

export default AuthPage;