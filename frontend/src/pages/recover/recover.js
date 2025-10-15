import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import './recover.css';

// Definir la URL de la API directamente o usar variable de entorno
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Recover() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor ingresa un correo electrónico');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const params = new URLSearchParams({ email: email });
      const url = `${API_URL}/auth/recover?${params.toString()}`;
      console.log('Enviando petición a:', url); // Debug
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
      });

      if (response.ok) {
        setMessage('Se ha enviado un correo con las instrucciones para recuperar tu contraseña.');
        setEmail(''); // Limpiar el campo
      } else {
        const data = await response.json();
        
        // Manejar diferentes formatos de error del backend
        let errorMessage = 'Error al procesar la solicitud';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail[0]?.msg || errorMessage;
          } else if (typeof data.detail === 'object') {
            errorMessage = data.detail.msg || data.detail.message || errorMessage;
          }
        } else if (data.msg) {
          errorMessage = data.msg;
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar showUserMenu={false} />
      <div className="recover__container" id="main-content">
      <div className="recover__box">
        <h2 className="recover__title">Recuperar Contraseña</h2>
        <p className="recover__subtitle">
          Ingresá tu correo electrónico y te enviaremos las instrucciones
        </p>
        
        <form onSubmit={handleSubmit} className="recover__form">
          {error && (
            <div className="recover__error">
              {error}
            </div>
          )}

          {message && (
            <div className="recover__success">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="recover__input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="recover__submit-button"
            aria-label="Enviar instrucciones de recuperación"
          >
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        <div className="recover__back-link">
          <Link to="/login" aria-label="Volver a página de inicio de sesión">← Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
    </>
  );
}

export default Recover;