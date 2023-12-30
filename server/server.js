const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const { generateToken, verifyToken } = require("./util/cookieHandler");
const { v4: uuidv4 } = require("uuid");
const cookie = require("cookie");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cookieParser());

app.use(async (req, res, next) => {
  if (req.path.startsWith("/assets/")) {
    return next();
  }
  const existingToken = req.cookies.userId;
  if (!existingToken) {
    const jwtToken = generateToken();
    res.cookie("userId", jwtToken, {
      httpOnly: true,
    });
  } else {
    try {
      await verifyToken(existingToken);
    } catch (error) {
      res.clearCookie("userId");
      const newJwtToken = generateToken();
      res.cookie("userId", newJwtToken, {
        httpOnly: true,
      });
    }
  }
  next();
});
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("/games", (req, res) => {
  res.json({ games: Object.values(games) });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
io.use((socket, next) => {
  if (socket.handshake.headers && socket.handshake.headers.cookie) {
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    if (cookies.userId) {
      socket.userId = cookies.userId;
      next();
    } else {
      next(new Error("Authentication error"));
    }
  } else {
    next(new Error("Authentication error"));
  }
});

let games = {};
const activePlayers = {};

io.on("connection", (socket) => {
  activePlayers[socket.id] = socket.userId;
  io.emit("active-players", activePlayers);
  socket.on("disconnect", () => {
    delete activePlayers[socket.id];
    io.emit("active-players", activePlayers);
  });
  socket.on("ping", (time) => {
    socket.emit("pong", time);
  });
  socket.on("pong-request", ({ nickname }) => {
    if (!nickname) {
      nickname = "Anonymous";
    }
    const gameId = uuidv4();
    games[socket.userId] = gameId;
    socket.emit("redirect", gameId);
  });
  socket.on("game-end", () => {
    delete games[socket.userId];
  });
  socket.on("left-update", (data) => {
    io.emit("left-update", data);
    console.log(data);
  });
  socket.on("right-update", (data) => {
    io.emit("right-update", data);
    console.log(data);
  });
  socket.on("ball-update", (data) => {
    io("ball-update", data);
    console.log(data);
  });
});

server.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});
