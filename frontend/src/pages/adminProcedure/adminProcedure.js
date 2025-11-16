import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdAdd, MdDelete, MdVisibility, MdSync } from "react-icons/md";
import {
  getTramitesList,
  addTramiteUrl,
  deleteTramiteById,
} from "../../api/tramites";
import axios from "axios";
import TopBar from "../../components/topBar/TopBar";
import "./adminProcedure.css";

function AdminProcedure() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
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

  const handleSyncTramites = async () => {
    if (
      window.confirm(
        "¿Estás seguro de que querés sincronizar todos los trámites? Esto puede tomar varios minutos."
      )
    ) {
      try {
        setSyncing(true);
        setError("");

        const token = localStorage.getItem("access_token");

        const response = await axios.post(
          "http://localhost:8000/admin/scrape-all",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 300000, // 5 minutos timeout
          }
        );

        if (response.data.success) {
          // Recargar lista de trámites
          const tramitesResponse = await getTramitesList(token);
          setTramites(tramitesResponse.tramites);

          alert(
            `Sincronización exitosa: ${response.data.inserted_to_db} trámites procesados`
          );
        } else {
          setError(
            "Error en la sincronización: " + response.data.errors.join(", ")
          );
        }
      } catch (err) {
        console.error("Error syncing tramites:", err);
        setError(
          "Error al sincronizar trámites: " +
            (err.response?.data?.detail || err.message)
        );
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleDeleteTramite = async (tramiteId, tramiteTitle) => {
    console.log("🔍 DEBUG - handleDeleteTramite called with:");
    console.log("  tramiteId:", tramiteId);
    console.log("  tramiteTitle:", tramiteTitle);
    console.log("  typeof tramiteId:", typeof tramiteId);
    
    if (
      window.confirm(
        `¿Estás seguro de que querés eliminar el trámite "${tramiteTitle}"?`
      )
    ) {
      try {
        const token = localStorage.getItem("access_token");
        console.log("🚀 Calling deleteTramiteById with ID:", tramiteId);
        await deleteTramiteById(tramiteId, token);

        // Refresh tramites list
        const response = await getTramitesList(token);
        setTramites(response.tramites);
        
        alert("Trámite eliminado exitosamente");
      } catch (err) {
        console.error("Error deleting tramite:", err);
        setError("Error al eliminar trámite: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();

    // Check if maximum tramites limit has been reached
    if (tramites.length >= 10) {
      setModalError(
        "Has alcanzado el límite de 10 trámites. Para agregar uno nuevo, primero elimina un trámite existente."
      );
      return;
    }

    if (!validatePamiUrl(newUrl)) {
      setModalError(
        "La URL debe ser de un trámite de PAMI (https://www.pami.org.ar/tramite/...)"
      );
      return;
    }

    try {
      setAdding(true);
      setModalError("");
      
      const token = localStorage.getItem("access_token");
      const result = await addTramiteUrl(newUrl, token);

      // Refresh tramites list
      const response = await getTramitesList(token);
      setTramites(response.tramites);

      setShowAddModal(false);
      setNewUrl("");
      setModalError("");
      
      alert(`Trámite "${result.titulo}" agregado exitosamente`);
    } catch (err) {
      console.error("Error creating tramite:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError("Error al crear trámite");
      }
    } finally {
      setAdding(false);
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

        const response = await getTramitesList(token);
        console.log("🔍 DEBUG - getTramitesList response:", response);
        console.log("🔍 DEBUG - tramites array:", response.tramites);
        console.log("🔍 DEBUG - first tramite:", response.tramites[0]);
        setTramites(response.tramites);
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
                className="procedures__sync-btn"
                onClick={handleSyncTramites}
                disabled={syncing}
                aria-label="Sincronizar trámites desde PAMI"
                title="Sincronizar todos los trámites desde las URLs configuradas"
              >
                <MdSync size={20} />
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </button>
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

          {/* Progress bar for tramites limit */}
          <div className="procedures__progress-container">
            <div className="procedures__progress-label">
              <span>{tramites.length} de 10 trámites agregados</span>
              <span>{10 - tramites.length} disponibles</span>
            </div>
            <div className="procedures__progress-track">
              <div
                className={`procedures__progress-fill ${
                  tramites.length >= 10
                    ? "procedures__progress-fill--full"
                    : tramites.length >= 8
                    ? "procedures__progress-fill--warning"
                    : ""
                }`}
                style={{ width: `${(tramites.length / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Mobile-first Cards Layout */}
          <div className="procedures__grid">
            {tramites.map((tramite, index) => {
              console.log(`🔍 DEBUG - Rendering tramite ${index}:`, tramite);
              console.log(`🔍 DEBUG - tramite.id:`, tramite.id);
              return (
                <div key={index} className="procedure__card">
                <div className="procedure__header">
                  <h3 className="procedure__title">{tramite.title}</h3>
                  <div className="procedure__actions">
                    <button
                      className="procedure__action-btn procedure__view-btn"
                      onClick={() => handleViewTramite(tramite)}
                      aria-label={`Ver contenido de ${tramite.title}`}
                      title="Ver contenido"
                    >
                      <MdVisibility size={20} />
                    </button>
                    <button
                      className="procedure__action-btn procedure__delete-btn"
                      onClick={() => handleDeleteTramite(tramite.id, tramite.title)}
                      aria-label={`Eliminar ${tramite.title}`}
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
              );
            })}
          </div>

          {tramites.length === 0 && !error && (
            <p className="procedures__no-users">No hay trámites registrados</p>
          )}

          {/* Add Tramite Modal */}
          {showAddModal && (
            <div className="procedures__modal-overlay">
              <div className="procedures__modal-content">
                <h3 className="procedures__modal-title">
                  Agregar Nuevo Trámite
                </h3>
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
                      La URL debe ser de un trámite de PAMI
                      (https://www.pami.org.ar/tramite/...)
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
                      disabled={adding}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="procedures__submit-btn"
                      disabled={adding}
                    >
                      {adding ? "Procesando..." : "Agregar Trámite"}
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
                  {selectedTramite.title}
                </h3>
                <div className="procedure__view-content">
                  <p>
                    <strong>URL:</strong>{" "}
                    <a
                      href={selectedTramite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedTramite.url}
                    </a>
                  </p>
                  <div className="procedure__content">
                    <h4>Descripción:</h4>
                    <p>{selectedTramite.description}</p>
                  </div>
                  <div className="procedure__content">
                    <h4>Información:</h4>
                    <p>
                      Este trámite ha sido procesado automáticamente desde la
                      URL de PAMI.
                    </p>
                    <p>
                      Para ver el contenido completo, haga clic en la URL de
                      arriba.
                    </p>
                  </div>
                </div>
                <div className="procedures__modal-buttons">
                  <button
                    className="procedures__cancel-btn"
                    onClick={closeModals}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default AdminProcedure;
