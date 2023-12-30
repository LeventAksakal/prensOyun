import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameFrame from '../components/GameFrame.vue'
import Pong from '../components/Pong.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/:gameId',
      name: 'Pong',
      component: Pong,
      beforeEnter: async (to, from, next) => {
        try {
          const response = await fetch(`/games`)
          const data = await response.json()
          const exists = data.games.includes(to.params.gameId)
          if (exists) {
            next()
          } else {
            console.log('Game does not exist')
            next({ name: 'home' }) // redirect to home page if the game does not exist
          }
        } catch (error) {
          console.error(error)
          next({ name: 'home' }) // redirect to home page if there is an error
        }
      }
    }
  ]
})

export default router
