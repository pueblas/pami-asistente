import axios from 'axios';

const API_URL = 'http://localhost:8000/auth/';
const ADMIN_API_URL = 'http://localhost:8000/admin/';
const CHAT_API_URL = 'http://localhost:8000/chat/';
const PROCEDURES_API_URL = 'http://localhost:8000/procedures/';

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

// ===== FUNCIONES DE PROCEDIMIENTOS =====

// Mock data para procedimientos PAMI con caracteres correctos
const mockProceduresData = [
  {
    id: 1,
    title: "Solicitud de Afiliación",
    url: "https://www.pami.org.ar/tramites/afiliacion",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    dateCreated: "2024-01-15"
  },
  {
    id: 2,
    title: "Autorización de Medicamentos",
    url: "https://www.pami.org.ar/tramites/medicamentos",
    content: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    dateCreated: "2024-01-10"
  },
  {
    id: 3,
    title: "Credencial y Renovación",
    url: "https://www.pami.org.ar/tramites/credencial",
    content: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt.",
    dateCreated: "2024-01-05"
  },
  {
    id: 4,
    title: "Subsidio por Fallecimiento",
    url: "https://www.pami.org.ar/tramites/subsidio-fallecimiento",
    content: "Ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    dateCreated: "2024-01-01"
  }
];

// Simulamos almacenamiento local para los procedimientos
let proceduresStorage = [...mockProceduresData];

export async function fetchProcedures(token) {
  // Simular llamada a API con delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: proceduresStorage });
    }, 300);
  });
}

export async function createProcedure(procedureData, token) {
  // Simular llamada a API con delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = Math.max(...proceduresStorage.map(p => p.id), 0) + 1;
      const newProcedure = {
        ...procedureData,
        id: newId,
        dateCreated: new Date().toISOString().split('T')[0],
        content: 'Contenido será parseado desde la URL en futuras versiones. Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
      };
      
      proceduresStorage.push(newProcedure);
      resolve({ data: newProcedure });
    }, 300);
  });
}

export async function updateProcedure(procedureId, procedureData, token) {
  // Simular llamada a API con delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = proceduresStorage.findIndex(p => p.id === procedureId);
      if (index !== -1) {
        proceduresStorage[index] = { ...proceduresStorage[index], ...procedureData };
        resolve({ data: proceduresStorage[index] });
      } else {
        reject(new Error('Procedimiento no encontrado'));
      }
    }, 300);
  });
}

export async function deleteProcedure(procedureId, token) {
  // Simular llamada a API con delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = proceduresStorage.findIndex(p => p.id === procedureId);
      if (index !== -1) {
        const deleted = proceduresStorage.splice(index, 1)[0];
        resolve({ data: deleted });
      } else {
        reject(new Error('Procedimiento no encontrado'));
      }
    }, 300);
  });
}