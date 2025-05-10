import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const [message, setMessage] = useState("");
  const [log, setLog] = useState([]);

  useEffect(() => {
    socket.on("message", (data) => {
      setLog((prev) => [...prev, data]);
    });
  }, []);

  const sendMessage = () => {
    socket.emit("message", message);
    setMessage("");
  };

  return (
    <div>
      <h1>Checkers Game - דמו</h1>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
      <ul>
        {log.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
