// base.js - 定义基础路由，如登录、仪表盘等

// 登录页面使用懒加载
const Login = () => import('../pages/Login.vue')
const Dashboard = () => import('../pages/Dashboard.vue')

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
  // 404页面
  {
    path: '/:pathMatch(.*)*', 
    redirect: '/dashboard'
  }
] 