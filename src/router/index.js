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
      console.log('权限未初始化，开始加载权限')
      await permissionStore.initPermissions()
      console.log('权限加载完成')
    }

    // 3. 等待权限加载完成
    if (userStore.isAuthenticated && permissionStore.loading) {
      console.log('权限正在加载中，等待完成...')
      // 等待权限加载完成
      let attempts = 0
      while (permissionStore.loading && attempts < 50) { // 最多等待5秒
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      console.log('权限加载等待完成')
    }

    // 4. 检查路由访问权限
    if (requiresAuth && to.path !== '/dashboard') {
      // 检查用户是否可以访问该路由
      const hasAccess = permissionStore.canAccessRoute(to.path)
      if (!hasAccess && !permissionStore.isSuperUser) {
        console.log(`用户无权限访问路由: ${to.path}，拒绝访问`)
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
  if (to.meta.title) {
    document.title = `${to.meta.title} - Datalink4TJ`
  } else {
    document.title = 'Datalink4TJ'
  }
})

export default router