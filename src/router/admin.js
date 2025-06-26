// admin.js - 定义管理类模块路由

// 管理页面组件
const Admin = () => import('../pages/Admin.vue')
const RouteManagement = () => import('../pages/RouteManagement.vue')
const PermissionManagement = () => import('../pages/PermissionManagement.vue')
const AdminDepartments = () => import('../pages/admin/Departments.vue')
const AdminActivities = () => import('../pages/admin/Activities.vue')
const AdminUsers = () => import('../pages/admin/Users.vue')
// 管理模块路由配置
export const adminRoutes = [
  // 添加主管理页面路由
  {
    path: '/user',
    component: AdminUsers,
    meta: {
      title: '用户管理',
      icon: 'mdi-account-group',
      requiresAuth: true,
      permission_code: 'manage_users'
    }
  },
  {
    path: '/routes',
    component: RouteManagement,
    meta: {
      title: '路由管理',
      icon: 'mdi-routes',
      requiresAuth: true,
      permission_code: 'manage_routes'
    }
  },
  {
    path: '/permissions',
    component: PermissionManagement,
    meta: {
      title: '权限管理',
      icon: 'mdi-shield-account',
      requiresAuth: true,
      permission_code: 'manage_permissions'
    }
  },
  {
    path: '/admin/departments',
    component: AdminDepartments,
    meta: {
      title: '部门管理',
      icon: 'mdi-domain',
      requiresAuth: true,
      permission_code: 'manage_departments'
    }
  },
  {
    path: '/admin/activities',
    component: AdminActivities,
    meta: {
      title: '活动管理',
      icon: 'mdi-calendar-check',
      requiresAuth: true,
      permission_code: 'manage_activities'
    }
  }
] 