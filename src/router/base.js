// base.js - 定义基础路由，如登录、仪表盘等

// 登录页面使用懒加载
const Login = () => import('../pages/Login.vue')
const Dashboard = () => import('../pages/Dashboard.vue')
const ApiDebugTest = () => import('../pages/ApiDebugTest.vue')
const RouteDebug = () => import('../pages/RouteDebug.vue')

// 基础路由配置
export const baseRoutes = [
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
      public: true
    }
  },
  {
    path: '/api-debug',
    component: ApiDebugTest,
    meta: {
      title: 'API调试',
      permission_code: '*',
      requiresAuth: true
    }
  },
  {
    path: '/route-debug',
    component: RouteDebug,
    meta: {
      title: '路由调试',
      permission_code: '*',
      requiresAuth: true
    }
  },
  {
    path: '/component-test',
    component: () => import('../pages/ComponentTest.vue'),
    meta: {
      title: '组件测试',
      permission_code: '*',
      requiresAuth: true
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
] 