import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import './TopBar.css';

const TopBar = ({ menuAbierto, onUserClick}) => {
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
    navigate('/login');
  };
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const validarAcceso = () => {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('role');

      if (!token) return;

      try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));

        const fullName = payload.nombre_completo;
        const email = payload.sub;

        setUserName(fullName);
        setUserEmail(email);
        setUserRole(role);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    };

    validarAcceso();
  }, []);

  return (
    <header className="top-bar">
      <div className="user-menu-container">
        {userRole === "administrador" && (
          <span className="user-role">{userRole}</span>
        )}
        <button className="user-button" onClick={onUserClick}>
          <FaUserCircle className="user-icon" />
        </button>
      </div>

      {menuAbierto && (
        <div className="dropdown-menu">
          <div className="account-section">
            <h4 className="account-title">Cuenta</h4>
            <div className="account-info">
              <FaUserCircle className="account-icon" />
              <div className="account-text">
                <span className="account-name">{userName}</span>
                <span className="account-email">{userEmail}</span>
              </div>
            </div>
          </div>
          <ul>
            <li className="logout-button" onClick={closeSesion}>
              <FiLogOut className="logout-icon" />
              <span className="logout-text">Cerrar sesión</span>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default TopBar;
