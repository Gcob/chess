import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    hideFooter?: boolean
  }
}

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
      path: '/about',
      name: 'about',
      component: () => import('@/components/pages/AboutPage.vue'),
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/components/pages/TermsPage.vue'),
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/components/pages/PrivacyPage.vue'),
    },
    // {
    //   path: '/game/:id',
    //   name: 'game',
    //   component: () => import('@/components/pages/GamePage.vue'),
    //   meta: { hideFooter: true },
    // },
  ],
})

export default router
