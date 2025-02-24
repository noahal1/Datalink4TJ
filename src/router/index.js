import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Home from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
import Dashboard from '../pages/Dashboard.vue'
import Quality from '../pages/Quality.vue'
import EHS from '../pages/EHS.vue'
import Assy from '../pages/Assy.vue'
import Gmo from '../pages/Gmo.vue'
import Admin from '../pages/Admin.vue'
import Pcl from '../pages/Pcl.vue'
import Maintenance from '../pages/Maintenance.vue'


const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/quality', component: Quality },
  { path: '/ehs', component: EHS },
  { path: '/assy', component: Assy },
  { path: '/pcl', component: Pcl },
  { path: '/gmo', component: Gmo },
  { path: '/maintenance', component: Maintenance },
  { path: '/admin', component: Admin },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLogin = userStore.isLogin

  if (to.path !== '/login' && !isLogin) {
    next('/login')
  } 
  else {
    next()
  }
})

export default router