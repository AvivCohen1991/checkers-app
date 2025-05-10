import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // update if needed

export default socket;
