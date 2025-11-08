import "./App.css";
import { useQuery } from "convex/react";
import { api } from "./lib/convexApi";
import SessionCapture from "./components/SessionCapture";

function App() {
  const tasks = useQuery(api.tasks.get);

  return (
    <div className="App">
      <h1>DillyDally Tasks</h1>
      <SessionCapture />
      <div className="tasks-container">
        {tasks === undefined ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet!</p>
        ) : (
          <ul>
            {tasks.map(({ _id, text, isCompleted }) => (
              <li key={_id}>
                <input type="checkbox" checked={isCompleted} readOnly />
                <span
                  style={{
                    textDecoration: isCompleted ? "line-through" : "none",
                  }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
