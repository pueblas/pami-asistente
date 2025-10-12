import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
    <div className="register__container">
      <div className="register__box">
        <h2 className="register__title">Registrarse</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form className="register__form" onSubmit={handleRegister}>
          <div>
            <label>Primer nombre</label>
            <input
              className="register__input"
              type="text"
              value={primerNombre}
              onChange={(e) => setPrimerNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Segundo nombre (opcional)</label>
            <input
              className="register__input"
              type="text"
              value={segundoNombre}
              onChange={(e) => setSegundoNombre(e.target.value)}
            />
          </div>
          <div>
            <label>Apellido:</label>
            <input
              className="register__input"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              className="register__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Contraseña:</label>
            <div className="register__password-wrapper">
              <input
                className="register__input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="register__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button className="register__submit-button" type="submit">
            Crear cuenta
          </button>
          <div className="register__login-link">
            ¿Ya tenés cuenta?{" "}
            <button
              className="register__login-button"
              type="button"
              onClick={() => navigate("/login")}
            >
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
