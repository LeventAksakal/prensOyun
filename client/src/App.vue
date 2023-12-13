<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ConnectionManager from './components/ConnectionManager.vue'
import ConnectionState from './components/ConnectionState.vue'
import GameFrame from './components/GameFrame.vue'
import { ref, onMounted } from 'vue'
import axios from 'axios'
const apiUrl = 'http://localhost:3000/'
const fetchData = async () => {
  try {
    const response = await axios.get(apiUrl, { withCredentials: true });
    console.log('Response:', response.data)
  } catch (error) {
    console.error('Error:', error)
  }
}
onMounted(() => {
  fetchData()
}) 
 
</script>
 
<template>
  <ConnectionManager />
  <ConnectionState />
  <GameFrame />
</template>

<style scoped></style>
 