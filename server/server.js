const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { generateToken, verifyToken } = require("./util/cookieHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.get("/", async (req, res, next) => {
  const existingToken = req.cookies.rememberme;

  if (!existingToken) {
    const jwtToken = generateToken();

    res.cookie("rememberme", jwtToken, {
      httpOnly: true,
    });
  } else {
    try {
      await verifyToken(existingToken);
    } catch (error) {
      res.clearCookie("rememberme");
      const newJwtToken = generateToken();

      res.cookie("rememberme", newJwtToken, {
        httpOnly: true,
      });
    }
  }
  res.send();
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
