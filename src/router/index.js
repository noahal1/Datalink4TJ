import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
import Quality from '../pages/Quality.vue'
import { useUserStore } from '../stores/user.js'
import EHS from '../pages/EHS.vue'

const routes = [
  { path: '/', component: Dashboard },
  { path: '/login', component: Login },
  { path: '/quality', component: Quality, meta: { requiresAuth: true } },
  { path: '/ehs', component: EHS},
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore() 
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !userStore.isLogin) { 
    next('/login')
  } else {
    next()
  }
})

export default router