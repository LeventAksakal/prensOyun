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
  return
})
let context = null

onMounted(() => {
  context = canvas.value.getContext('2d')
})
</script>



<style scoped></style>
