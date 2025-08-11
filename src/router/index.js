import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import Message from '../utils/notification'

import { baseRoutes } from './base'
import { componentMap, fetchDynamicRoutes, processRoute } from './dynamic'
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


let dynamicRoutesLoaded = false
let dynamicRoutesLoading = false

// 导出状态变量以便外部访问和重置
export const getDynamicRoutesState = () => ({
  loaded: dynamicRoutesLoaded,
  loading: dynamicRoutesLoading
})

export const resetDynamicRoutesState = () => {
  dynamicRoutesLoaded = false
  dynamicRoutesLoading = false
  console.log('🔄 动态路由状态已重置')
}

export async function addDynamicRoutes() {
  if (dynamicRoutesLoaded || dynamicRoutesLoading) {
    console.log('🔄 动态路由已加载或正在加载中，跳过重复加载')
    return []
  }

  dynamicRoutesLoading = true

  try {
    console.log('🚀 开始加载动态路由...')

    const { routeService } = await import('../services')
    const dynamicRoutes = await fetchDynamicRoutes(routeService)
    console.log(`📋 处理完成，共有 ${dynamicRoutes.length} 个动态路由`)

    let addedCount = 0
    let skippedCount = 0

    dynamicRoutes.forEach(route => {
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
    if (typeof Message !== 'undefined') {
      Message.error('动态路由加载失败，请刷新页面重试')
    }
    return []
  } finally {
    dynamicRoutesLoading = false
  }
}

router.beforeEach(async (to, from, next) => {
  console.log(`路由导航: ${from.path} -> ${to.path}`)
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  // 首先检查是否需要加载动态路由
  if (!dynamicRoutesLoaded && !dynamicRoutesLoading) {
    console.log('检测到未加载动态路由，开始加载...')
    try {
      await addDynamicRoutes()
      console.log('动态路由加载完成，重新解析目标路由')

      // 重新解析目标路由
      const targetRoute = router.resolve(to.path)
      if (targetRoute.matched.length > 0) {
        console.log(`动态路由加载后找到目标路由: ${to.path}`)
        // 重新导航到目标路由，这次应该能找到匹配的路由
        next(to.path)
        return
      }
    } catch (error) {
      console.error('路由守卫中加载动态路由失败:', error)
    }
  }

  // 检查路由是否存在
  if (to.matched.length === 0) {
    console.warn(`路由不存在: ${to.path}`)
    if (to.path === '/') {
      next('/dashboard')
      return
    }
    next('/dashboard')
    return
  }

  // 检查是否为公共页面
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  if (to.matched.some(record => record.meta.public)) {
    console.log('访问公共页面')
    next()
    return
  }

  try {
    // 用户认证检查
    if (!userStore.isAuthenticated) {
      console.log('用户未登录，初始化用户状态')
      const isInitialized = await userStore.initialize()

      if (!isInitialized && requiresAuth) {
        console.log('用户未登录且需要认证，重定向到登录页')
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }

    // 权限初始化检查
    if (userStore.isAuthenticated && !permissionStore.isInitialized) {
      console.log('权限未初始化，开始加载权限')
      await permissionStore.initPermissions()
      console.log('权限加载完成')
    }

    // 等待权限加载完成
    if (userStore.isAuthenticated && permissionStore.loading) {
      console.log('权限正在加载中，等待完成...')
      let attempts = 0
      while (permissionStore.loading && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      console.log('权限加载等待完成')
    }

    // 权限检查
    if (requiresAuth && to.path !== '/dashboard') {
      const hasAccess = permissionStore.canAccessRoute(to.path)
      if (!hasAccess && !permissionStore.isSuperUser) {
        console.log(`用户无权限访问路由: ${to.path}，拒绝访问`)
        Message.error('没有访问权限')
        next({ path: '/dashboard' })
        return
      }
    }

    next()

  } catch (error) {
    console.error('路由导航守卫错误:', error)
    next({ path: '/login' })
  }
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - Datalink4TJ`
  } else {
    document.title = 'Datalink4TJ'
  }
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
    console.error('动态导入失败，可能是组件文件不存在或网络问题')
    console.error('尝试重新加载动态路由...')

    // 尝试重新加载动态路由
    setTimeout(async () => {
      try {
        await addDynamicRoutes()
        console.log('动态路由重新加载完成')
      } catch (reloadError) {
        console.error('动态路由重新加载失败:', reloadError)
      }
    }, 1000)

    if (typeof Message !== 'undefined') {
      Message.error('页面加载失败，正在尝试重新加载...')
    }
  }
})

export default router