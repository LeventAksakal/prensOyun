<template>
  <button @click="connect()">Connect</button>
  <button @click="disconnect()">Disconnect</button>
</template>

<script setup>
import { computed } from 'vue'
import { socket } from '../socket.js'

function connect() {
  socket.connect()
}
function disconnect() {
  socket.disconnect()
}
</script>
<style></style>
