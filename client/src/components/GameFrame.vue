<template>
  <div>
    <canvas
      ref="canvas"
      style="border-style: dashed; border-width: 2px width:960px; height: 540px;"
    ></canvas>
  </div>
</template>
<script setup>
import { onMounted, ref, computed, watch, onUnmounted } from 'vue'
import { state, socket } from '../socket.js'
const canvas = ref()
const pos = computed(() => {
  return state.position
})
let context = null
let animationFrameId = null
let positionUpdateInterval = null
onMounted(() => {
  context = canvas.value.getContext('2d')
  // window.addEventListener('mousemove', mouseMove)
  // positionUpdateInterval = setInterval(updatePositon, 1000)
})
// onUnmounted(() => {
//   clearInterval(positionUpdateInterval)
//   cancelAnimationFrame(animationFrameId)
// })

// function mouseMove(Event) {
//   socket.emit('position-update', { x, y })
// }
// function updatePositon() {
//   socket.emit('position-update', { x: pos.value.x, y: pos.value.y })
// }
</script>

<style scoped></style>
