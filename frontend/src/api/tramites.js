import axios from 'axios';

const ADMIN_API_URL = 'http://localhost:8000/admin/';

// ===== FUNCIONES DE GESTIÓN DE TRÁMITES URLs =====

/**
 * Obtener todas las URLs de trámites configuradas (solo admin)
 * @param {string} token - Token de autenticación del administrador
 * @returns {Promise} Response con total y lista de URLs
 */
export async function getTramitesUrls(token) {
  const response = await axios.get(
    `${ADMIN_API_URL}tramites-urls`,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

/**
 * Agregar una nueva URL de trámite (solo admin)
 * @param {string} url - URL del trámite de PAMI
 * @param {string} token - Token de autenticación del administrador
 * @returns {Promise} Response con mensaje de éxito y datos del trámite
 */
export async function addTramiteUrl(url, token) {
  const data = {
    url: url
  };

  const response = await axios.post(
    `${ADMIN_API_URL}tramites-urls`,
    data,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}

/**
 * Eliminar una URL de trámite por su índice (solo admin)
 * @param {number} urlIndex - Índice de la URL a eliminar
 * @param {string} token - Token de autenticación del administrador
 * @returns {Promise} Response con mensaje de confirmación
 */
export async function deleteTramiteUrl(urlIndex, token) {
  const response = await axios.delete(
    `${ADMIN_API_URL}tramites-urls/${urlIndex}`,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}