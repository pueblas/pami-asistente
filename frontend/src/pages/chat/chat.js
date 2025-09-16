import React, { useState } from "react";
import "./chat.css";
import { useNavigate } from 'react-router-dom';

function Chat() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();

  const userButton = () => {
    setMenuAbierto(!menuAbierto);
  };

  const closeSesion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate('/login')
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const userMsg = {
        author: "user",
        text: newMessage.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      setTimeout(() => {
        const botMsg = {
          author: "bot",
          text: "Respuesta automática",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }, 1000);

      setNewMessage("");
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
    sendMessage();
  };

  return (
    <>
      <header className="top-bar">
        <button className="user-button" onClick={userButton}>
          <img src="assets/usuario.jpg" alt="Usuario" />
        </button>
        {menuAbierto && (
          <div className="dropdown-menu">
            <ul>
              <li onClick={closeSesion}>Cerrar sesión</li>
            </ul>
          </div>
        )}
      </header>
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

            <div className="chat-input">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="🔍 Pregunta de PAMI"
              />
              <button onClick={sendAudio}>
                <i className="fa-solid fa-microphone"></i>
              </button>
              <button onClick={sendMessage}>Enviar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
