import { io } from "socket.io-client";

const token = localStorage.getItem("token");
const socket = io("http://localhost:3000", {
  auth: { token },
});

window.socket = socket; // ✅ expose for browser debugging

export default socket;
