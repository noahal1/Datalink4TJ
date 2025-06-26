import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import Message from '../utils/notification'

// 导入路由模块
import { baseRoutes } from './base'
import { moduleRoutes } from './modules'
import { adminRoutes } from './admin'
import { componentMap, fetchDynamicRoutes, processRoute } from './dynamic'

// 合并所有静态路由
const routes = [
  ...baseRoutes,
  ...moduleRoutes,
  ...adminRoutes
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

// 添加动态路由的函数
export async function addDynamicRoutes() {
  try {
    // 在函数内部导入 routeService 以避免循环依赖
    const { routeService } = await import('../services')
    
    // 获取并处理动态路由
    const dynamicRoutes = await fetchDynamicRoutes(routeService)
    console.log(`处理完成，共有 ${dynamicRoutes.length} 个动态路由`)
    
    // 将动态路由添加到路由器
    dynamicRoutes.forEach(route => {
      if (!router.hasRoute(route.name)) {
          router.addRoute(route)
        console.log(`添加动态路由: ${route.path} (${route.name})`)
      }
    })
    
    return dynamicRoutes
  } catch (error) {
    console.error('添加动态路由失败:', error)
    return []
  }
}

// 导航守卫 - 权限控制
router.beforeEach(async (to, from, next) => {
  // 用于调试的日志
  console.log(`路由导航: ${from.path} -> ${to.path}`)
  
  // 获取用户和权限存储
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  
  // 检查是否需要登录
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // 如果是公共路由，直接通过
  if (to.matched.some(record => record.meta.public)) {
    console.log('访问公共页面')
    next()
    return
  }
  
  try {
    // 1. 检查用户是否已登录
    if (!userStore.isAuthenticated) {
      console.log('用户未登录，初始化用户状态')
      // 尝试初始化用户状态（从本地存储恢复会话）
      const isInitialized = await userStore.initialize()
      
      if (!isInitialized && requiresAuth) {
        console.log('用户未登录且需要认证，重定向到登录页')
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }
    
    // 2. 确保权限已加载
    if (userStore.isAuthenticated && !permissionStore.isInitialized) {
      console.log('权限未初始化，加载权限')
      await permissionStore.initialize()
    }
    
    // 3. 检查是否有权限访问
    const permissionCode = to.meta.permission_code
    if (requiresAuth && permissionCode && permissionCode !== '*') {
      if (!permissionStore.hasPermission(permissionCode)) {
        console.log(`用户无权限: ${permissionCode}，拒绝访问`)
        Message.error('没有访问权限')
        next({ path: '/dashboard' })
        return
      }
    }
    
    // 通过所有检查，允许导航
    next()
    
  } catch (error) {
    console.error('路由导航守卫错误:', error)
    // 发生错误时，重定向到登录页
    next({ path: '/login' })
  }
})

// 路由解析后的处理
router.afterEach((to) => {
  // 更新页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - Datalink4TJ`
  } else {
    document.title = 'Datalink4TJ'
  }
  
  // 其他路由完成后的操作...
})

export default router