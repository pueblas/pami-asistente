import axios from 'axios';

const API_URL = 'http://localhost:8000/auth/';
const ADMIN_API_URL = 'http://localhost:8000/admin/';
const CHAT_API_URL = 'http://localhost:8000/chat/';

export async function loginUsuario(email, password) {
  const data = {
    correo_electronico: email,
    password: password
  };

  const response = await axios.post(
    `${API_URL}login`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return response.data;
}

export async function fetchUsers(token) {
  const response = await axios.get(
    `${ADMIN_API_URL}users`,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

export async function deleteUser(userId, token) {
  const response = await axios.delete(
    `${ADMIN_API_URL}users/${userId}`,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

export async function createAdminUser(userData, token) {
  // Mantener compatibilidad: si no se especifica rol, usar 'administrador'
  const dataWithRole = {
    ...userData,
    rol: userData.rol || 'administrador'
  };
  
  const response = await axios.post(
    `${ADMIN_API_URL}users`,
    dataWithRole,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

export async function updateUserRole(userId, newRole, token) {
  const response = await axios.put(
    `${ADMIN_API_URL}users/${userId}/role`,
    { new_role: newRole },
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

// ===== FUNCIONES DE CHAT =====

export async function enviarConsulta(mensaje, token) {
  const response = await axios.post(
    `${CHAT_API_URL}consulta`,
    { mensaje: mensaje },
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

export async function limpiarContexto(token) {
  const response = await axios.delete(
    `${CHAT_API_URL}contexto`,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

