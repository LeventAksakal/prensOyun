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
const queueOfPong = [];
const queueOfBattleship = [];

io.on("connection", (socket) => {
  activePlayers[socket.id] = socket.userId;
  io.emit("active-players", activePlayers);

  socket.on("disconnect", () => {
    // for debug
    console.log(`${socket.id} disconnected`);
    delete activePlayers[socket.id];

    const indexInQueuePong = queueOfPong.findIndex(
      (item) => item.id === socket.id
    );

    if (indexInQueuePong !== -1) {
      queueOfPong.splice(indexInQueuePong, 1);
    }

    io.emit("active-players", activePlayers);
  });

  socket.on("ping", (time) => {
    socket.emit("pong", time);
  });

  socket.on("pong-request", ({ nickname }) => {
    // for debug
    console.log(
      `${socket.id} requested pong with nickname: ${nickname || "Anonymous"}`
    );

    if (!nickname) {
      nickname = "Anonymous";
    }

    const isInQueueP = queueOfPong.some((item) => item.id === socket.id);
    const isInQueueBS = queueOfBattleship.some((item) => item.id === socket.id);

    if (!isInQueueP && !isInQueueBS) {
      queueOfPong.push(socket);

      if (queueOfPong.length >= 2) {
        const player1 = queueOfPong.shift();
        const player2 = queueOfPong.shift();

        const roomId = uuidv4();
        // matched
        player1.join(roomId);
        player2.join(roomId);
        // for debug
        console.log(`${socket.id} joined room ${roomId}`);
        
        io.to(roomId).emit("redirect", roomId);
        // for debug
        console.log(
          `Players matched. Room ID: ${roomId}, Player 1: ${player1}, Player 2: ${player2}`
        );
      } else {
        io.to(socket.id).emit("waiting-in-queue");
        // for debug
        console.log(`${socket.id} is waiting for matching...`);
      }
    } else {
      io.to(socket.id).emit("already-in-queue");
      console.log("Already in the queue...");
    }
  });

  socket.on("battleship-request", ({ nickname }) => {
    if (!nickname) {
      nickname = "Anonymous";
    }

    const isInQueueP = queueOfPong.some((item) => item.id === socket.id);
    const isInQueueBS = queueOfBattleship.some((item) => item.id === socket.id);

    if (!isInQueueP && !isInQueueBS) {
      queueOfBattleship.push(socket);

      if (queueOfBattleship.length >= 2) {
        const player1 = queueOfBattleship.shift();
        const player2 = queueOfBattleship.shift();

        const roomId = uuidv4();

        player1.join(roomId);
        player2.join(roomId);

        io.to(player1.id).emit("redirect", roomId);
        io.to(player2.id).emit("redirect", roomId);
      } else {
        io.to(socket.id).emit("waiting-in-queue");
      }
    } else {
      io.to(socket.io).emit("already-in-queue");
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
