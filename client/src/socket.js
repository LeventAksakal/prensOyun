import { reactive } from 'vue'
import { io } from 'socket.io-client'

export const state = reactive({
  activePlayers: {},
  pong: {
    ball: { x: 0, y: 0 },
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    isHost: false
  },
  redirectRoute: null
})

const url = 'http://localhost:3000'

export const socket = io(url)

socket.on('redirect', (route) => {
  state.redirectRoute = route
})
socket.on('active-players', (list) => {
  state.activePlayers = list
})
socket.on('left-update', ({ x, y }) => {
  state.pong.left = { x, y }
})
socket.on('right-update', ({ x, y }) => {
  state.pong.right = { x, y }
})
socket.on('ball-update', ({ x, y }) => {
  state.pong.ball = { x, y }
})
