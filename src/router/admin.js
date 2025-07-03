// admin.js - 定义管理类模块路由

// 管理页面组件
const RouteManagement = () => import('../pages/RouteManagement.vue')
const PermissionManagement = () => import('../pages/PermissionManagement.vue')
const AdminDepartments = () => import('../pages/admin/Departments.vue')
const AdminActivities = () => import('../pages/admin/Activities.vue')
const AdminUsers = () => import('../pages/admin/Users.vue')
const PermissionTest = () => import('../pages/PermissionTest.vue')
const SimplePermissionManagement = () => import('../pages/PermissionManagement.vue')

export const adminRoutes = [
  // 用户管理页面
  {
    path: '/admin/users',
    component: AdminUsers,
    meta: {
      title: '用户管理',
      icon: 'mdi-account-group',
      requiresAuth: true,
      permission_code: 'admin_access'
    }
  },
  {
    path: '/admin/routes',
    component: RouteManagement,
    meta: {
      title: '路由管理',
      icon: 'mdi-routes',
      requiresAuth: true,
      permission_code: 'admin_access'
    }
  },
  {
    path: '/admin/permissions',
    component: PermissionManagement,
    meta: {
      title: '权限管理',
      icon: 'mdi-shield-account',
      requiresAuth: true,
      permission_code: 'admin_access'
    }
  },
  {
    path: '/admin/departments',
    component: AdminDepartments,
    meta: {
      title: '部门管理',
      icon: 'mdi-domain',
      requiresAuth: true,
      permission_code: 'admin_access'
    }
  },
  {
    path: '/admin/activities',
    component: AdminActivities,
    meta: {
      title: '操作记录',
      icon: 'mdi-history',
      requiresAuth: true,
      permission_code: 'admin_access'
    }
  },
  {
    path: '/admin/permission-test',
    component: PermissionTest,
    meta: {
      title: '权限测试',
      icon: 'mdi-shield-check',
      requiresAuth: true,
      permission_code: 'admin_access'
    }
  },
  {
    path: '/admin/simple-permissions',
    component: SimplePermissionManagement,
    meta: {
      title: '权限管理',
      icon: 'mdi-shield-account-outline',
      requiresAuth: true,
      permission_code: 'admin_access'
    }
  }
] 