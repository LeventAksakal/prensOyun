<template>
  <div class="home-page">
    <h1>Welcome to the Home Page!</h1>
    <div class="nickname-input">
      <label for="nickname">Enter your nickname:</label>
      <input type="text" id="nickname" v-model="nickname" />
    </div>
    <div class="game-modes">
      <div class="game-mode" :class="{ 'in-queue': isInPongQueue }" @click="play('pong-request')">
        Pong
      </div>
      <div
        class="game-mode"
        :class="{ 'in-queue': isInBattleshipQueue }"
        @click="play('battleship-request')"
      >
        Battleship
      </div>
    </div>

    <div class="active-players">
      <h2>Active Players:</h2>
      <ul>
        <li v-for="(player, index) in Object.values(state.activePlayers)" :key="index">
          {{ player }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { socket, state } from '../socket.js'

const router = useRouter()
const nickname = ref('')
const isInPongQueue = ref(false)
const isInBattleshipQueue = ref(false)

watch(
  () => state.redirectRoute,
  (newRoute) => {
    if (newRoute) {
      router.push(newRoute)
    }
  }
)

function play(gameMode) {
  if (gameMode === 'pong-request') {
    isInBattleshipQueue.value = false
    isInPongQueue.value = true
  } else if (gameMode === 'battleship-request') {
    isInPongQueue.value = false
    isInBattleshipQueue.value = true
  }
  socket.emit(gameMode, { nickname: nickname.value })
}
</script>

<style scoped>
.game-mode.in-queue {
  background-color: rgb(76, 144, 187);
}

.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  position: relative;
}
.nickname-input {
  margin-bottom: 20px;
}
.game-modes {
  display: flex;
  justify-content: center;
}
.game-mode {
  margin: 0 10px;
  padding: 10px 20px;
  background-color: lightblue;
  cursor: pointer;
}
.active-players {
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: 200px;
  overflow: auto;
  border: 1px solid #000;
  padding: 10px;
  background-color: #fff;
}
.active-players ul {
  list-style-type: none;
  padding: 0;
}
.active-players li {
  margin-bottom: 5px;
}
</style>
