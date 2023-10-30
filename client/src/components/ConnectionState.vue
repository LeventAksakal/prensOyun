<template>
  <p>State: {{ connected }}</p>
  <p>Latency: {{ latency }}</p>
</template>

<script setup>
import { computed,ref } from 'vue'
import { state } from '../socket.js'
const connected = computed(() => {
  return state.connected
})
const latency = computed(() => {
  return state.latency
})
</script>
