import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'


// 使用懒加载优化性能
const Login = () => import('../pages/Login.vue')
const Dashboard = () => import('../pages/Dashboard.vue')
const Quality = () => import('../pages/Quality.vue')
const EHS = () => import('../pages/EHS.vue')
const Assy = () => import('../pages/Assy.vue')
const Gmo = () => import('../pages/Gmo.vue')
const Events = () => import('../pages/Events.vue')
const Admin = () => import('../pages/Admin.vue')
const Pcl = () => import('../pages/Pcl.vue')
const Maintenance = () => import('../pages/Maintenance.vue')
const Qa_others = () => import('../pages/Qa_others.vue')
const BossDashboard = () => import('../pages/BossDashboard.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { 
      title: '首页',
      permission: '*' // 所有人可访问
    }
  },
  { 
    path: '/login', 
    component: Login,
    meta: { 
      title: '登录',
      public: true // 公开页面，不需要登录
    }
  },
  { 
    path: '/quality', 
    component: Quality,
    meta: { 
      title: '质量',
      permission: 'QA' // 只有QA部门可访问
    } 
  },
  { 
    path: '/ehs', 
    component: EHS,
    meta: { 
      title: 'EHS',
      permission: 'EHS' // 只有EHS部门可访问
    } 
  },
  { 
    path: '/assy', 
    component: Assy,
    meta: { 
      title: '生产',
      permission: 'ASSY' // 只有ASSY部门可访问
    }
  },
  { 
    path: '/pcl', 
    component: Pcl,
    meta: { 
      title: '物流',
      permission: 'PCL' // 只有PCL部门可访问
    } 
  },
  { 
    path: '/gmo', 
    component: Gmo,
    meta: { 
      title: 'GMO',
      permission: 'GMO' // 只有GMO部门可访问
    } 
  },
  { 
    path: '/maintenance', 
    component: Maintenance,
    meta: { 
      title: '维修',
      permission: 'MAT' // 只有MAT部门可访问
    } 
  },
  { 
    path: '/events', 
    component: Events,
    meta: { 
      title: '重要事件',
      permission: '*' // 所有人可访问
    } 
  },
  { 
    path: '/admin', 
    component: Admin,
    meta: { 
      title: '管理',
      permission: 'ADMIN' // 只有ADMIN可访问
    } 
  },
  {
    path: '/qa_others',
    component: Qa_others,
    meta: { 
      title: '质量管理',
      permission: 'QA' // 只有QA部门可访问
    }
  },
  {
    path: '/boss-dashboard',
    name: 'BossDashboard',
    component: BossDashboard,
    meta: {
      title: '团队工作看板',
      keepAlive: true,
      requireAuth: true
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 数据上报系统` : '数据上报系统'

  // 公开页面直接放行
  if (to.meta.public) {
    return next()
  }
  
  // 检查登录状态
  if (!userStore.isLogin) {
    // 保存尝试访问的路径，登录后重定向
    if (to.path !== '/login') {
      sessionStorage.setItem('redirectPath', to.path)
    }
    ElMessage({
      message: '请先登录',
      type: 'warning',
      duration: 2000
    })
    return next('/login')
  }
  
  // 检查页面权限
  const requiredPermission = to.meta.permission
  
  // 管理员可以访问所有页面
  if (userStore.isAdmin) {
    return next()
  }
  
  // 公共页面(*表示所有人可访问)
  if (requiredPermission === '*') {
    return next()
  }
  
  // 检查部门权限
  if (requiredPermission === userStore.department) {
    return next()
  }
  
  // 无权限访问
  ElMessage({
    message: '无权访问此页面',
    type: 'error',
    duration: 2000
  })
  return next(from.path || '/')
})

export default router