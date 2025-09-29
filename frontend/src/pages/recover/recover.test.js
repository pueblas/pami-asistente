import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Recover from './recover';

global.fetch = jest.fn();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

function renderRecover() {
  return render(
    <BrowserRouter>
      <Recover />
    </BrowserRouter>
  );
}

describe('Recover Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('renders correctly', () => {
    test('displays all form elements', () => {
      renderRecover();
      
      expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Ingresa tu correo electrónico y te enviaremos las instrucciones')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
      expect(screen.getByText('Enviar Instrucciones')).toBeInTheDocument();
      expect(screen.getByText('← Volver al inicio de sesión')).toBeInTheDocument();
    });

    test('has correct input types and attributes', () => {
      renderRecover();
      
      const emailInput = screen.getByPlaceholderText('tu@correo.com');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
      expect(emailInput).toHaveAttribute('name', 'email');
    });
  });

  describe('recover functionality', () => {
    test('successful recovery request shows success message', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const user = userEvent.setup();
      renderRecover();

      const emailInput = screen.getByPlaceholderText('tu@correo.com');
      const submitButton = screen.getByText('Enviar Instrucciones');

      await user.type(emailInput, 'user@test.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('http://localhost:8000/auth/recover?email=user%40test.com'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'accept': 'application/json',
            },
          })
        );
      });

      expect(await screen.findByText(/Se ha enviado un correo con las instrucciones/i)).toBeInTheDocument();
      expect(emailInput.value).toBe('');
    });

    test('shows error when email is empty', async () => {
      const user = userEvent.setup();
      renderRecover();

      const submitButton = screen.getByText('Enviar Instrucciones');
      await user.click(submitButton);

      expect(await screen.findByText(/Por favor ingresa un correo electrónico/i)).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });

    test('shows error with invalid response', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          detail: 'Usuario no encontrado'
        }),
      });

      const user = userEvent.setup();
      renderRecover();

      const emailInput = screen.getByPlaceholderText('tu@correo.com');
      const submitButton = screen.getByText('Enviar Instrucciones');

      await user.type(emailInput, 'notfound@test.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('notfound%40test.com'),
          expect.any(Object)
        );
      });

      expect(await screen.findByText(/Usuario no encontrado/i)).toBeInTheDocument();
    });

    test('shows connection error when fetch fails', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderRecover();

      const emailInput = screen.getByPlaceholderText('tu@correo.com');
      const submitButton = screen.getByText('Enviar Instrucciones');

      await user.type(emailInput, 'user@test.com');
      await user.click(submitButton);

      expect(await screen.findByText(/Error de conexión. Por favor, intenta nuevamente./i)).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    test('button shows loading state during request', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      fetch.mockReturnValue(promise);

      const user = userEvent.setup();
      renderRecover();

      const emailInput = screen.getByPlaceholderText('tu@correo.com');
      const submitButton = screen.getByText('Enviar Instrucciones');

      await user.type(emailInput, 'user@test.com');
      await user.click(submitButton);

      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(emailInput).toBeDisabled();

      resolvePromise({
        ok: true,
        json: async () => ({}),
      });

      await waitFor(() => {
        expect(screen.getByText('Enviar Instrucciones')).toBeInTheDocument();
      });
    });
  });
});