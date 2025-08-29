import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUsuario } from '../api/auth';
import './login.css';


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { access_token, role } = await loginUsuario(email, password);

      console.log("Login exitoso, navegando a Health", access_token, role);    
      // Guardar token en localStorage o estado global si quieres
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("role", role);
      navigate('/health');
    } catch (err) {
          console.error("Error en login:", err);
        if (err.response && err.response.status === 401) {
          setError('Email o contraseña incorrecta');
        } else {
          setError('Error del servidor o de red');
        }
      }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar sesión</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
        <div className="register-link">
          ¿No tenés cuenta?{" "}
          <button onClick={() => navigate("/register")}>Registrate</button>
        </div>
      </div>
    </div>

  );
}

export default Login;