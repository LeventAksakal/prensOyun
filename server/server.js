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
  res.json({ games: Object.keys(games) });
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

const games = {};
const activePlayers = {};
const pongQueue = [];
const battleshipQueue = [];

io.on("connection", (socket) => {
  activePlayers[socket.userId] = socket.id;
  io.emit("active-players", activePlayers);

  socket.on("disconnect", () => {
    delete activePlayers[socket.userId];
    let i = pongQueue.indexOf(socket);
    if (i > -1) {
      pongQueue.splice(i, 1);
    }
    let j = battleshipQueue.indexOf(socket);
    if (j > -1) {
      battleshipQueue.splice(j, 1);
    }
    io.emit("active-players", activePlayers);
  });

  socket.on("pong-request", ({ nickname }) => {
    if (pongQueue.includes(socket)) {
      return;
    }
    let i = battleshipQueue.indexOf(socket);
    if (i > -1) {
      battleshipQueue.splice(i, 1);
    }
    if (!nickname) {
      nickname = "Anonymous";
    }
    socket.nickname = nickname;
    if (!pongQueue.length) {
      pongQueue.push(socket);
    } else {
      const opponent = pongQueue.shift();
      const roomId = uuidv4();
      games[roomId] = {
        host: socket.userId,
        guest: opponent.userId,
        hostScore: 0,
        guestScore: 0,
        hostNickname: nickname,
        guestNickname: opponent.nickname,
        scoreLimit: 5,
        timeRemaining: 120,
      };
      games[roomId].interval = setInterval(() => {
        games[roomId].timeRemaining--;
        if (games[roomId].timeRemaining <= 0) {
          clearInterval(games[roomId].interval);
          io.to(roomId).emit("game-end");
          delete games[roomId];
          return;
        }
        io.to(roomId).emit("pong-timer", games[roomId].timeRemaining);
      }, 1000);
      socket.join(roomId);
      opponent.join(roomId);
      io.to(roomId).emit("redirect", roomId);
    }
  });

  socket.on("battleship-request", ({ nickname }) => {
    if (battleshipQueue.includes(socket)) {
      return;
    }
    let i = pongQueue.indexOf(socket);
    if (i > -1) {
      pongQueue.splice(i, 1);
    }
    if (!nickname) {
      nickname = "Anonymous";
    }
    if (!battleshipQueue.length) {
      battleshipQueue.push(socket);
    } else {
      const opponent = battleshipQueue.shift();
      const roomId = uuidv4();
      games[roomId] = { host: socket.userId, guest: opponent.userId };
      socket.join(roomId);
      opponent.join(roomId);
      io.to(roomId).emit("redirect", roomId);
    }
  });
  socket.on("join-room", (roomId) => {
    let host = activePlayers[games[roomId].host];
    let guest = activePlayers[games[roomId].guest];
    if (host === socket.id) {
      socket.emit("host");
    } else if (guest === socket.id) {
      socket.emit("guest");
    }
    socket.join(roomId);
  });
  socket.on("left-update", (data) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("left-update", data);
      }
    });
  });
  socket.on("right-update", (data) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("right-update", data);
      }
    });
    socket.emit("right-update", data);
  });
  socket.on("ball-update", (data) => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("ball-update", data);
      }
    });
  });
  socket.on("score-update", (roomId, scorer) => {
    if (!games[roomId]) return;
    games[roomId][scorer]++;
    io.to(roomId).emit("score", scorer);
    if (games[roomId][scorer] >= games[roomId].scoreLimit) {
      clearInterval(games[roomId].interval);
      io.to(roomId).emit("game-end");
      delete games[roomId];
    }
  });
});

server.listen(3000, () => {
  console.log("Running on http://localhost:3000");
});
