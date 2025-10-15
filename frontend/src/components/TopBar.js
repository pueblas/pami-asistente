import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { FiLogOut, FiLogIn, FiSettings } from "react-icons/fi";
import "./TopBar.css";
import { limpiarContexto } from "../api/auth";
import { useNavigate } from "react-router-dom";
import logo from "../logo/tramiteFacilLogo.png";

const TopBar = ({ menuAbierto, onUserClick, showUserMenu = true }) => {
  const closeSesion = async () => {
    const token = localStorage.getItem("access_token");
    if (token && userRole == "usuario") {
      try {
        await limpiarContexto(token);
      } catch (error) {
        console.error("Error limpiando contexto:", error);
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const logSesion = async () => {
    navigate("/login");
  };

  const goToAdminCenter = () => {
    navigate("/admin-center");
  };

  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const isAuthenticated =
    userRole === "administrador" || userRole === "usuario";

  useEffect(() => {
    const guardarDatos = () => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("role");

      if (!token) return;

      try {
        const base64Payload = token.split(".")[1];
        const payload = JSON.parse(atob(base64Payload));

        const fullName = payload.nombre_completo;
        const email = payload.sub;

        setUserName(fullName);
        setUserEmail(email);
        setUserRole(role);
      } catch (error) {
        console.error("Error al decodificar el token:", error);
      }
    };

    guardarDatos();
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Ir al contenido principal
      </a>
      <header className="top-bar" role="banner">
        <div className="logo-container">
          <img src={logo} alt="Trámite Fácil - Logotipo de la aplicación" className="logo-image" />
        </div>
      {showUserMenu && (
        <nav className="user-menu-container" role="navigation" aria-label="Menú de usuario">
          {userRole === "administrador" && (
            <span className="user-role" aria-label="Rol de usuario: administrador">{userRole}</span>
          )}
          <button 
            className="user-button" 
            onClick={onUserClick}
            aria-label={`${menuAbierto ? 'Cerrar' : 'Abrir'} menú de usuario`}
            aria-expanded={menuAbierto}
            aria-haspopup="true"
          >
            <FaUserCircle className="user-icon" aria-hidden="true" />
          </button>
        </nav>
      )}

      {showUserMenu && menuAbierto && (
        <div 
          className="dropdown-menu" 
          role="menu" 
          aria-label="Opciones de usuario"
          id="user-dropdown-menu"
        >
          {isAuthenticated ? (
            <section>
              <div className="account-section" role="group" aria-labelledby="account-heading">
                <h4 className="account-title" id="account-heading">Cuenta</h4>
                <div className="account-info">
                  <FaUserCircle className="account-icon" aria-hidden="true" />
                  <div className="account-text">
                    <span className="account-name" aria-label={`Nombre: ${userName}`}>{userName}</span>
                    <span className="account-email" aria-label={`Email: ${userEmail}`}>{userEmail}</span>
                  </div>
                </div>
              </div>
              <ul role="none">
                {userRole === "administrador" && (
                  <li role="none">
                    <button 
                      className="admin-button" 
                      onClick={goToAdminCenter}
                      role="menuitem"
                      aria-label="Ir a gestión de usuarios"
                    >
                      <FiSettings className="admin-icon" aria-hidden="true" />
                      <span className="admin-text">Gestión de Usuarios</span>
                    </button>
                  </li>
                )}
                <li role="none">
                  <button 
                    className="logout-button" 
                    onClick={closeSesion}
                    role="menuitem"
                    aria-label="Cerrar sesión de la aplicación"
                  >
                    <FiLogOut className="logout-icon" aria-hidden="true" />
                    <span className="logout-text">Cerrar sesión</span>
                  </button>
                </li>
              </ul>
            </section>
          ) : (
            <section>
              <ul role="none">
                <li role="none">
                  <button 
                    className="login-button" 
                    onClick={logSesion}
                    role="menuitem"
                    aria-label="Ir a página de inicio de sesión"
                  >
                    <FiLogIn className="login-icon" aria-hidden="true" />
                    <span className="logout-text">Iniciar sesión</span>
                  </button>
                </li>
              </ul>
            </section>
          )}
        </div>
      )}
      </header>
    </>
  );
};

export default TopBar;
