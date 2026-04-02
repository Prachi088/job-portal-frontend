import React, { useState } from "react";
import { sendMessage } from "../services/api"; // ✅ connect backend

const ChatBox = () => {
  const [messages, setMessages] = useState([
    { text: "Hello 👋 How can I help you?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // 🔥 typing indicator

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };

    // add user message
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendMessage(input);

      const botReply = {
        text: res.data.reply,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { text: "Server error 😢", sender: "bot" },
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.chatContainer}>
        
        <div style={styles.header}>
          💬 AI Chat
        </div>

        <div style={styles.chatArea}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                alignSelf:
                  msg.sender === "user" ? "flex-end" : "flex-start",
                backgroundColor:
                  msg.sender === "user" ? "#007bff" : "#e5e5ea",
                color: msg.sender === "user" ? "white" : "black",
              }}
            >
              {msg.text}
            </div>
          ))}

          {/* 🔥 Typing indicator */}
          {loading && (
            <div style={{ ...styles.message, background: "#e5e5ea" }}>
              Typing...
            </div>
          )}
        </div>

        <div style={styles.inputArea}>
          <input
            type="text"
            placeholder="Ask anything about jobs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleSend()} // 🔥 enter support
          />
          <button onClick={handleSend} style={styles.button}>
            ➤
          </button>
        </div>

      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f2f5",
  },
  chatContainer: {
    width: "350px",
    height: "500px",
    background: "#fff",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  header: {
    padding: "15px",
    background: "#007bff",
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  chatArea: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  message: {
    padding: "10px 14px",
    borderRadius: "15px",
    maxWidth: "70%",
    fontSize: "14px",
  },
  inputArea: {
    display: "flex",
    borderTop: "1px solid #ddd",
  },
  input: {
    flex: 1,
    padding: "12px",
    border: "none",
    outline: "none",
  },
  button: {
    padding: "0 15px",
    border: "none",
    background: "#007bff",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
  },
};

export default ChatBox;