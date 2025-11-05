import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./reset.css";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import TopBar from "../../components/topBar";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function Reset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Obtener el token de la URL
  const token = searchParams.get("token");

  useEffect(() => {
    // Verificar si hay token en la URL
    if (!token) {
      setError(
        "Token no válido o expirado. Por favor, solicita un nuevo enlace de recuperación."
      );
    }
  }, [token]);

  const validatePassword = (pwd) => {
    const length = pwd.length >= 8;
    const lowercase = /[a-z]/.test(pwd);
    const uppercase = /[A-Z]/.test(pwd);
    const number = /[0-9]/.test(pwd);
    const special = /[!@#$%^&*(),.?":{}|<>\[\]\\/\\~`'\-+=;:_]/.test(pwd);

    setPasswordValid({ length, lowercase, uppercase, number, special });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar requisitos similares a registro
    const { length, lowercase, uppercase, number, special } = passwordValid;
    if (!length || !lowercase || !uppercase || !number || !special) {
      setError("La contraseña no cumple los requisitos mínimos");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const params = new URLSearchParams({
        token: token,
        new_password: password,
      });

      const url = `${API_URL}/auth/reset?${params.toString()}`;
      console.log("Enviando petición a:", url); // Debug

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
        },
      });

      if (response.ok) {
        setMessage(
          "¡Contraseña actualizada exitosamente! Redirigiendo al login..."
        );
        setPassword("");
        setConfirmPassword("");

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        const data = await response.json();

        // Manejar errores del backend
        let errorMessage = "Error al actualizar la contraseña";

        if (data.detail) {
          if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail[0]?.msg || errorMessage;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }

        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar showUserMenu={false} />
      <div className="reset-container">
        <div className="reset-form-container">
        <h2 className="reset-title">Nueva Contraseña</h2>
        <p className="reset-subtitle">Ingresa tu nueva contraseña</p>

        {!token ? (
          <div className="reset-error">
            Token no válido. Por favor, solicita un nuevo enlace de
            recuperación.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">
            {error && <div className="reset-error">{error}</div>}

            {message && <div className="reset-success">{message}</div>}

            <div className="reset-form-group">
              <label htmlFor="password">Nueva Contraseña</label>
              <div className="reset-password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Debe incluir: mayúscula, número y carácter especial"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                  disabled={loading}
                  className="reset-password-input"
                />
                <button
                  type="button"
                  className="reset-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  tabIndex="0"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <ul id="password-requirements" className="password-requirements" aria-live="polite">
                <li className={passwordValid.lowercase ? 'valid' : 'invalid'}>
                  {passwordValid.lowercase ? <FaCheckCircle /> : <FaTimesCircle />} <span>Contiene minúsculas</span>
                </li>
                <li className={passwordValid.uppercase ? 'valid' : 'invalid'}>
                  {passwordValid.uppercase ? <FaCheckCircle /> : <FaTimesCircle />} <span>Contiene mayúsculas</span>
                </li>
                <li className={passwordValid.number ? 'valid' : 'invalid'}>
                  {passwordValid.number ? <FaCheckCircle /> : <FaTimesCircle />} <span>Contiene número</span>
                </li>
                <li className={passwordValid.special ? 'valid' : 'invalid'}>
                  {passwordValid.special ? <FaCheckCircle /> : <FaTimesCircle />} <span>Contiene carácter especial</span>
                </li>
                <li className={passwordValid.length ? 'valid' : 'invalid'}>
                  {passwordValid.length ? <FaCheckCircle /> : <FaTimesCircle />} <span>Al menos 8 caracteres</span>
                </li>
              </ul>
            </div>

            <div className="reset-form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <div className="reset-password-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="reset-password-input"
                />
                <button
                  type="button"
                  className="reset-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  tabIndex="0"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="reset-submit-button" disabled={loading || !token}>
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </form>
        )}
        </div>
      </div>
    </>
  );
}

export default Reset;
