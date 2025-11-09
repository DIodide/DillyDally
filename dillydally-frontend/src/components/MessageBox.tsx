import React from "react";
import { useQuery } from "convex/react";
import { api } from "../lib/convexApi";
import type { Id } from "@convex/_generated/dataModel";
import "../styles/MessageBox.css";

interface Message {
  id: string;
  text: string;
  timestamp: number;
  type?: "info" | "warning" | "success";
}

interface MessageBoxProps {
  messages?: Message[];
  sessionId?: Id<"sessions"> | null;
}

export const MessageBox: React.FC<MessageBoxProps> = ({ messages = [], sessionId }) => {
  const snapshots = useQuery(api.functions.getSessionSnapshots, sessionId ? { sessionId } : "skip");

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // If sessionId is provided, show snapshots; otherwise show messages
  const showSnapshots = sessionId !== undefined;

  return (
    <div className="message-box-container">
      <div className="message-box-header">
        <h3>{showSnapshots ? "Session Snapshots" : "Messages"}</h3>
      </div>
      <div className="message-box-content">
        {showSnapshots ? (
          // Show snapshots
          snapshots === undefined ? (
            <div className="message-placeholder">
              <p>Loading snapshots...</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="message-placeholder">
              <p>No snapshots yet for this session.</p>
              <p className="message-hint">Snapshots will appear here</p>
            </div>
          ) : (
            <div className="message-list">
              {snapshots.map((snapshot) => (
                <div key={snapshot._id} className={`message-item ${snapshot.isProductive ? "success" : "warning"}`}>
                  <div className="message-text">
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "#1e3a5f" }}>
                      {snapshot.activity}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#495057", lineHeight: 1.5 }}>{snapshot.summary}</div>
                  </div>
                  <div className="message-time">
                    {formatTimestamp(snapshot.timestamp)}
                    {snapshot.isProductive ? " • Productive" : " • Not Productive"}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : // Show messages (original functionality)
        messages.length === 0 ? (
          <div className="message-placeholder">
            <p>No messages yet</p>
            <p className="message-hint">Messages will appear here</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <div key={message.id} className={`message-item ${message.type || "info"}`}>
                <div className="message-text">{message.text}</div>
                <div className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBox;
