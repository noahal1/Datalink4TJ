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
const MaintenanceMetrics = () => import('../pages/MaintenanceMetrics.vue')
const DowntimeRecords = () => import('../pages/DowntimeRecords.vue')  
const Events = () => import('../pages/Events.vue')
const Qa_others = () => import('../pages/Qa_others.vue')
const RouteManagement = () => import('../pages/RouteManagement.vue')
const PermissionManagement = () => import('../pages/PermissionManagement.vue')

// 管理页面子组件
const AdminDepartments = () => import('../pages/admin/Departments.vue')
const AdminActivities = () => import('../pages/admin/Activities.vue')

// 路由组定义，便于统一管理
const MODULE_ROUTES = {
  // 维修管理相关路由
  MAINTENANCE: {
    path: '/maintenance',
    name: 'Maintenance',
    component: Maintenance,
    meta: {
      title: '维修管理',
      icon: 'mdi-tools',
      requiresAuth: true,
      permission: { module: 'MAINT', level: 'READ' }
    },
    children: [
      {
        path: 'metrics',
        name: 'MaintenanceMetrics',
        component: MaintenanceMetrics,
        meta: {
          title: '维修指标',
          icon: 'mdi-chart-line',
          requiresAuth: true,
          permission: { module: 'MAINT', level: 'READ' }
        }
      },
      {
        path: 'records',
        name: 'DowntimeRecords',
        component: DowntimeRecords,
        meta: {
          title: '停机单管理',
          icon: 'mdi-clipboard-text',
          requiresAuth: true,
          permission: { module: 'MAINT', level: 'READ' }
        }
      }
    ]
  },
  
  // 管理模块相关路由
  ADMIN: {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: {
      title: '管理后台',
      icon: 'mdi-cog',
      requiresAuth: true,
      permission: { module: 'USER', level: 'ADMIN' }
    },
    children: [
      {
        path: 'users',
        name: 'UserManagement',
        component: Admin,
        meta: {
          title: '用户管理',
          icon: 'mdi-account-group',
          requiresAuth: true,
          permission: { module: 'USER', level: 'ADMIN' }
        }
      },
      {
        path: 'departments',
        name: 'DepartmentManagement',
        component: AdminDepartments,
        meta: {
          title: '部门管理',
          icon: 'mdi-domain',
          requiresAuth: true,
          permission: { module: 'DEPARTMENT', level: 'ADMIN' }
        }
      },
      {
        path: 'activities',
        name: 'ActivityLogs',
        component: AdminActivities,
        meta: {
          title: '操作记录',
          icon: 'mdi-history',
          requiresAuth: true,
          permission: { module: 'ACTIVITY', level: 'READ' }
        }
      },
      {
        path: 'routes',
        name: 'RouteManagement',
        component: RouteManagement,
        meta: {
          title: '路由管理',
          icon: 'mdi-routes',
          requiresAuth: true,
          permission: { module: 'ROUTE', level: 'ADMIN' }
        }
      },
      {
        path: 'permissions',
        name: 'PermissionManagement',
        component: PermissionManagement,
        meta: {
          title: '权限管理',
          icon: 'mdi-shield-account',
          requiresAuth: true,
          permission: { module: 'USER', level: 'ADMIN' }
        }
      }
    ]
  }
}

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
      permission: '*', 
      requiresAuth: true
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
      permission: '*', // 所有人可访问
      requiresAuth: true
    } 
  },
  { 
    path: '/ehs', 
    component: EHS,
    meta: { 
      title: 'EHS',
      permission: { module: 'EHS', level: 'READ' }, 
      requiresAuth: true
    } 
  },
  { 
    path: '/assy', 
    component: Assy,
    meta: { 
      title: '生产',
      permission: 'ASSY', // 旧格式兼容
      requiresAuth: true
    }
  },
  { 
    path: '/pcl', 
    component: Pcl,
    meta: { 
      title: '物流',
      permission: 'PCL', // 旧格式兼容
      requiresAuth: true
    } 
  },
  { 
    path: '/gmo', 
    component: Gmo,
    meta: { 
      title: 'GMO',
      permission: 'GMO', // 旧格式兼容
      requiresAuth: true
    } 
  },
  { 
    path: '/events', 
    component: Events,
    meta: { 
      title: '重要事件',
      permission: { module: 'EVENT', level: 'READ' },
      requiresAuth: true
    } 
  },
  {
    path: '/qa_others',
    component: Qa_others,
    meta: { 
      title: '质量管理',
      permission: '*', // 所有人可访问
      requiresAuth: true
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

// 添加模块化路由
Object.values(MODULE_ROUTES).forEach(route => routes.push(route))

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
  
  // 检查登录状态 - 所有非公开页面都需要登录
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
  if (!permissionStore.permissionCache || Object.keys(permissionStore.permissionCache).length === 0) {
    try {
      await permissionStore.initialize()
    } catch (error) {
      console.error('初始化权限信息出错:', error)
    }
  }
  
  // 检查超级管理员
  const isSuperAdmin = permissionStore.isSuperUser
  
  // 超级管理员可以访问所有页面
  if (isSuperAdmin) {
    return next()
  }
  
  // 公共路由(*表示所有人可访问)
  if (to.meta.permission === '*') {
    return next()
  }
  
  // 质量页面特殊处理
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