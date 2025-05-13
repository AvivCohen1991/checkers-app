// ✅ FILE: client/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp.jsx";
import Platform from "./pages/Platform";
import Game from "./pages/Game";

function App() {
  const isAuthenticated = localStorage.getItem("token"); // basic auth simulation

  return (
    <Routes>
      <Route path="/" element={<Platform />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/game/:gameId" element={<Game />} />
    </Routes>
  );
}

export default App;
