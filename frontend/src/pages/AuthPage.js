// frontend/src/pages/AuthPage.js

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BsCheckCircle } from 'react-icons/bs'; // 1. Importamos un ícono para el mensaje

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 2. Añadimos un nuevo estado para controlar si el registro fue exitoso
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSignupSuccess(false); // Reiniciamos el estado en cada intento

    try {
      if (isLogin) {
        // Lógica de Inicio de Sesión
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // 3. Modificamos la lógica de 'signUp' para detectar un registro exitoso
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        if (error) throw error;
        
        // Si Supabase crea un usuario, activamos el mensaje de éxito
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
        
        {/* 4. Añadimos renderizado condicional en el JSX */}
        {signupSuccess ? (
          // Si el registro fue exitoso, muestra este mensaje
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
          // Si no, muestra el formulario normal
          <>
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
          </>
        )}
      </article>
    </div>
  );
}

export default AuthPage;