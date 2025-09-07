import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './register.css';

function Register() {
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = 'http://localhost:8000/auth/'; // Cambiar por tu URL real

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}register`, {
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre,
        apellido: apellido,
        correo_electronico: email,
        password: password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      // Redirigir a login si se registra correctamente
      navigate('/login');
    } catch (err) {
      console.error("Error al registrar:", err);
      setError('Error al registrar. ¿El email ya existe?');
    }
  };

  return (
    <div className='register-container'>
      <div className='register-box'>
        <h2>Registrarse</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleRegister}>
          <div>
            <label>Primer nombre:</label>
            <input
              type="text"
              value={primerNombre}
              onChange={(e) => setPrimerNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Segundo nombre:</label>
            <input
              type="text"
              value={segundoNombre}
              onChange={(e) => setSegundoNombre(e.target.value)}
            />
          </div>
          <div>
            <label>Apellido:</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Crear cuenta</button>
          <div className='register-link'>
            ¿Ya tenés cuenta?{" "}
            <button type="button" onClick={() => navigate("/login")}>
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
