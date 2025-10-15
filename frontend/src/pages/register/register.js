import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopBar from "../../components/TopBar";
import "./register.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const [primerNombre, setPrimerNombre] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_URL = "http://localhost:8000/auth/";

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}register`,
        {
          primer_nombre: primerNombre,
          segundo_nombre: segundoNombre,
          apellido: apellido,
          correo_electronico: email,
          password: password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Redirigir a login si se registra correctamente
      navigate("/login");
    } catch (err) {
      console.error("Error al registrar:", err);
      if (err.response && err.response.status === 400) {
        setError(err.response.data.detail);
      } else {
        setError("Error de servidor");
      }
    }
  };

  return (
    <>
      <TopBar showUserMenu={false} />
      <div className="register__container" id="main-content">
      <div className="register__box">
        <h2 className="register__title">Registrarse</h2>
        {error && (
          <div 
            id="error-message" 
            className="register__error" 
            role="alert" 
            aria-live="polite"
          >
            {error}
          </div>
        )}
        <form className="register__form" onSubmit={handleRegister} noValidate>
          <div>
            <label htmlFor="primer-nombre">Primer nombre</label>
            <input
              id="primer-nombre"
              name="primer-nombre"
              className="register__input"
              type="text"
              value={primerNombre}
              onChange={(e) => setPrimerNombre(e.target.value)}
              required
              aria-required="true"
              aria-describedby={error && error.includes('primer_nombre') ? 'error-message' : undefined}
              autoComplete="given-name"
              placeholder="Ingresá tu primer nombre"
            />
          </div>
          <div>
            <label htmlFor="segundo-nombre">Segundo nombre (opcional)</label>
            <input
              id="segundo-nombre"
              name="segundo-nombre"
              className="register__input"
              type="text"
              value={segundoNombre}
              onChange={(e) => setSegundoNombre(e.target.value)}
              aria-required="false"
              autoComplete="additional-name"
              placeholder="Segundo nombre (opcional)"
            />
          </div>
          <div>
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              name="apellido"
              className="register__input"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              aria-required="true"
              aria-describedby={error && error.includes('apellido') ? 'error-message' : undefined}
              autoComplete="family-name"
              placeholder="Ingresá tu apellido"
            />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="register__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-describedby={error && error.includes('correo_electronico') ? 'error-message' : undefined}
              autoComplete="email"
              placeholder="tu@email.com"
              aria-invalid={error && error.includes('correo_electronico') ? 'true' : 'false'}
            />
          </div>
          <div>
            <label htmlFor="password">Contraseña</label>
            <div className="register__password-wrapper">
              <input
                id="password"
                name="password"
                className="register__input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                aria-describedby="password-help"
                autoComplete="new-password"
                placeholder="Creá una contraseña segura"
                aria-invalid={error && error.includes('password') ? 'true' : 'false'}
                minLength="8"
              />
              <button
                type="button"
                className="register__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex="0"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div id="password-help" className="register__help-text">
              La contraseña debe tener al menos 8 caracteres
            </div>
          </div>
          <button 
            className="register__submit-button" 
            type="submit"
            aria-label="Crear nueva cuenta"
          >
            Crear cuenta
          </button>
          <div className="register__login-link">
            ¿Ya tenés cuenta?{" "}
            <button
              className="register__login-button"
              type="button"
              onClick={() => navigate("/login")}
              aria-label="Ir a página de inicio de sesión"
            >
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default Register;
