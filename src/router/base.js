// base.js - 定义基础路由，如登录、仪表盘等

// 登录页面使用懒加载
const Login = () => import('../pages/Login.vue')
const Dashboard = () => import('../pages/Dashboard.vue')
const Profile = () => import('../pages/Profile.vue')
const Settings = () => import('../pages/Settings.vue')
const TestActionPlan = () => import('../pages/TestActionPlan.vue')
const ButtonTest = () => import('../pages/ButtonTest.vue')

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
    path: '/profile',
    component: Profile,
    meta: {
      title: '个人资料',
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    component: Settings,
    meta: {
      title: '系统设置',
      requiresAuth: true
    }
  },
  {
    path: '/test-action-plan',
    component: TestActionPlan,
    meta: {
      title: '行动计划测试',
      requiresAuth: true
    }
  },
  {
    path: '/button-test',
    component: ButtonTest,
    meta: {
      title: '按钮测试',
      requiresAuth: true
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
] 