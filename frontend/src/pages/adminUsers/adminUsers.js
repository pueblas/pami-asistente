import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDelete, MdSettings } from 'react-icons/md';
import { fetchUsers, deleteUser, createAdminUser, updateUserRole } from '../../api/auth';
import './adminUsers.css';

function AdminUsers() {
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
      <div className="admin-container">
        <div className="admin-box">
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-box">
        <div className="admin-header">
          <h2>Gestión de Usuarios</h2>
          <button 
            className="create-user-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancelar' : 'Crear Usuario'}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
        
        {showCreateForm && (
          <div className="create-user-form">
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser}>
              <input
                type="text"
                placeholder="Primer Nombre"
                value={newUser.primer_nombre}
                onChange={(e) => setNewUser({...newUser, primer_nombre: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Segundo Nombre (opcional)"
                value={newUser.segundo_nombre}
                onChange={(e) => setNewUser({...newUser, segundo_nombre: e.target.value})}
              />
              <input
                type="text"
                placeholder="Apellido"
                value={newUser.apellido}
                onChange={(e) => setNewUser({...newUser, apellido: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.correo_electronico}
                onChange={(e) => setNewUser({...newUser, correo_electronico: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
              
              <div className="role-selection">
                <label htmlFor="rol">Rol del Usuario:</label>
                <select
                  id="rol"
                  value={newUser.rol}
                  onChange={(e) => setNewUser({...newUser, rol: e.target.value})}
                  required
                >
                  <option value="usuario">Usuario</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              
              <button type="submit" className="submit-btn">
                Crear {newUser.rol === 'administrador' ? 'Administrador' : 'Usuario'}
              </button>
            </form>
          </div>
        )}
        
        <div className="users-table">
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
                      className="config-btn"
                      onClick={() => handleOpenUserModal(user)}
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
          <p className="no-users">No hay usuarios registrados</p>
        )}

        {/* Modal para editar usuario */}
        {showUserModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Configurar Usuario</h3>
              <p><strong>Usuario:</strong> {selectedUser.primer_nombre} {selectedUser.apellido}</p>
              <p><strong>Email:</strong> {selectedUser.correo_electronico}</p>
              <p><strong>Rol actual:</strong> {selectedUser.rol}</p>
              
              {modalError && (
                <div className="modal-error">
                  {modalError}
                </div>
              )}
              
              <div className="modal-actions">
                <div className="role-section">
                  <h4>Cambiar Rol:</h4>
                  <button 
                    className={`role-btn ${selectedUser.rol === 'usuario' ? 'active' : ''}`}
                    onClick={() => handleUpdateUserRole('usuario')}
                    disabled={selectedUser.rol === 'usuario'}
                  >
                    Usuario
                  </button>
                  <button 
                    className={`role-btn ${selectedUser.rol === 'administrador' ? 'active' : ''}`}
                    onClick={() => handleUpdateUserRole('administrador')}
                    disabled={selectedUser.rol === 'administrador'}
                  >
                    Administrador
                  </button>
                </div>
                
                <div className="danger-section">
                  <h4>Zona de Peligro:</h4>
                  <button 
                    className="delete-user-btn"
                    onClick={() => handleDeleteUser(selectedUser.id_usuario, selectedUser.correo_electronico)}
                  >
                    <MdDelete size={16}/> Eliminar Usuario
                  </button>
                </div>
              </div>
              
              <div className="modal-buttons">
                <button className="cancel-btn" onClick={handleCloseUserModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="admin-actions">
          <button onClick={() => navigate('/login')} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;