import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import Pong from '../components/Pong.vue'
import BattleShip from '../components/BattleShip.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/pong/:gameId',
      name: 'Pong',
      component: GameView,
      props: { gameType: 'pong' },
      beforeEnter: async (to, from, next) => {
        try {
          const response = await fetch(`/games`)
          const data = await response.json()
          const exists = data.games.includes(to.params.gameId)
          if (exists) {
            next()
          } else {
            next({ name: 'home' })
          }
        } catch (error) {
          console.error(error)
          next({ name: 'home' })
        }
      }
    },
    {
      path: '/battleship/:gameId',
      name: 'Battleship',
      component: GameView,
      props: { gameType: 'battleship' },
      beforeEnter: async (to, from, next) => {
        try {
          const response = await fetch(`/games`)
          const data = await response.json()
          const exists = data.games.includes(to.params.gameId)
          if (exists) {
            next()
          } else {
            next({ name: 'home' })
          }
        } catch (error) {
          console.error(error)
          next({ name: 'home' })
        }
      }
    }
  ]
})

export default router
