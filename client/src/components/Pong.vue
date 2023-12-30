<template>
  <div ref="gameContainer"></div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue'
import { state, socket } from '../socket.js'
const gameContainer = ref(null)
let animationFrameId = null
const leftPaddleDestination = computed(() => (state.pong.isHost ? state.pong.left : { x: 0, y: 0 }))
const rightPaddleDestination = computed(() =>
  state.pong.isHost ? { x: 0, y: 0 } : state.pong.right
)
const ballPosition = computed(() => (state.pong.isHost ? game.ball.position : state.pong.ball))
const game = reactive({
  timer: 0,
  scoreLimit: 0,
  c: null,
  width: 0,
  height: 0,
  score: 0,
  timeRemaining: 0,
  left: {
    destination: leftPaddleDestination.value,
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
    destination: rightPaddleDestination.value,
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
  game.ball.position.x = game.width / 2
  game.ball.position.y = game.height / 2

  game.left.border.right = game.width / 10
  game.left.border.bottom = game.height
  game.right.border.left = game.width - game.width / 10
  game.right.border.right = game.width
  game.right.border.bottom = game.height
  game.ball.border.right = game.width
  game.ball.border.bottom = game.height
}

onMounted(() => {
  initializeGame()
  window.addEventListener('mousemove', (event) => {
    leftPaddleDestination.value.x = event.clientX
    leftPaddleDestination.value.y = event.clientY
  })
  game.animate()
})
watch(leftPaddleDestination, (newDestination) => {
  game.left.destination = newDestination
  if (state.pong.isHost) socket.emit('left-update', { left: newDestination })
})
watch(rightPaddleDestination, (newDestination) => {
  game.right.destination = newDestination
  console.log('right', newDestination)
  if (!state.pong.isHost) socket.emit('right-update', { right: newDestination })
})
watch(ballPosition, (newPosition) => {
  game.ball.position = newPosition
  if (state.pong.isHost) socket.emit('ball-update', { ball: newPosition })
})
game.update = function () {
  this.updatePaddle(this.left)
  this.updatePaddle(this.right)
  this.updateBall(this.ball, [this.left, this.right])
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

  if (
    (ball.position.x >= ball.border.right - ball.radius && ball.velocity.x > 0) ||
    (ball.position.x <= ball.border.left + ball.radius && ball.velocity.x < 0)
  ) {
    ball.position.x = game.width / 2
    ball.velocity.x = 2
    ball.velocity.y = 0
  } else {
    ball.position.x += ball.velocity.x
  }

  if (
    (ball.position.y >= ball.border.bottom - ball.radius && ball.velocity.y > 0) ||
    (ball.position.y <= ball.border.top + ball.radius && ball.velocity.y < 0)
  ) {
    ball.velocity.y *= -1
  } else {
    ball.position.y += ball.velocity.y
  }
}
game.animate = function () {
  game.draw()
  game.update()
  animationFrameId = window.requestAnimationFrame(() => this.animate())
}

onUnmounted(() => {
  window.cancelAnimationFrame(animationFrameId)
  window.removeEventListener('mousemove')
})
</script>
