import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdAdd, MdDelete, MdVisibility } from "react-icons/md";
import {
  getTramitesUrls,
  addTramiteUrl,
  deleteTramiteUrl,
} from "../../api/tramites";
import TopBar from "../../components/topBar/TopBar";
import "./adminProcedure.css";

function AdminProcedure() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTramite, setSelectedTramite] = useState(null);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const navigate = useNavigate();

  // URL validation for PAMI tramite domain
  const validatePamiUrl = (url) => {
    return url.includes("pami.org.ar/tramite/");
  };

  const handleAddTramite = () => {
    setNewUrl("");
    setModalError("");
    setShowAddModal(true);
  };

  const handleViewTramite = (tramite) => {
    setSelectedTramite(tramite);
    setShowViewModal(true);
  };


  const handleDeleteTramite = async (tramiteIndex, tramiteUrl) => {
    if (
      window.confirm(
        `¿Estás seguro de que querés eliminar el trámite "${tramiteUrl}"?`
      )
    ) {
      try {
        const token = localStorage.getItem("access_token");
        await deleteTramiteUrl(tramiteIndex, token);

        // Refresh tramites list
        const response = await getTramitesUrls(token);
        setTramites(response.urls);
      } catch (err) {
        console.error("Error deleting tramite:", err);
        setError("Error al eliminar trámite");
      }
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();

    if (!validatePamiUrl(newUrl)) {
      setModalError(
        "La URL debe ser de un trámite de PAMI (https://www.pami.org.ar/tramite/...)"
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await addTramiteUrl(newUrl, token);

      // Refresh tramites list
      const response = await getTramitesUrls(token);
      setTramites(response.urls);

      setShowAddModal(false);
      setNewUrl("");
      setModalError("");
    } catch (err) {
      console.error("Error creating tramite:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError("Error al crear trámite");
      }
    }
  };


  const closeModals = () => {
    setShowAddModal(false);
    setShowViewModal(false);
    setSelectedTramite(null);
    setModalError("");
  };

  useEffect(() => {
    const loadTramites = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const role = localStorage.getItem("role");

        if (!token || role !== "administrador") {
          navigate("/login");
          return;
        }

        const response = await getTramitesUrls(token);
        setTramites(response.urls);
        setLoading(false);
      } catch (err) {
        console.error("Error loading tramites:", err);
        setError("Error al cargar trámites");
        setLoading(false);
      }
    };

    loadTramites();
  }, [navigate]);

  if (loading) {
    return (
      <div className="procedures__container">
        <div className="procedures__box">
          <p>Cargando trámites...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar
        menuAbierto={menuAbierto}
        onUserClick={() => setMenuAbierto(!menuAbierto)}
      />
      <div className="procedures__container">
        <div className="procedures__box">
          <div className="procedures__header">
            <h2 className="procedures__title">Gestión de Trámites</h2>
            <div className="procedures__header-actions">
              <button
                className="procedures__create-btn"
                onClick={handleAddTramite}
                aria-label="Agregar nuevo trámite"
              >
                <MdAdd size={20} />
                Agregar Trámite
              </button>
            </div>
          </div>

          {error && <p className="procedures__error">{error}</p>}

          {/* Mobile-first Cards Layout */}
          <div className="procedures__grid">
            {tramites.map((tramite) => (
              <div key={tramite.index} className="procedure__card">
                <div className="procedure__header">
                  <h3 className="procedure__title">{tramite.url}</h3>
                  <div className="procedure__actions">
                    <button
                      className="procedure__action-btn procedure__view-btn"
                      onClick={() => handleViewTramite(tramite)}
                      aria-label={`Ver contenido de ${tramite.url}`}
                      title="Ver contenido"
                    >
                      <MdVisibility size={20} />
                    </button>
                    <button
                      className="procedure__action-btn procedure__delete-btn"
                      onClick={() =>
                        handleDeleteTramite(tramite.index, tramite.url)
                      }
                      aria-label={`Eliminar ${tramite.url}`}
                      title="Eliminar trámite"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                </div>
                <div className="procedure__info">
                  <p className="procedure__url">{tramite.url}</p>
                </div>
              </div>
            ))}
          </div>

          {tramites.length === 0 && !error && (
            <p className="procedures__no-users">No hay trámites registrados</p>
          )}

          {/* Add Tramite Modal */}
          {showAddModal && (
            <div className="procedures__modal-overlay">
              <div className="procedures__modal-content">
                <h3 className="procedures__modal-title">Agregar Nuevo Trámite</h3>
                <form
                  onSubmit={handleSubmitAdd}
                  className="procedures__form-content"
                >
                  <div>
                    <label htmlFor="tramite-url">URL del Trámite</label>
                    <input
                      id="tramite-url"
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      required
                      className="procedures__input"
                      placeholder="https://www.pami.org.ar/tramite/nombre-tramite"
                    />
                    <small className="procedures__help-text">
                      La URL debe ser de un trámite de PAMI (https://www.pami.org.ar/tramite/...)
                    </small>
                  </div>

                  {modalError && (
                    <div className="procedures__modal-error">{modalError}</div>
                  )}

                  <div className="procedures__modal-buttons">
                    <button
                      type="button"
                      className="procedures__cancel-btn"
                      onClick={closeModals}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="procedures__submit-btn">
                      Agregar Trámite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Tramite Modal */}
          {showViewModal && selectedTramite && (
            <div className="procedures__modal-overlay">
              <div className="procedures__modal-content procedures__modal-content--large">
                <h3 className="procedures__modal-title">
                  Trámite #{selectedTramite.index}
                </h3>
                <div className="procedure__view-content">
                  <p>
                    <strong>URL:</strong> {selectedTramite.url}
                  </p>
                  <p>
                    <strong>Índice:</strong> {selectedTramite.index}
                  </p>
                  <div className="procedure__content">
                    <h4>Información:</h4>
                    <p>Este trámite ha sido procesado automáticamente desde la URL de PAMI.</p>
                    <p>Para ver el contenido completo, visite la URL directamente.</p>
                  </div>
                </div>
                <div className="procedures__modal-buttons">
                  <button className="procedures__cancel-btn" onClick={closeModals}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}


          <div className="procedures__actions">
            <button
              onClick={() => navigate("/login")}
              className="procedures__logout-btn"
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

export default AdminProcedure;
