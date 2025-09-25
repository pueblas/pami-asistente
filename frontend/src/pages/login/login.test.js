import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './login';


jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
}));


jest.mock('../../api/auth', () => ({
  loginUsuario: jest.fn(),
}));

import { loginUsuario } from '../../api/auth';
const mockLoginUsuario = loginUsuario;

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


jest.spyOn(console, 'log').mockImplementation(() => {});

function renderLogin() {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
}

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('renders correctly', () => {
    test('displays all form elements', () => {
      renderLogin();
      
      expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Entrar')).toBeInTheDocument();
      expect(screen.getByText('¿No tenés cuenta?')).toBeInTheDocument();
      expect(screen.getByText('Olvidé mi contraseña')).toBeInTheDocument();
    });

    test('has correct input types and attributes', () => {
      renderLogin();
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });
  });


  describe('login functionality', () => {
    test('successful login with user role navigates to chat', async () => {
    // Arrange: Mock successful API response
    mockLoginUsuario.mockResolvedValue({
      access_token: 'fake-user-token-123',
      role: 'usuario'
    });

    const user = userEvent.setup();
    renderLogin();

    // Act: Fill in the form and submit
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    const submitButton = screen.getByText('Entrar');

    await user.type(emailInput, 'user@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Assert: Check the expected behavior
    await waitFor(() => {
      // API was called with correct parameters
      expect(mockLoginUsuario).toHaveBeenCalledWith('user@test.com', 'password123');
      
      // Token and role saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'fake-user-token-123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('role', 'usuario');
      
      // Navigation to chat occurred
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });

    // No error message should be displayed
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  test('successful login with admin role navigates to admin center', async () => {
    // Arrange: Mock successful API response for admin
    mockLoginUsuario.mockResolvedValue({
      access_token: 'fake-admin-token-456',
      role: 'admin'
    });

    const user = userEvent.setup();
    renderLogin();

    // Act: Fill in the form and submit
    await user.type(screen.getByPlaceholderText('Email'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'adminpass');
    await user.click(screen.getByText('Entrar'));

    // Assert: Check admin-specific behavior
    await waitFor(() => {
      expect(mockLoginUsuario).toHaveBeenCalledWith('admin@test.com', 'adminpass');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'fake-admin-token-456');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('role', 'admin');
      expect(mockNavigate).toHaveBeenCalledWith('/admin-center');
    });
    });
  });
});