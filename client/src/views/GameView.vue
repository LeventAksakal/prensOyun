<template>
  <div>
    <component :is="gameComponent" />
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import Pong from '../components/Pong.vue'
import BattleShip from '../components/BattleShip.vue'

const props = defineProps({
  gameType: {
    type: String,
    required: true
  }
})
console.log(props.gameType)
const gameComponent = computed(() => {
  if (props.gameType === 'pong') {
    return Pong
  } else if (props.gameType === 'battleship') {
    return BattleShip
  } else {
    return null
  }
})
</script>
