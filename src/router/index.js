import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Login from '../pages/Login.vue'
import Quality from '../pages/Quality.vue'
import EHS from '../pages/EHS.vue'
import Assy from '../pages/Assy.vue'
import Gmo from '../pages/Gmo.vue'
import Events from '../pages/Events.vue'
import Admin from '../pages/Admin.vue'
import Pcl from '../pages/Pcl.vue'
import Maintenance from '../pages/Maintenance.vue'
import Qa_others from '../pages/Qa_others.vue'

const routes = [
  { 
    path: '/login', 
    component: Login,
    meta: { title: '登录' }
  },
  { 
    path: '/quality', 
    component: Quality,
    meta: { title: '质量' } 
  },
  { 
    path: '/ehs', 
    component: EHS,
    meta: { title: 'EHS' } 
  },
  { 
    path: '/assy', 
    component: Assy,
    meta: { title: '生产' }
  },
  { 
    path: '/pcl', 
    component: Pcl,
    meta: { title: '物流' } 
  },
  { 
    path: '/gmo', 
    component: Gmo,
    meta: { title: 'GMO' } 
  },
  { 
    path: '/maintenance', 
    component: Maintenance,
    meta: { title: '维修' } 
  },
  { 
    path: '/events', 
    component: Events,
    meta: { title: '重要事件' } 
  },
  { 
    path: '/admin', 
    component: Admin,
    meta: { title: '管理' } 
  },
  {
    path: '/qa_others',
    component: Qa_others,
    meta: { title: '质量管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLogin = userStore.isLogin

  // 设置页面标题
  document.title = to.meta.title || '默认标题' 

  if (to.path !== '/login' && !isLogin) {
    next('/login')
  } 
  else {
    next()
  }
})

export default router