import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDelete, MdSettings, MdChat } from 'react-icons/md';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { fetchUsers, deleteUser, createAdminUser, updateUserRole } from '../../api/auth';
import TopBar from '../../components/topBar';
import './adminUsers.css';

function AdminUsers() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalError, setModalError] = useState('');
  const [newUser, setNewUser] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    apellido: '',
    correo_electronico: '',
    password: '',
    rol: 'usuario'
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleOpenUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
    setModalError('');
  };

  const handleUpdateUserRole = async (newRole) => {
    if (!selectedUser) return;
    
    try {
      setModalError('');
      const token = localStorage.getItem('access_token');
      await updateUserRole(selectedUser.id_usuario, newRole, token);
      
      // Refresh users list
      const userData = await fetchUsers(token);
      setUsers(userData);
      handleCloseUserModal();
    } catch (err) {
      console.error('Error updating user role:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError('Error al actualizar el rol del usuario');
      }
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (window.confirm(`¿Estás seguro de que querés eliminar al usuario ${userEmail}?`)) {
      try {
        setModalError('');
        const token = localStorage.getItem('access_token');
        await deleteUser(userId, token);
        
        // Refresh users list
        const userData = await fetchUsers(token);
        setUsers(userData);
        
        // Close modal if it's open
        handleCloseUserModal();
      } catch (err) {
        console.error('Error deleting user:', err);
        if (err.response && err.response.data && err.response.data.detail) {
          setModalError(err.response.data.detail);
        } else {
          setModalError('Error al eliminar usuario');
        }
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await createAdminUser(newUser, token);
      
      // Reset form and hide it
      setNewUser({
        primer_nombre: '',
        segundo_nombre: '',
        apellido: '',
        correo_electronico: '',
        password: '',
        rol: 'usuario'
      });
      setShowCreateForm(false);
      setShowPassword(false);
      setError('');
      
      // Refresh users list
      const userData = await fetchUsers(token);
      setUsers(userData);
    } catch (err) {
      console.error('Error creating user:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al crear usuario');
      }
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('role');
        
        if (!token || role !== 'administrador') {
          navigate('/login');
          return;
        }

        const userData = await fetchUsers(token);
        setUsers(userData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        if (err.response && err.response.status === 401) {
          setError('No autorizado. Redirigiendo al login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Error al cargar usuarios');
        }
        setLoading(false);
      }
    };

    loadUsers();
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin__container">
        <div className="admin__box">
          <p>Cargando usuarios...</p>
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
      <div className="admin__container">
      <div className="admin__box">
        <div className="admin__header">
          <h2 className="admin__title">Gestión de Usuarios</h2>
          <div className="admin__header-actions">
            <button 
              className="admin__chat-btn"
              onClick={() => navigate('/chat')}
              aria-label="Ir al chat como administrador"
            >
              <MdChat size={20} />
              Chat
            </button>
            <button 
              className="admin__create-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
              aria-label={showCreateForm ? 'Cancelar creación de usuario' : 'Crear nuevo usuario'}
            >
              {showCreateForm ? 'Cancelar' : 'Crear Usuario'}
            </button>
          </div>
        </div>
        {error && <p className="admin__error">{error}</p>}
        
        {showCreateForm && (
          <div className="admin__form">
            <h3 className="admin__form-title">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} className="admin__form-content">
              <div>
                <label>Primer Nombre</label>
                <input
                  type="text"
                  value={newUser.primer_nombre}
                  onChange={(e) => setNewUser({...newUser, primer_nombre: e.target.value})}
                  required
                  className="admin__input"
                />
              </div>
              <div>
                <label>Segundo Nombre (opcional)</label>
                <input
                  type="text"
                  value={newUser.segundo_nombre}
                  onChange={(e) => setNewUser({...newUser, segundo_nombre: e.target.value})}
                  className="admin__input"
                />
              </div>
              <div>
                <label>Apellido</label>
                <input
                  type="text"
                  value={newUser.apellido}
                  onChange={(e) => setNewUser({...newUser, apellido: e.target.value})}
                  required
                  className="admin__input"
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.correo_electronico}
                  onChange={(e) => setNewUser({...newUser, correo_electronico: e.target.value})}
                  required
                  className="admin__input"
                />
              </div>
              <div>
                <label>Contraseña</label>
                <div className="admin__password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    className="admin__input"
                    placeholder="Debe incluir: mayúscula, número y carácter especial"
                  />
                  <button
                    type="button"
                    className="admin__password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div className="admin__role-selection">
                <label htmlFor="rol">Rol del Usuario:</label>
                <select
                  id="rol"
                  value={newUser.rol}
                  onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
                  required
                  className="admin__select"
                >
                  <option value="usuario">Usuario</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="admin__submit-btn"
                aria-label="Crear nuevo usuario con rol seleccionado"
              >
                Crear {newUser.rol === 'administrador' ? 'Administrador' : 'Usuario'}
              </button>
            </form>
          </div>
        )}
        
        {/* Mobile/Tablet: Cards Layout */}
        <div className="admin__users-mobile">
          {users.map((user) => (
            <div key={user.id_usuario} className="admin__user-card">
              <div className="admin__user-info">
                <div className="admin__user-email">{user.correo_electronico}</div>
                <div className="admin__user-name">{user.primer_nombre} {user.apellido}</div>
                <div className="admin__user-meta">
                  <span className={`admin__user-role admin__user-role--${user.rol}`}>
                    {user.rol}
                  </span>
                  <span className="admin__user-date">
                    {new Date(user.fecha_creacion).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                className="admin__user-config"
                onClick={() => handleOpenUserModal(user)}
                aria-label={`Configurar usuario ${user.primer_nombre} ${user.apellido}`}
              >
                <MdSettings size={24}/>
              </button>
            </div>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <div className="admin__table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id_usuario}>
                  <td>{user.id_usuario}</td>
                  <td>{user.primer_nombre} {user.apellido}</td>
                  <td>{user.correo_electronico}</td>
                  <td>{user.rol}</td>
                  <td>{new Date(user.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="admin__config-btn"
                      onClick={() => handleOpenUserModal(user)}
                      aria-label={`Configurar usuario ${user.primer_nombre} ${user.apellido}`}
                    >
                      <MdSettings size={20}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !error && (
          <p className="admin__no-users">No hay usuarios registrados</p>
        )}

        {/* Modal para editar usuario */}
        {showUserModal && selectedUser && (
          <div className="admin__modal-overlay">
            <div className="admin__modal-content">
              <h3 className="admin__modal-title">Configurar Usuario</h3>
              <p><strong>Usuario:</strong> {selectedUser.primer_nombre} {selectedUser.apellido}</p>
              <p><strong>Email:</strong> {selectedUser.correo_electronico}</p>
              <p><strong>Rol actual:</strong> {selectedUser.rol}</p>
              
              {modalError && (
                <div className="admin__modal-error">
                  {modalError}
                </div>
              )}
              
              <div className="admin__modal-actions">
                <div className="admin__role-section">
                  <h4>Cambiar Rol:</h4>
                  <button 
                    className={`admin__role-btn ${selectedUser.rol === 'usuario' ? 'active' : ''}`}
                    onClick={() => handleUpdateUserRole('usuario')}
                    disabled={selectedUser.rol === 'usuario'}
                    aria-label="Cambiar rol a usuario"
                  >
                    Usuario
                  </button>
                  <button 
                    className={`admin__role-btn ${selectedUser.rol === 'administrador' ? 'active' : ''}`}
                    onClick={() => handleUpdateUserRole('administrador')}
                    disabled={selectedUser.rol === 'administrador'}
                    aria-label="Cambiar rol a administrador"
                  >
                    Administrador
                  </button>
                </div>
                
                <div className="admin__danger-section">
                  <h4>Zona de Peligro:</h4>
                  <button 
                    className="admin__delete-btn"
                    onClick={() => handleDeleteUser(selectedUser.id_usuario, selectedUser.correo_electronico)}
                    aria-label={`Eliminar usuario ${selectedUser.primer_nombre} ${selectedUser.apellido}`}
                  >
                    <MdDelete size={16}/> Eliminar Usuario
                  </button>
                </div>
              </div>
              
              <div className="admin__modal-buttons">
                <button 
                  className="admin__cancel-btn" 
                  onClick={handleCloseUserModal}
                  aria-label="Cerrar modal de configuración"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="admin__actions">
          <button 
            onClick={() => navigate('/login')} 
            className="admin__logout-btn"
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

export default AdminUsers;