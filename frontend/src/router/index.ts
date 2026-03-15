import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/components/pages/HomePage.vue'),
    },
    {
      path: '/new-game',
      name: 'new-game',
      component: () => import('@/components/pages/NewGamePage.vue'),
    },
  ],
})

export default router
