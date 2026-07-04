import { createRouter, createWebHistory } from 'vue-router'
import { usePageLeaveGuard } from '@/stores/usePageLeaveGuard'
import i18n from '@/assets/i18n'

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
    {
      path: '/game/:id',
      name: 'game',
      component: () => import('@/components/pages/GamePage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/components/pages/NotFoundPage.vue'),
    },
  ],
})

// Extends the leave guard to internal navigation (vue-router doesn't fire beforeunload).
// Covers the top-bar home link, footer links, etc. while a game is in progress.
router.beforeEach((to, from) => {
  if (to.fullPath === from.fullPath) {
    return true
  }

  const leaveGuard = usePageLeaveGuard()
  if (leaveGuard.shouldWarn && !window.confirm(i18n.global.t('game.leaveConfirm'))) {
    return false
  }

  return true
})

export default router
