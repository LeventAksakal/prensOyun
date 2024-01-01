import { reactive } from 'vue'
import { io } from 'socket.io-client'
import router from './router/index.js'
export const state = reactive({
  activePlayers: {},
  pong: {
    timer: 120,
    ball: { x: 0, y: 0 },
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    isHost: false,
    isGuest: false,
    hostScore: 0,
    guestScore: 0
  },
  redirectRoute: null
})

const url = 'http://localhost:3000'

export const socket = io(url)

socket.on('redirect', (route) => {
  state.redirectRoute = route
})
socket.on('host', () => {
  state.pong.isHost = true
})
socket.on('guest', () => {
  state.pong.isGuest = true
})
socket.on('active-players', (list) => {
  state.activePlayers = list
})
socket.on('left-update', ({ x, y }) => {
  state.pong.left.x = x
  state.pong.left.y = y
})
socket.on('right-update', ({ x, y }) => {
  state.pong.right.x = x
  state.pong.right.y = y
})
socket.on('ball-update', ({ x, y }) => {
  state.pong.ball.x = x
  state.pong.ball.y = y
})
socket.on('game-end', () => {
  router.push({ name: 'home' })
})
socket.on('pong-timer', (timer) => {
  state.pong.timer = timer
})
socket.on('score', (scorer) => {
  state.pong[scorer]++
})
