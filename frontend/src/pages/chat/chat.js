import { useState, useEffect } from 'react';
import "./chat.css";
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import { enviarConsulta, limpiarContexto } from '../../api/auth';


function Chat() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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

      try {
        const token = localStorage.getItem("access_token");
        const response = await enviarConsulta(userMsg.text, token);

        const botMsg = {
          author: "bot",
          text: response.respuesta,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, botMsg]);
      } catch (error) {
        console.error("Error enviando consulta:", error);
        
        const errorMsg = {
          author: "bot",
          text: "Lo siento, hubo un error al procesar tu consulta. Por favor, intentá nuevamente.",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, errorMsg]);
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
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('role');
      if (!token || role !== 'usuario') {
        navigate('/login');
      } else {
        setIsLoading(false);
      }
    };
    validarAcceso();
  }, [navigate]);

  return (
    <>
      <TopBar
        menuAbierto={menuAbierto}
        onUserClick={() => setMenuAbierto(!menuAbierto)}
      />
      <div className="chat-wrapper">
        <div className="chat-container">
          <div className="chat-box">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.author === "user" ? "user-msg" : "bot-msg"}
              >
                <div className="msg-text">{msg.text}</div>
                <div className="msg-time">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {msg.author === "bot" && (
                  <div className="feedback-buttons">
                    <button
                      className="thumb-btn"
                      onClick={() => enviarFeedback("up")}
                    >
                      👍
                    </button>
                    <button
                      className="thumb-btn"
                      onClick={() => enviarFeedback("down")}
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="bot-msg">
                <div className="msg-text">Escribiendo...</div>
              </div>
            )}

            <div className="chat-input">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="🔍 Pregunta de PAMI"
                disabled={isLoading}
              />
              <button onClick={sendAudio} disabled={isLoading}>
                <i className="fa-solid fa-microphone"></i>
              </button>
              <button onClick={sendMessage} disabled={isLoading}>
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
