<template>
  <div>
    <canvas
      ref="canvas"
      style="border-style: dashed; border-width: 2px width:960px; height: 540px;"
    ></canvas>
    <p>x:{{ state.position.x }}, y:{{ state.position.y }}</p>
  </div>
</template>
<script setup>
import { onMounted, ref, computed, watch, onUnmounted } from 'vue'
import { state, socket } from '../socket.js'
const canvas = ref()
const tickRate = 1000 / 24
const pos = computed(() => {
  return state.position
})
let context = null
let animationFrameId = null
let positionUpdateInterval = null
onMounted(() => {
  context = canvas.value.getContext('2d')
  canvas.value.addEventListener('mousemove', mouseMove)
  positionUpdateInterval = setInterval(updatePositon, tickRate)
  animate()
})
onUnmounted(() => {
  canvas.value.removeEventListener('mousemove', handleMouseMove)
  clearInterval(positionUpdateInterval)
  cancelAnimationFrame(animationFrameId)
})

function mouseMove(event) {
  const canvasRect = canvas.value.getBoundingClientRect()
  const x = event.clientX - canvasRect.left
  const y = event.clientY - canvasRect.top

  state.position.x = x
  state.position.y = y
}

function animate() {
  if (!context) return

  // Clear the canvas
  context.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Draw a square at the current position
  context.fillRect(pos.value.x, pos.value.y, 30, 30)

  // Request the next animation frame
  animationFrameId = requestAnimationFrame(animate)
}
function updatePositon() {
  socket.emit('position-update', { x: pos.value.x, y: pos.value.y })
}
</script>

<style scoped></style>
