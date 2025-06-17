import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import { PermissionHelper } from '../utils/permissionConstants'
import Message from '../utils/notification'

// 使用懒加载优化性能
const Login = () => import('../pages/Login.vue')
const Dashboard = () => import('../pages/Dashboard.vue')
const EHS = () => import('../pages/EHS.vue')
const Assy = () => import('../pages/Assy.vue')
const Quality = () => import('../pages/Quality.vue')
const Pcl = () => import('../pages/Pcl.vue')
const Admin = () => import('../pages/Admin.vue')
const Gmo = () => import('../pages/Gmo.vue')
const Maintenance = () => import('../pages/Maintenance.vue')
const Events = () => import('../pages/Events.vue')
const Qa_others = () => import('../pages/Qa_others.vue')
const RouteManagement = () => import('../pages/RouteManagement.vue')
const PermissionManagement = () => import('../pages/PermissionManagement.vue')

// 管理页面子组件
const AdminDepartments = () => import('../pages/admin/Departments.vue')
const AdminActivities = () => import('../pages/admin/Activities.vue')

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
      permission: '*' // 所有人可访问
    } 
  },
  { 
    path: '/ehs', 
    component: EHS,
    meta: { 
      title: 'EHS',
      permission: { module: 'EHS', level: 'READ' } // 新格式
    } 
  },
  { 
    path: '/assy', 
    component: Assy,
    meta: { 
      title: '生产',
      permission: 'ASSY' // 旧格式兼容
    }
  },
  { 
    path: '/pcl', 
    component: Pcl,
    meta: { 
      title: '物流',
      permission: 'PCL' // 旧格式兼容
    } 
  },
  { 
    path: '/gmo', 
    component: Gmo,
    meta: { 
      title: 'GMO',
      permission: 'GMO' // 旧格式兼容
    } 
  },
  { 
    path: '/maintenance', 
    component: Maintenance,
    meta: { 
      title: '维修',
      permission: { module: 'MAINT', level: 'READ' } // 新格式
    } 
  },
  { 
    path: '/events', 
    component: Events,
    meta: { 
      title: '重要事件',
      permission: { module: 'EVENT', level: 'READ' } // 新格式
    } 
  },
  { 
    path: '/admin', 
    component: Admin,
    meta: { 
      title: '用户管理',
      permission: { module: 'USER', level: 'ADMIN' } // 新格式
    }
  },
  { 
    path: '/admin/departments', 
    component: AdminDepartments,
    meta: { 
      title: '部门管理',
      permission: { module: 'DEPARTMENT', level: 'ADMIN' } // 新格式
    }
  },
  { 
    path: '/admin/activities', 
    component: AdminActivities,
    meta: { 
      title: '操作记录',
      permission: { module: 'ACTIVITY', level: 'READ' } // 新格式
    }
  },
  {
    path: '/admin/users',
    redirect: '/admin',
    meta: {
      title: '用户管理',
      permission: { module: 'USER', level: 'ADMIN' } // 新格式
    }
  },
  { 
    path: '/admin/routes', 
    component: RouteManagement,
    meta: { 
      title: '路由管理',
      permission: { module: 'ROUTE', level: 'ADMIN' } // 新格式
    }
  },
  { 
    path: '/admin/permissions', 
    component: PermissionManagement,
    meta: { 
      title: '权限管理',
      permission: { module: 'USER', level: 'ADMIN' } // 新格式
    }
  },
  {
    path: '/qa_others',
    component: Qa_others,
    meta: { 
      title: '质量管理',
      permission: '*' // 所有人可访问
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

router.beforeEach(async (to, from, next) => {
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
    Message.warning('请先登录')
    return next('/login')
  }
  
  // 初始化权限模块
  const permissionStore = usePermissionStore()
  
  // 检查权限存储是否已初始化
  if (!permissionStore.permissionCache.size) {
    await permissionStore.initialize()
  }
  
  // 检查用户是否是超级管理员或管理员，判断是否可访问管理页面
  const isAdmin = userStore.roles && (
    userStore.roles.includes('超级管理员') || 
    userStore.roles.includes('管理员')
  )
  
  // 如果访问的是管理页面但不是管理员，拒绝访问
  if (to.path.startsWith('/admin') && !isAdmin) {
    Message.error('需要管理员权限才能访问此页面')
    return next(from.path || '/dashboard')
  }
  
  // 超级管理员可以访问所有页面
  if (permissionStore.isSuperUser) {
    return next()
  }
  
  // 公共路由(*表示所有人可访问)
  if (to.meta.permission === '*') {
    return next()
  }
  
  // 简化的权限检查 - 质量页面特殊处理
  if (to.path === '/quality' || to.path === '/qa_others') {
    return next()
  }
  
  // 检查路由是否在用户的可访问路由列表中
  const userRoutes = permissionStore.accessibleRoutes
  const canAccess = userRoutes.some(route => route.path === to.path)
  
  if (canAccess) {
    return next()
  }
  
  // 无权限访问
  Message.error('无权访问此页面')
  return next(from.path || '/')
})

export default router