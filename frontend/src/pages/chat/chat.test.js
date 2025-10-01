import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Chat from './chat';

jest.mock('../../api/auth', () => ({
  fetchUsers: jest.fn(),
}));

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
jest.spyOn(console, 'error').mockImplementation(() => {});

jest.useFakeTimers();

function renderChat() {
  return render(
    <BrowserRouter>
      <Chat />
    </BrowserRouter>
  );
}

describe('Chat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'access_token') return 'fake-token';
      if (key === 'role') return 'usuario';
      return null;
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('renders correctly', () => {
    test('displays all main elements', () => {
      renderChat();
      
      expect(screen.getByAltText('Usuario')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('🔍 Pregunta de PAMI')).toBeInTheDocument();
      expect(screen.getByText('Enviar')).toBeInTheDocument();
    });

    test('has correct input attributes', () => {
      renderChat();
      
      const messageInput = screen.getByPlaceholderText('🔍 Pregunta de PAMI');
      expect(messageInput).toBeInTheDocument();
      expect(messageInput.tagName).toBe('INPUT');
    });
  });

  describe('authorization', () => {
    test('redirects to login when no token', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return null;
        if (key === 'role') return 'usuario';
        return null;
      });
      
      renderChat();
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('redirects to login when role is not usuario', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return 'fake-token';
        if (key === 'role') return 'administrador';
        return null;
      });
      
      renderChat();
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('does not redirect when token and role are valid', () => {
      renderChat();
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('user menu', () => {
    test('shows dropdown menu when user button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const userButton = screen.getByAltText('Usuario').closest('button');
      await user.click(userButton);
      
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    });

    test('hides dropdown menu when user button clicked again', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const userButton = screen.getByAltText('Usuario').closest('button');
      
      await user.click(userButton);
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
      
      await user.click(userButton);
      expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument();
    });

    test('logs out and redirects when cerrar sesión clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const userButton = screen.getByAltText('Usuario').closest('button');
      await user.click(userButton);
      
      const logoutButton = screen.getByText('Cerrar sesión');
      await user.click(logoutButton);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('role');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('message functionality', () => {
    test('sends message when send button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const messageInput = screen.getByPlaceholderText('🔍 Pregunta de PAMI');
      const sendButton = screen.getByText('Enviar');
      
      await user.type(messageInput, 'Hola, ¿cómo estás?');
      await user.click(sendButton);
      
      expect(screen.getByText('Hola, ¿cómo estás?')).toBeInTheDocument();
      expect(messageInput.value).toBe('');
    });

    test('sends message when Enter key pressed', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const messageInput = screen.getByPlaceholderText('🔍 Pregunta de PAMI');
      
      await user.type(messageInput, 'Mensaje con Enter{enter}');
      
      expect(screen.getByText('Mensaje con Enter')).toBeInTheDocument();
      expect(messageInput.value).toBe('');
    });

    test('trims whitespace from messages', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const messageInput = screen.getByPlaceholderText('🔍 Pregunta de PAMI');
      const sendButton = screen.getByText('Enviar');
      
      await user.type(messageInput, '  Mensaje con espacios  ');
      await user.click(sendButton);
      
      expect(screen.getByText('Mensaje con espacios')).toBeInTheDocument();
    });

    test('shows bot response after user message', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const messageInput = screen.getByPlaceholderText('🔍 Pregunta de PAMI');
      const sendButton = screen.getByText('Enviar');
      
      await user.type(messageInput, 'Pregunta para el bot');
      await user.click(sendButton);
      
      expect(screen.getByText('Pregunta para el bot')).toBeInTheDocument();
      
      // Wait for bot response (any response from the mocked API)
      await waitFor(() => {
        const botMessages = screen.getAllByText((_, element) => {
          return element && element.closest('.bot-msg') !== null;
        });
        expect(botMessages.length).toBeGreaterThan(0);
      });
    });

  describe('feedback functionality', () => {
    test('logs thumbs up feedback', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const messageInput = screen.getByPlaceholderText('🔍 Pregunta de PAMI');
      await user.type(messageInput, 'Pregunta');
      await user.click(screen.getByText('Enviar'));
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('👍')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('👍'));
      
      expect(console.log).toHaveBeenCalledWith('Usuario dio pulgar arriba');
    });

    test('logs thumbs down feedback', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderChat();
      
      const messageInput = screen.getByPlaceholderText('🔍 Pregunta de PAMI');
      await user.type(messageInput, 'Pregunta');
      await user.click(screen.getByText('Enviar'));
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('👎')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('👎'));
      
      expect(console.log).toHaveBeenCalledWith('Usuario dio pulgar abajo');
    });
    });
  });
});