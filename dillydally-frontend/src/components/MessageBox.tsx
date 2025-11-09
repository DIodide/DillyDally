import React from "react";
import "../styles/MessageBox.css";

interface Message {
  id: string;
  text: string;
  timestamp: number;
  type?: "info" | "warning" | "success";
}

interface MessageBoxProps {
  messages?: Message[];
}

export const MessageBox: React.FC<MessageBoxProps> = ({ messages = [] }) => {
  return (
    <div className="message-box-container">
      <div className="message-box-header">
        <h3>Messages</h3>
      </div>
      <div className="message-box-content">
        {messages.length === 0 ? (
          <div className="message-placeholder">
            <p>No messages yet</p>
            <p className="message-hint">Messages will appear here</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <div key={message.id} className={`message-item ${message.type || "info"}`}>
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBox;

