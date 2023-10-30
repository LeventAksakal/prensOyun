const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors"); // Import the cors module

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);
  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
  });
  socket.on("ping", (time) => {
    socket.emit("pong", time);
  });
  socket.on("position-update", (pos) => {
    io.emit("position-update", pos);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
