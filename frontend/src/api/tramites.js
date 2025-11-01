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
 * Obtener lista de trámites almacenados en ChromaDB con título, URL y descripción (solo admin)
 * @param {string} token - Token de autenticación del administrador
 * @returns {Promise} Response con total y lista de trámites con título, URL y descripción
 */
export async function getTramitesList(token) {
  const response = await axios.get(
    `${ADMIN_API_URL}tramites-list`,
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
 * Eliminar un trámite por su ID (solo admin)
 * @param {string} tramiteId - ID del trámite a eliminar
 * @param {string} token - Token de autenticación del administrador
 * @returns {Promise} Response con mensaje de confirmación
 */
export async function deleteTramiteById(tramiteId, token) {
  const response = await axios.delete(
    `${ADMIN_API_URL}tramites/${tramiteId}`,
    { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );

  return response.data;
}