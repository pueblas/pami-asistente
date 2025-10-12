import { useState, useEffect } from "react";
import "./chat.css";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import { enviarConsulta } from "../../api/auth";
import { FaThumbsUp, FaThumbsDown, FaMicrophone } from "react-icons/fa";

function Chat() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const loadingMessages = [
    "Entiendo tu consulta, estoy buscando la mejor respuesta",
    "Revisando toda la información de PAMI para ayudarte",
    "Tomándome el tiempo necesario para darte una respuesta completa",
    "Analizando tu situación paso a paso",
    "Consultando la base de datos para resolver tu duda",
    "Estoy aca para ayudarte, buscando la información exacta",
    "Verificando todos los detalles para darte la respuesta correcta",
    "Revisando los requisitos específicos para tu consulta",
    "Procesando tu consulta con cuidado y atención",
    "Buscando la información más actualizada",
    "Revisando las normativas vigentes de PAMI",
    "Analizando las mejores opciones para tu caso",
  ];

  const sendMessage = async () => {
    if (newMessage.trim() && !isLoading) {
      const userMsg = {
        author: "user",
        text: newMessage.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setNewMessage("");
      setIsLoading(true);

      // Scroll automático después de agregar mensaje del usuario
      setTimeout(() => {
        const chatBox = document.querySelector('.chat__box');
        if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }, 50);

      try {
        const token = localStorage.getItem("access_token");
        const response = await enviarConsulta(userMsg.text, token);

        const botMsg = {
          author: "bot",
          text: response.respuesta,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
        
        // Scroll automático al final después de un breve delay
        setTimeout(() => {
          const chatBox = document.querySelector('.chat__box');
          if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error("Error enviando consulta:", error);

        const errorMsg = {
          author: "bot",
          text: "Lo siento, hubo un error al procesar tu consulta. Por favor, intentá nuevamente.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMsg]);
        
        // Scroll automático al final en caso de error también
        setTimeout(() => {
          const chatBox = document.querySelector('.chat__box');
          if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        }, 100);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const enviarFeedback = (tipo) => {
    if (tipo === "up") {
      console.log("Usuario dio pulgar arriba");
    } else {
      console.log("Usuario dio pulgar abajo");
    }
  };

  const sendAudio = () => {
    // Funcionalidad de audio pendiente para futuro sprint
    console.log("Funcionalidad de audio pendiente");
  };

  useEffect(() => {
    const validarAcceso = () => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("role");
      if (!token || role !== "usuario") {
        navigate("/login");
      } else {
        setIsLoading(false);
      }
    };
    validarAcceso();
  }, [navigate]);

  useEffect(() => {
    let interval;

    if (isLoading) {
      // Establecer mensaje inicial aleatorio
      const getRandomMessage = () => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        return loadingMessages[randomIndex];
      };

      setLoadingMessage(getRandomMessage());

      // Cambiar mensaje cada 2.5 segundos
      interval = setInterval(() => {
        setLoadingMessage(getRandomMessage());
      }, 4500);
    } else {
      // Limpiar mensaje cuando no está cargando
      setLoadingMessage("");
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, loadingMessages]);

  return (
    <>
      <TopBar
        menuAbierto={menuAbierto}
        onUserClick={() => setMenuAbierto(!menuAbierto)}
      />
      <div className="chat__wrapper">
        <div className="chat__container">
          <div className="chat__box">
            {messages.length === 0 && !isLoading && (
              <div className="chat__welcome-message">
                <div className="chat__welcome-content">
                  <h3>¡Bienvenido a Trámite Facíl!</h3>
                  <p>
                    Escribí tu consulta sobre trámites de PAMI y te ayudaré a
                    resolverla de la mejor manera.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.author === "user" ? "chat__user-msg" : "chat__bot-msg"
                }
              >
                <div className="chat__msg-text">{msg.text}</div>
                <div className="chat__msg-time">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {msg.author === "bot" && (
                  <div className="chat__feedback-buttons">
                    <button
                      className="chat__thumb-btn"
                      onClick={() => enviarFeedback("up")}
                      aria-label="Calificar respuesta como útil"
                    >
                      <FaThumbsUp />
                    </button>
                    <button
                      className="chat__thumb-btn"
                      onClick={() => enviarFeedback("down")}
                      aria-label="Calificar respuesta como no útil"
                    >
                      <FaThumbsDown />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat__bot-msg">
                <div className="chat__msg-text chat__loading-message">
                  {loadingMessage}
                  <span className="chat__loading-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </div>
            )}

            <div className="chat__input">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Pregunta de PAMI"
                disabled={isLoading}
              />
              <button
                onClick={sendAudio}
                disabled={isLoading}
                aria-label="Enviar mensaje de audio"
              >
                <FaMicrophone />
              </button>
              <button
                onClick={sendMessage}
                disabled={isLoading}
                aria-label="Enviar mensaje"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
