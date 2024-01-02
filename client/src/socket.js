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
    guestScore: 0,
    hostNickname: null,
    guestNickname: null,
    gameEnd: false
  },
  battleship: {
    isHost: false,
    isGuest: false,
    shipIndices: reactive([]),
    shipIndicesEnemy: reactive([]),
    hits:[],
    hitsEnemy:[]
  },
  redirectRoute: null
})

export const socket = io()

socket.on('game-start', (route) => {
  state.pong = {
    timer: 120,
    ball: { x: 0, y: 0 },
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    isHost: false,
    isGuest: false,
    hostScore: 0,
    guestScore: 0,
    hostNickname: null,
    guestNickname: null,
    gameEnd: false
  }
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
  state.pong.isHost = false
  state.pong.isGuest = false
  state.pong.gameEnd = true
})
socket.on('pong-timer', (timer) => {
  state.pong.timer = timer
})
socket.on('score', (scorer) => {
  state.pong[scorer]++
})
socket.on('pong-data', (data) => {
  state.pong.hostScore = data.hostScore
  state.pong.guestScore = data.guestScore
  state.pong.timer = data.timeRemaining
  state.pong.hostNickname = data.hostNickname
  state.pong.guestNickname = data.guestNickname
})

socket.on('hit', (hits) => {//************************
  state.battleship.hits = hits
  console.log(state.battleship.hits)
}) 
socket.on('hit-guest', (hitsEnemy) => {//************************
  state.battleship.hitsEnemy = hitsEnemy
  console.log(state.battleship.hitsEnemy)

})
socket.on('ship-indices', (shipIndices) => {//************************
  state.battleship.shipIndices = shipIndices
  console.log(state.battleship.shipIndices,"index")

})
socket.on('ship-indices-guest', (shipIndicesEnemy) => {//************************
  state.battleship.shipIndicesEnemy= shipIndicesEnemy
  console.log(state.battleship.shipIndicesEnemy,"Enemyindex")

})

