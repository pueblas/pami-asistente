import axios from 'axios';

const API_URL = 'http://localhost:8000/auth/';
const ADMIN_API_URL = 'http://localhost:8000/admin/';

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
  const response = await axios.post(
    `${ADMIN_API_URL}users`,
    userData,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

