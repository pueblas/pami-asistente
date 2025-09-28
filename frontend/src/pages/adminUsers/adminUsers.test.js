import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminUsers from './adminUsers';

jest.mock('../../api/auth', () => ({
  fetchUsers: jest.fn(),
  deleteUser: jest.fn(),
  createAdminUser: jest.fn(),
}));

import { fetchUsers, deleteUser, createAdminUser } from '../../api/auth';
const mockFetchUsers = fetchUsers;
const mockDeleteUser = deleteUser;
const mockCreateAdminUser = createAdminUser;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const localStorageMock = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

window.confirm = jest.fn();

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

function renderAdminUsers() {
  return render(
    <BrowserRouter>
      <AdminUsers />
    </BrowserRouter>
  );
}

const mockUsers = [
  {
    id_usuario: 1,
    primer_nombre: 'Juan',
    apellido: 'Pérez',
    correo_electronico: 'juan@test.com',
    fecha_creacion: '2024-01-01T00:00:00Z'
  },
  {
    id_usuario: 2,
    primer_nombre: 'María',
    apellido: 'García',
    correo_electronico: 'maria@test.com',
    fecha_creacion: '2024-01-02T00:00:00Z'
  }
];

describe('AdminUsers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'access_token') return 'fake-token';
      if (key === 'role') return 'administrador';
      return null;
    });
  });

  describe('renders correctly', () => {
    test('displays loading state initially', () => {
      mockFetchUsers.mockImplementation(() => new Promise(() => {}));
      renderAdminUsers();
      
      expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
    });

    test('displays all main elements after loading', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Crear Admin')).toBeInTheDocument();
      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    test('displays users in table', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María García')).toBeInTheDocument();
        expect(screen.getByText('juan@test.com')).toBeInTheDocument();
        expect(screen.getByText('maria@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('authorization', () => {
    test('redirects to login when no token', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return null;
        if (key === 'role') return 'administrador';
        return null;
      });
      
      renderAdminUsers();
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('redirects to login when role is not administrador', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return 'fake-token';
        if (key === 'role') return 'usuario';
        return null;
      });
      
      renderAdminUsers();
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('redirects to login on 401 error', async () => {
      mockFetchUsers.mockRejectedValue({
        response: { status: 401 }
      });
      
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText(/No autorizado/)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
    });
  });

  describe('user creation', () => {
    test('shows create form when button clicked', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      const user = userEvent.setup();
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Crear Admin')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Crear Admin'));
      
      expect(screen.getByText('Crear Nuevo Administrador')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Primer Nombre')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Apellido')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    test('creates new admin user successfully', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      mockCreateAdminUser.mockResolvedValue({});
      const user = userEvent.setup();
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Crear Admin')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Crear Admin'));
      
      await user.type(screen.getByPlaceholderText('Primer Nombre'), 'Carlos');
      await user.type(screen.getByPlaceholderText('Apellido'), 'López');
      await user.type(screen.getByPlaceholderText('Email'), 'carlos@test.com');
      await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');
      
      await user.click(screen.getByText('Crear Administrador'));
      
      await waitFor(() => {
        expect(mockCreateAdminUser).toHaveBeenCalledWith({
          primer_nombre: 'Carlos',
          segundo_nombre: '',
          apellido: 'López',
          correo_electronico: 'carlos@test.com',
          password: 'password123'
        }, 'fake-token');
      });
      
      expect(mockFetchUsers).toHaveBeenCalledTimes(2);
    });

    test('shows error when user creation fails', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      mockCreateAdminUser.mockRejectedValue({
        response: {
          data: {
            detail: 'Email ya existe'
          }
        }
      });
      const user = userEvent.setup();
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Crear Admin')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Crear Admin'));
      await user.type(screen.getByPlaceholderText('Primer Nombre'), 'Carlos');
      await user.type(screen.getByPlaceholderText('Apellido'), 'López');
      await user.type(screen.getByPlaceholderText('Email'), 'carlos@test.com');
      await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');
      await user.click(screen.getByText('Crear Administrador'));
      
      await waitFor(() => {
        expect(screen.getByText('Email ya existe')).toBeInTheDocument();
      });
    });
  });

  describe('user deletion', () => {
    test('deletes user when confirmed', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      mockDeleteUser.mockResolvedValue({});
      window.confirm.mockReturnValue(true);
      const user = userEvent.setup();
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));
      await user.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que querés eliminar al usuario juan@test.com?');
      
      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalledWith(1, 'fake-token');
      });
      
      expect(mockFetchUsers).toHaveBeenCalledTimes(2);
    });

    test('does not delete user when cancelled', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      window.confirm.mockReturnValue(false);
      const user = userEvent.setup();
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));
      await user.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    test('shows error when deletion fails', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      mockDeleteUser.mockRejectedValue({
        response: {
          data: {
            detail: 'No se puede eliminar este usuario'
          }
        }
      });
      window.confirm.mockReturnValue(true);
      const user = userEvent.setup();
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('No se puede eliminar este usuario')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    test('navigates to login when logout button clicked', async () => {
      mockFetchUsers.mockResolvedValue(mockUsers);
      const user = userEvent.setup();
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Cerrar Sesión'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('empty state', () => {
    test('shows no users message when list is empty', async () => {
      mockFetchUsers.mockResolvedValue([]);
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('No hay usuarios registrados')).toBeInTheDocument();
      });
    });
  });
});