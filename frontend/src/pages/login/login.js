import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../../api/auth";
import "./login.css";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { access_token, role } = await loginUsuario(email, password);

      console.log("Login exitoso, navegando a Health", access_token, role);
      // Guardar token en localStorage o estado global si quieres
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("role", role);
      if (role == "usuario") {
        navigate("/chat");
      } else {
        navigate("/admin-center");
      }
    } catch (err) {
      console.error("Error en login:", err);
      if (err.response && err.response.status === 401) {
        setError(err.response.data.detail);
      } else {
        setError("Error de servidor");
      }
    }
  };

  return (
    <div className="login__container">
      <div className="login__box">
        <h2 className="login__title">Iniciar sesión</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form className="login__form" onSubmit={handleSubmit}>
          <input
            className="login__input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="login__password-wrapper">
            <input
              className="login__password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login__password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button className="login__submit-button" type="submit">Entrar</button>
          <div className="login__recover">
            <Link
              to="/recover"
              className="text-lr text-red-100 hover:text-blue-500"
            >
              Olvidé mi contraseña
            </Link>
          </div>
        </form>
        <div className="login__register-link">
          ¿No tenés cuenta?{" "}
          <button className="login__register-button" onClick={() => navigate("/register")}>Registrate</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
