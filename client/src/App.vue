<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ConnectionManager from './components/ConnectionManager.vue'
import ConnectionState from './components/ConnectionState.vue'
import GameFrame from './components/GameFrame.vue'
</script>

<template>
  <ConnectionManager />
  <ConnectionState />
  <GameFrame />
</template>

<style scoped></style>
