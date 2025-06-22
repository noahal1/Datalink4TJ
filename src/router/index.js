import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import { PermissionPrefixes } from '../utils/permissionConstants'
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
      path: '/maintenance',
      title: '维修管理',
      icon: 'mdi-tools',
      requiresAuth: true,
      permission_code: 'access_maintenance'
    }
  },
  
  // 维修指标路由（独立路由而非子路由）
  MAINTENANCE_METRICS: {
    path: '/maintenance/metrics',
    name: 'MaintenanceMetrics',
    component: MaintenanceMetrics,
    meta: {
      title: '维修指标',
      icon: 'mdi-chart-line',
      requiresAuth: true,
      permission_code: 'access_maintenance_metrics'
    }
  },
  
  // 停机单管理路由
  MAINTENANCE_RECORDS: {
    path: '/maintenance/records',
    name: 'DowntimeRecords',
    component: DowntimeRecords,
    meta: {
      title: '停机单管理',
      icon: 'mdi-clipboard-text',
      requiresAuth: true,
      permission_code: 'access_maintenance_records'
    }
  },
  
  // 管理模块相关路由
  ADMIN: {
    path: '/admin',
    component: Admin,
    meta: {
      title: '系统管理',
      icon: 'mdi-cog-outline',
      requiresAuth: true,
      permission_code: 'access_admin'
    },
    children: [
      {
        path: 'departments',
        name: 'AdminDepartments',
        component: AdminDepartments,
        meta: {
          title: '部门管理',
          icon: 'mdi-domain',
          requiresAuth: true,
          permission_code: 'manage_departments'
        }
      },
      {
        path: 'activities',
        name: 'AdminActivities',
        component: AdminActivities,
        meta: {
          title: '活动管理',
          icon: 'mdi-calendar-check',
          requiresAuth: true,
          permission_code: 'manage_activities'
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
          permission_code: 'manage_routes'
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
          permission_code: 'manage_permissions'
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
      permission_code: '*', 
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
      permission_code: 'view_quality', 
      requiresAuth: true
    } 
  },
  { 
    path: '/ehs', 
    component: EHS,
    meta: { 
      title: 'EHS',
      permission_code: 'view_ehs', 
      requiresAuth: true
    } 
  },
  { 
    path: '/assy', 
    component: Assy,
    meta: { 
      title: '生产',
      permission_code: 'access_assy', // 转换为新格式
      requiresAuth: true
    }
  },
  { 
    path: '/pcl', 
    component: Pcl,
    meta: { 
      title: '物流',
      permission_code: 'access_pcl', // 转换为新格式
      requiresAuth: true
    } 
  },
  { 
    path: '/gmo', 
    component: Gmo,
    meta: { 
      title: 'GMO',
      permission_code: 'access_gmo', // 转换为新格式
      requiresAuth: true
    } 
  },
  { 
    path: '/events', 
    component: Events,
    meta: { 
      title: '重要事件',
      permission_code: 'view_events',
      requiresAuth: true
    } 
  },
  {
    path: '/qa_others',
    component: Qa_others,
    meta: { 
      title: '质量管理',
      permission_code: 'view_quality',
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
  if (!permissionStore.permissionCodes || permissionStore.permissionCodes.length === 0) {
    try {
      await permissionStore.initialize()
    } catch (error) {
      console.error('初始化权限信息出错:', error)
    }
  }
  
  // 检查超级管理员
  const isSuperAdmin = userStore.roles.includes('超级管理员')
  
  // 超级管理员可以访问所有页面
  if (isSuperAdmin) {
    return next()
  }
  
  // 所有人可访问的页面
  if (to.meta.permission_code === '*') {
    return next()
  }
  
  // 提取权限代码
  let permissionCode = null
  
  if (to.meta.permission_code) {
    // 直接使用权限代码
    permissionCode = to.meta.permission_code
  } else if (to.meta.permission) {
    // 兼容旧格式
    if (typeof to.meta.permission === 'string' && to.meta.permission !== '*') {
      // 直接使用字符串作为权限代码
      permissionCode = `access_${to.meta.permission.toLowerCase()}`
    } else if (typeof to.meta.permission === 'object') {
      // 从对象中提取模块和级别，转换为权限代码
      const { module, level } = to.meta.permission
      if (module && level) {
        switch (level.toLowerCase()) {
          case 'read':
            permissionCode = `view_${module.toLowerCase()}`
            break
          case 'write':
            permissionCode = `edit_${module.toLowerCase()}`
            break
          case 'admin':
            permissionCode = `manage_${module.toLowerCase()}`
            break
          default:
            permissionCode = `access_${module.toLowerCase()}`
        }
      } else if (module) {
        permissionCode = `access_${module.toLowerCase()}`
      }
    }
  }
  
  // 检查用户是否有权限访问路由
  if (permissionCode) {
    // 检查是否有该权限代码
    if (permissionStore.hasPermission(permissionCode)) {
      return next()
    }
  } else {
    // 没有指定权限代码的情况下，检查路由路径
    if (permissionStore.canAccessRoute(to.path)) {
      return next()
    }
  }
  
  // 无权限访问
  Message.error('无权访问此页面')
  return next(from.path || '/')
})

export default router