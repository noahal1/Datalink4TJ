import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import Message from '../utils/notification'

// 导入路由模块
import { baseRoutes } from './base'
import { componentMap, fetchDynamicRoutes, processRoute } from './dynamic'

// 只使用基础路由，其他路由将动态加载
const routes = [
  ...baseRoutes
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

// 添加路由调试信息
console.log('🔧 初始静态路由数量:', router.getRoutes().length)
console.log('📋 静态路由列表:', router.getRoutes().map(r => ({ path: r.path, name: r.name })))

// 动态路由加载状态
let dynamicRoutesLoaded = false
let dynamicRoutesLoading = false

// 添加动态路由的函数
export async function addDynamicRoutes() {
  // 防止重复加载
  if (dynamicRoutesLoaded || dynamicRoutesLoading) {
    console.log('🔄 动态路由已加载或正在加载中，跳过重复加载')
    return []
  }

  dynamicRoutesLoading = true

  try {
    console.log('🚀 开始加载动态路由...')

    // 在函数内部导入 routeService 以避免循环依赖
    const { routeService } = await import('../services')

    // 获取并处理动态路由
    const dynamicRoutes = await fetchDynamicRoutes(routeService)
    console.log(`📋 处理完成，共有 ${dynamicRoutes.length} 个动态路由`)

    let addedCount = 0
    let skippedCount = 0

    // 将动态路由添加到路由器
    dynamicRoutes.forEach(route => {
      // 检查是否与静态路由冲突
      const existingRoute = router.getRoutes().find(r => r.path === route.path)
      if (existingRoute) {
        console.warn(`⚠️ 跳过动态路由 ${route.path}，因为静态路由已存在`)
        skippedCount++
        return
      }

      if (!router.hasRoute(route.name)) {
        router.addRoute(route)
        console.log(`✅ 添加动态路由: ${route.path} (${route.name})`)
        addedCount++
      } else {
        console.warn(`⚠️ 跳过重复路由: ${route.name}`)
        skippedCount++
      }
    })

    dynamicRoutesLoaded = true
    console.log(`🎉 动态路由加载完成: 添加 ${addedCount} 个，跳过 ${skippedCount} 个`)
    console.log(`📊 当前总路由数: ${router.getRoutes().length}`)

    return dynamicRoutes
  } catch (error) {
    console.error('❌ 添加动态路由失败:', error)
    // 显示用户友好的错误信息
    if (typeof Message !== 'undefined') {
      Message.error('动态路由加载失败，请刷新页面重试')
    }
    return []
  } finally {
    dynamicRoutesLoading = false
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

// 路由守卫：处理动态路由加载
router.beforeEach(async (to, from, next) => {
  console.log(`🧭 路由导航: ${from.path} -> ${to.path}`)

  // 如果动态路由还没有加载，先加载动态路由
  if (!dynamicRoutesLoaded && !dynamicRoutesLoading) {
    console.log('🔄 检测到未加载动态路由，开始加载...')
    try {
      await addDynamicRoutes()

      // 重新检查目标路由是否存在
      const targetRoute = router.resolve(to.path)
      if (targetRoute.matched.length > 0) {
        console.log(`✅ 动态路由加载后找到目标路由: ${to.path}`)
        next(to.path) // 重新导航到目标路由
        return
      }
    } catch (error) {
      console.error('❌ 路由守卫中加载动态路由失败:', error)
    }
  }

  // 检查路由是否存在
  if (to.matched.length === 0) {
    console.warn(`⚠️ 路由不存在: ${to.path}`)
    // 如果是根路径，重定向到仪表板
    if (to.path === '/') {
      next('/dashboard')
      return
    }
    // 其他情况重定向到仪表板
    next('/dashboard')
    return
  }

  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('🚨 路由错误:', error)
  console.error('🔍 错误详情:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  })

  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.error('💥 动态导入失败，可能是组件文件不存在或网络问题')
    console.error('🔄 尝试重新加载动态路由...')

    // 尝试重新加载动态路由
    setTimeout(async () => {
      try {
        await addDynamicRoutes()
        console.log('✅ 动态路由重新加载完成')
      } catch (reloadError) {
        console.error('❌ 动态路由重新加载失败:', reloadError)
      }
    }, 1000)

    if (typeof Message !== 'undefined') {
      Message.error('页面加载失败，正在尝试重新加载...')
    }
  }
})

export default router