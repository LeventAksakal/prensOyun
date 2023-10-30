import { reactive } from 'vue'
import { io } from 'socket.io-client'

export const state = reactive({
  connected: false,
  latency: -1,
  position: { x: 0, y: 0 }
})

const url = 'http://localhost:3000'

export const socket = io(url, {
  autoConnect: false
})
const tickRate = 1000 / 24

const ping = () => {
  let time = new Date().getTime()
  socket.emit('ping', time)
}
let latencyInterval = null

socket.on('connect', () => {
  state.connected = true
  latencyInterval = setInterval(ping, tickRate)
})

socket.on('disconnect', () => {
  clearInterval(latencyInterval)
  state.connected = false
})
socket.on('pong', (time) => {
  const latency = new Date().getTime() - time
  state.latency = latency
})
socket.on('position-update', (position) => {
  state.position.x = position.x
  state.position.y = position.y
})
