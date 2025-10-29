import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdAdd, MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import {
  fetchProcedures,
  createProcedure,
  updateProcedure,
  deleteProcedure,
} from "../../api/auth";
import TopBar from "../../components/topBar/TopBar";
import "./adminProcedure.css";

function AdminProcedure() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [newProcedure, setNewProcedure] = useState({
    title: "",
    url: "",
    content: "",
  });
  const navigate = useNavigate();

  // URL validation for PAMI domain
  const validatePamiUrl = (url) => {
    const pamiPattern =
      /^https:\/\/www\.pami\.org\.ar\/tramites\/[a-zA-Z0-9\-]+$/;
    return pamiPattern.test(url);
  };

  const handleAddProcedure = () => {
    setNewProcedure({ title: "", url: "", content: "" });
    setModalError("");
    setShowAddModal(true);
  };

  const handleViewProcedure = (procedure) => {
    setSelectedProcedure(procedure);
    setShowViewModal(true);
  };

  const handleEditProcedure = (procedure) => {
    setSelectedProcedure(procedure);
    setNewProcedure({
      title: procedure.title,
      url: procedure.url,
      content: procedure.content,
    });
    setModalError("");
    setShowEditModal(true);
  };

  const handleDeleteProcedure = async (procedureId, procedureTitle) => {
    if (
      window.confirm(
        `¿Estás seguro de que querés eliminar el trámite "${procedureTitle}"?`
      )
    ) {
      try {
        const token = localStorage.getItem("access_token");
        await deleteProcedure(procedureId, token);

        // Refresh procedures list
        const response = await fetchProcedures(token);
        setProcedures(response.data);
      } catch (err) {
        console.error("Error deleting procedure:", err);
        setError("Error al eliminar procedimiento");
      }
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();

    if (!validatePamiUrl(newProcedure.url)) {
      setModalError(
        "La URL debe ser del dominio https://www.pami.org.ar/tramites/"
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await createProcedure(newProcedure, token);

      // Refresh procedures list
      const response = await fetchProcedures(token);
      setProcedures(response.data);

      setShowAddModal(false);
      setNewProcedure({ title: "", url: "", content: "" });
      setModalError("");
    } catch (err) {
      console.error("Error creating procedure:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError("Error al crear tramite");
      }
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("access_token");
      await updateProcedure(
        selectedProcedure.id,
        { title: newProcedure.title },
        token
      );

      // Refresh procedures list
      const response = await fetchProcedures(token);
      setProcedures(response.data);

      setShowEditModal(false);
      setSelectedProcedure(null);
      setModalError("");
    } catch (err) {
      console.error("Error updating procedure:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError("Error al actualizar tramite");
      }
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedProcedure(null);
    setModalError("");
  };

  useEffect(() => {
    const loadProcedures = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const role = localStorage.getItem("role");

        if (!token || role !== "administrador") {
          navigate("/login");
          return;
        }

        const response = await fetchProcedures(token);
        setProcedures(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading procedures:", err);
        setError("Error al cargar tramites");
        setLoading(false);
      }
    };

    loadProcedures();
  }, [navigate]);

  if (loading) {
    return (
      <div className="procedures__container">
        <div className="procedures__box">
          <p>Cargando tramites...</p>
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
            <h2 className="procedures__title">Gestión de Tramites</h2>
            <div className="procedures__header-actions">
              <button
                className="procedures__create-btn"
                onClick={handleAddProcedure}
                aria-label="Agregar nuevo procedimiento"
              >
                <MdAdd size={20} />
                Agregar Tramite
              </button>
            </div>
          </div>

          {error && <p className="procedures__error">{error}</p>}

          {/* Mobile-first Cards Layout */}
          <div className="procedures__grid">
            {procedures.map((procedure) => (
              <div key={procedure.id} className="procedure__card">
                <div className="procedure__header">
                  <h3 className="procedure__title">{procedure.title}</h3>
                  <div className="procedure__actions">
                    <button
                      className="procedure__action-btn procedure__view-btn"
                      onClick={() => handleViewProcedure(procedure)}
                      aria-label={`Ver contenido de ${procedure.title}`}
                      title="Ver contenido"
                    >
                      <MdVisibility size={20} />
                    </button>
                    <button
                      className="procedure__action-btn procedure__edit-btn"
                      onClick={() => handleEditProcedure(procedure)}
                      aria-label={`Editar ${procedure.title}`}
                      title="Editar titulo"
                    >
                      <MdEdit size={20} />
                    </button>
                    <button
                      className="procedure__action-btn procedure__delete-btn"
                      onClick={() =>
                        handleDeleteProcedure(procedure.id, procedure.title)
                      }
                      aria-label={`Eliminar ${procedure.title}`}
                      title="Eliminar procedimiento"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                </div>
                <div className="procedure__info">
                  <p className="procedure__url">{procedure.url}</p>
                  <p className="procedure__date">
                    Creado:{" "}
                    {new Date(procedure.dateCreated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {procedures.length === 0 && !error && (
            <p className="procedures__no-users">No hay tramites registrados</p>
          )}

          {/* Add Procedure Modal */}
          {showAddModal && (
            <div className="procedures__modal-overlay">
              <div className="procedures__modal-content">
                <h3 className="procedures__modal-title">Agregar Nuevo Tramite</h3>
                <form
                  onSubmit={handleSubmitAdd}
                  className="procedures__form-content"
                >
                  <div>
                    <label htmlFor="procedure-title">Titulo del Tramite</label>
                    <input
                      id="procedure-title"
                      type="text"
                      value={newProcedure.title}
                      onChange={(e) =>
                        setNewProcedure({
                          ...newProcedure,
                          title: e.target.value,
                        })
                      }
                      required
                      className="procedures__input"
                      placeholder="Ej: Solicitud de Afiliación"
                    />
                  </div>
                  <div>
                    <label htmlFor="procedure-url">URL del Procedimiento</label>
                    <input
                      id="procedure-url"
                      type="url"
                      value={newProcedure.url}
                      onChange={(e) =>
                        setNewProcedure({
                          ...newProcedure,
                          url: e.target.value,
                        })
                      }
                      required
                      className="procedures__input"
                      placeholder="https://www.pami.org.ar/tramites/nombre-tramite"
                    />
                    <small className="procedures__help-text">
                      La URL debe ser del dominio
                      https://www.pami.org.ar/tramites/
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
                      Agregar Tramite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Procedure Modal */}
          {showViewModal && selectedProcedure && (
            <div className="procedures__modal-overlay">
              <div className="procedures__modal-content procedures__modal-content--large">
                <h3 className="procedures__modal-title">
                  {selectedProcedure.title}
                </h3>
                <div className="procedure__view-content">
                  <p>
                    <strong>URL:</strong> {selectedProcedure.url}
                  </p>
                  <p>
                    <strong>Fecha de creación:</strong>{" "}
                    {new Date(
                      selectedProcedure.dateCreated
                    ).toLocaleDateString()}
                  </p>
                  <div className="procedure__content">
                    <h4>Contenido:</h4>
                    <p>{selectedProcedure.content}</p>
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

          {/* Edit Procedure Modal */}
          {showEditModal && selectedProcedure && (
            <div className="procedures__modal-overlay">
              <div className="procedures__modal-content">
                <h3 className="procedures__modal-title">Editar Tramite</h3>
                <form
                  onSubmit={handleSubmitEdit}
                  className="procedures__form-content"
                >
                  <div>
                    <label htmlFor="edit-procedure-title">
                      Titulo del Tramite
                    </label>
                    <input
                      id="edit-procedure-title"
                      type="text"
                      value={newProcedure.title}
                      onChange={(e) =>
                        setNewProcedure({
                          ...newProcedure,
                          title: e.target.value,
                        })
                      }
                      required
                      className="procedures__input"
                    />
                  </div>
                  <div>
                    <label>URL del Procedimiento (no editable)</label>
                    <input
                      type="url"
                      value={selectedProcedure.url}
                      disabled
                      className="procedures__input procedures__input--disabled"
                    />
                  </div>

                  <div className="procedures__modal-buttons">
                    <button
                      type="button"
                      className="procedures__cancel-btn"
                      onClick={closeModals}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="procedures__submit-btn">
                      Guardar Cambios
                    </button>
                  </div>
                </form>
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
