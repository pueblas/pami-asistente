import axios from 'axios';

const API_URL = 'http://localhost:8000/auth/';

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

