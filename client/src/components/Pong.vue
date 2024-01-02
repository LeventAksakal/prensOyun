<template>
  <div class="game-container">
    <div class="scoreboard">
      <p class="score">{{ state.pong.hostNickname }}:{{ state.pong.hostScore }}</p>
      <p class="timer">{{ state.pong.timer }}</p>
      <p class="score">{{ state.pong.guestNickname }}:{{ state.pong.guestScore }}</p>
    </div>
    <div ref="gameContainer"></div>
    <div v-if="state.pong.gameEnd" class="game-end">
      <h2>{{ winner }} is the winner!</h2>
      <p><button @click="goHome">Return to Home Page</button></p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue'
import { state, socket } from '../socket.js'
import  router  from '../router/index.js'
const roomId = window.location.pathname.split('/')[1]
socket.emit('join-room', roomId)
const gameContainer = ref(null)
const timer = computed(() => state.pong.timer)
let animationFrameId = null
const reloadPage = () => {
  window.location.reload()
}
const winner = computed(() => {
  return state.pong.hostScore > state.pong.guestScore
    ? state.pong.hostNickname
    : state.pong.guestNickname
})

const leftPaddleDestination = reactive({ x: 0, y: 0 })
const rightPaddleDestination = reactive({ x: 0, y: 0 })
const ballPosition = reactive({ x: 0, y: 0 })
const goHome = () => {
  router.push('/')
}
const game = reactive({
  timer: 120,
  scoreLimit: 5,
  c: null,
  width: 0,
  height: 0,
  score: 0,
  timeRemaining: 0,
  left: {
    destination: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    size: { width: 20, height: 110 },
    color: 'gray',
    border: {
      left: 0,
      right: 200,
      top: 0,
      bottom: 0
    }
  },

  right: {
    destination: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    size: { width: 20, height: 110 },
    color: 'gray',
    border: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }
  },
  ball: {
    position: { x: 0, y: 0 },
    velocity: { x: -2, y: 0 },
    radius: 10,
    color: 'red',
    border: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },
    collisionDelay: 1000,
    collisionTimer: 0,
    maxSpeed: 6
  }
})
const initializeGame = () => {
  const canvas = document.createElement('canvas')
  gameContainer.value.appendChild(canvas)
  canvas.width = window.innerWidth  
  canvas.height = window.innerHeight
  game.c = canvas.getContext('2d')
  game.width = canvas.width
  game.height = canvas.height

  game.left.position.x = 0
  game.left.position.y = game.height / 2
  game.right.position.x = game.width - game.right.size.width
  game.right.position.y = game.height / 2
  ballPosition.x = game.width / 2
  ballPosition.y = game.height / 2

  game.left.border.right = game.width / 10
  game.left.border.bottom = game.height
  game.right.border.left = game.width - game.width / 10
  game.right.border.right = game.width
  game.right.border.bottom = game.height
  game.ball.border.right = game.width
  game.ball.border.bottom = game.height
}
function mouseMove(event) {
  if (state.pong.isHost) {
    leftPaddleDestination.x = event.clientX
    leftPaddleDestination.y = event.clientY
  } else if (state.pong.isGuest) {
    rightPaddleDestination.x = event.clientX
    rightPaddleDestination.y = event.clientY
  }
}
onMounted(() => {
  initializeGame()
  window.addEventListener('mousemove', mouseMove)
  window.addEventListener('resize', reloadPage);
  game.animate()
})
watch(state.pong.left, (newLeft) => {
  game.left.destination = newLeft
})
watch(state.pong.right, (newRight) => {
  game.right.destination = newRight
})
watch(state.pong.ball, (newBall) => {
  game.ball.position = newBall
})
watch(leftPaddleDestination, (newDestination) => {
  game.left.destination = newDestination
  socket.emit('left-update', { x: newDestination.x, y: newDestination.y })
})
watch(rightPaddleDestination, (newDestination) => {
  game.right.destination = newDestination
  socket.emit('right-update', { x: newDestination.x, y: newDestination.y })
})
watch(ballPosition, (newPosition) => {
  game.ball.position = newPosition
  socket.emit('ball-update', { x: newPosition.x, y: newPosition.y })
})
game.update = function () {
  this.updatePaddle(this.left)
  this.updatePaddle(this.right)
  if (state.pong.isHost) {
    this.updateBall(this.ball, [this.left, this.right])
  }
}
game.draw = function () {
  this.c.clearRect(0, 0, this.width, this.height)
  this.c.fillStyle = 'green'
  this.c.fillRect(0, 0, this.width, this.height)
  this.drawPaddle(this.c, this.left)
  this.drawPaddle(this.c, this.right)
  this.drawBall(this.c, this.ball)
}
game.updatePaddle = function (paddle) {
  //updates the velocity with respect to cursor position
  paddle.velocity.x = 0.1 * (paddle.destination.x - paddle.position.x)
  paddle.velocity.y = 0.1 * (paddle.destination.y - paddle.position.y)

  //Edge control x
  if (paddle.position.x >= paddle.border.right - paddle.size.width / 2 && paddle.velocity.x > 0) {
    paddle.position.x = paddle.border.right - paddle.size.width / 2
    paddle.velocity.x = 0
  } else if (
    paddle.position.x <= paddle.border.left + paddle.size.width / 2 &&
    paddle.velocity.x < 0
  ) {
    paddle.position.x = paddle.border.left + paddle.size.width / 2
    paddle.velocity.x = 0
  } else {
    paddle.position.x += paddle.velocity.x
  }

  //Edge control y
  if (paddle.position.y >= paddle.border.bottom - paddle.size.height / 2 && paddle.velocity.y > 0) {
    paddle.position.y = paddle.border.bottom - paddle.size.height / 2
    paddle.velocity.y = 0
  } else if (
    paddle.position.y <= paddle.border.top + paddle.size.height / 2 &&
    paddle.velocity.y < 0
  ) {
    paddle.position.y = paddle.border.top + paddle.size.height / 2
    paddle.velocity.y = 0
  } else {
    paddle.position.y += paddle.velocity.y
  }
}
game.drawPaddle = function (c, paddle) {
  c.fillStyle = paddle.color
  c.fillRect(
    paddle.position.x - paddle.size.width / 2,
    paddle.position.y - paddle.size.height / 2,
    paddle.size.width,
    paddle.size.height
  )
  c.beginPath()
  c.setLineDash([5, 15])
  c.strokeStyle = 'black'
  c.strokeRect(
    paddle.border.left,
    paddle.border.top,
    paddle.border.right - paddle.border.left,
    paddle.border.bottom - paddle.border.top
  )
  c.closePath()
}
game.drawBall = function (c, ball) {
  c.fillStyle = ball.color
  c.beginPath()
  c.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2, false)
  c.fill()
  c.closePath()
}
game.ball.isCollidingWithPaddle = function (paddle) {
  const paddlePosition = paddle.position
  const paddleSize = paddle.size
  return (
    this.position.x + this.radius >= paddlePosition.x - paddleSize.width / 2 &&
    this.position.x - this.radius <= paddlePosition.x + paddleSize.width / 2 &&
    this.position.y + this.radius >= paddlePosition.y - paddleSize.height / 2 &&
    this.position.y - this.radius <= paddlePosition.y + paddleSize.height / 2
  )
}
game.updateBall = function (ball, paddles) {
  ball.collisionTimer -= 10

  for (let paddle of paddles) {
    if (ball.collisionTimer <= 0 && ball.isCollidingWithPaddle(paddle)) {
      ball.velocity.x = 0.2 * paddle.velocity.x - ball.velocity.x
      ball.velocity.y = 0.2 * paddle.velocity.y - ball.velocity.y

      let speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2)
      if (speed > ball.maxSpeed) {
        ball.velocity.x = (ball.velocity.x / speed) * ball.maxSpeed
        ball.velocity.y = (ball.velocity.y / speed) * ball.maxSpeed
      }

      ball.collisionTimer = ball.collisionDelay
    }
  }

  if (ballPosition.x >= ball.border.right - ball.radius && ball.velocity.x > 0) {
    ballPosition.x = game.width / 2
    ballPosition.y = game.height / 2
    ball.velocity.x = -2
    ball.velocity.y = 0
    socket.emit('score-update', roomId, 'hostScore')
  } else if (ballPosition.x <= ball.border.left + ball.radius && ball.velocity.x < 0) {
    ballPosition.x = game.width / 2
    ballPosition.y = game.height / 2
    ball.velocity.x = 2
    ball.velocity.y = 0
    socket.emit('score-update', roomId, 'guestScore')
  } else {
    ballPosition.x += ball.velocity.x
  }

  if (
    (ballPosition.y >= ball.border.bottom - ball.radius && ball.velocity.y > 0) ||
    (ballPosition.y <= ball.border.top + ball.radius && ball.velocity.y < 0)
  ) {
    ball.velocity.y *= -1
  } else {
    ballPosition.y += ball.velocity.y
  }
}
game.animate = function () {
  game.draw()
  game.update()
  animationFrameId = window.requestAnimationFrame(() => this.animate())
}

onUnmounted(() => {
  window.cancelAnimationFrame(animationFrameId)
  window.removeEventListener('mousemove', mouseMove)
})
</script>
<style scoped>
.game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.timer,
.score {
  font-size: 2em;
  font-weight: bold;
  color: #000;
}
.game-end {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 20px;
  text-align: center;
}
.scoreboard {
  display: flex;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  padding: 0 1em;
}
</style>
