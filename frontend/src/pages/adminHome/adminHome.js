import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdChat, MdPeople, MdDescription, MdSettings, MdBarChart } from "react-icons/md";
import TopBar from "../../components/topBar/TopBar";
import "./adminHome.css";

function AdminHome() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "administrador") {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const adminSections = [
    {
      title: "Chat",
      description:
        "Interactuar con el asistente de IA para consultas sobre trámites",
      icon: <MdChat size={48} />,
      path: "/chat",
      color: "chat",
    },
    {
      title: "Gestión de Usuarios",
      description: "Administrar usuarios del sistema, roles y permisos",
      icon: <MdPeople size={48} />,
      path: "/admin-center",
      color: "users",
    },
    {
      title: "Gestión de Trámites",
      description: "Administrar trámites, URLs y contenido del sistema",
      icon: <MdDescription size={48} />,
      path: "/admin-procedures",
      color: "procedures",
    },
    {
      title: "Estadísticas",
      description: "Visualizar métricas y estadísticas de feedback del sistema",
      icon: <MdBarChart size={48} />,
      path: "/admin-graphics",
      color: "graphics",
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <>
      <TopBar
        menuAbierto={menuAbierto}
        onUserClick={() => setMenuAbierto(!menuAbierto)}
      />
      <div className="admin-home__topbar-spacer"></div>
      <div className="admin-home__container">
        <div className="admin-home__box">
          <div className="admin-home__header">
            <h1 className="admin-home__title">Centro de Administración</h1>
            <p className="admin-home__subtitle">
              Gestiona todos los aspectos del sistema Trámite Fácil
            </p>
          </div>

          <div className="admin-home__sections">
            {adminSections.map((section, index) => (
              <div
                key={index}
                className={`admin-home__section admin-home__section--${section.color}`}
                onClick={() => handleNavigate(section.path)}
              >
                <div className="admin-home__section-icon">{section.icon}</div>
                <div className="admin-home__section-content">
                  <h3 className="admin-home__section-title">{section.title}</h3>
                  <p className="admin-home__section-description">
                    {section.description}
                  </p>
                </div>
                <div className="admin-home__section-arrow">
                  <MdSettings size={24} />
                </div>
              </div>
            ))}
          </div>

          <div className="admin-home__footer">
            <button
              onClick={handleLogout}
              className="admin-home__logout-btn"
              aria-label="Cerrar sesión y volver al login"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminHome;
