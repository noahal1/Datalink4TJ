import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Home from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
import Dashboard from '../pages/Dashboard.vue'
import Quality from '../pages/Quality.vue'
import EHS from '../pages/EHS.vue'
import Assy from '../pages/Assy.vue'
import Admin from '../pages/Admin.vue'


const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/quality', component: Quality },
  { path: '/ehs', component: EHS },
  { path: '/assy', component: Assy },
  { path: '/admin', component: Admin },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLogin = userStore.isLogin
  const userRole = userStore.user?.role

  if (to.path !== '/login' && !isLogin) {
    next('/login')
  } else if (userRole !== 'admin' && to.path === '/admin') {
    next('/') 
  } else {
    next()
  }
})

export default router