/**
 * 权限调试工具
 * 用于调试和测试权限相关的问题
 */

import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'

// 权限状态监控
export const monitorPermissionState = () => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  
  console.log('=== 权限状态监控 ===')
  console.log('用户登录状态:', userStore.isAuthenticated)
  console.log('用户角色:', userStore.roles)
  console.log('权限初始化状态:', permissionStore.isInitialized)
  console.log('权限加载状态:', permissionStore.loading)
  console.log('权限加载完成状态:', permissionStore.permissionsLoaded)
  console.log('可访问路由数量:', permissionStore.accessibleRoutes.length)
  console.log('可访问路由列表:', permissionStore.accessibleRoutes.map(r => r.path))
  console.log('========================')
}

// 测试路由权限
export const testRoutePermission = (routePath) => {
  const permissionStore = usePermissionStore()
  const hasAccess = permissionStore.canAccessRoute(routePath)
  
  console.log(`=== 路由权限测试: ${routePath} ===`)
  console.log('权限检查结果:', hasAccess)
  console.log('权限加载状态:', permissionStore.loading)
  console.log('权限加载完成:', permissionStore.permissionsLoaded)
  console.log('是否超级用户:', permissionStore.isSuperUser)
  console.log('================================')
  
  return hasAccess
}

// 权限状态变化监听器
export const watchPermissionChanges = () => {
  const permissionStore = usePermissionStore()
  
  // 监听权限状态变化
  permissionStore.$subscribe((mutation, state) => {
    console.log('权限状态变化:', {
      type: mutation.type,
      storeId: mutation.storeId,
      payload: mutation.payload,
      isInitialized: state.isInitialized,
      loading: state.loading,
      permissionsLoaded: state.permissionsLoaded,
      routesCount: state.accessibleRoutesList.length
    })
  })
}

// 模拟权限加载延迟测试
export const simulatePermissionLoadDelay = async (delayMs = 2000) => {
  console.log(`模拟权限加载延迟 ${delayMs}ms`)
  
  const permissionStore = usePermissionStore()
  const originalFetchUserRoutes = permissionStore.fetchUserRoutes
  
  // 临时替换方法以添加延迟
  permissionStore.fetchUserRoutes = async function() {
    console.log('开始模拟延迟加载权限...')
    await new Promise(resolve => setTimeout(resolve, delayMs))
    console.log('延迟结束，开始实际加载权限')
    return originalFetchUserRoutes.call(this)
  }
  
  return () => {
    // 恢复原始方法
    permissionStore.fetchUserRoutes = originalFetchUserRoutes
  }
}

// 权限问题诊断
export const diagnosePermissionIssues = () => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  
  console.log('=== 权限问题诊断 ===')
  
  const issues = []
  
  // 检查用户登录状态
  if (!userStore.isAuthenticated) {
    issues.push('用户未登录')
  }
  
  // 检查权限初始化状态
  if (userStore.isAuthenticated && !permissionStore.isInitialized) {
    issues.push('用户已登录但权限未初始化')
  }
  
  // 检查权限加载状态
  if (permissionStore.isInitialized && !permissionStore.permissionsLoaded) {
    issues.push('权限已初始化但未加载完成')
  }
  
  // 检查权限列表
  if (permissionStore.permissionsLoaded && permissionStore.accessibleRoutes.length === 0) {
    issues.push('权限已加载但无可访问路由')
  }
  
  // 检查本地存储
  const cachedRoutes = localStorage.getItem('accessibleRoutes')
  if (!cachedRoutes) {
    issues.push('本地存储中无权限缓存')
  }
  
  if (issues.length === 0) {
    console.log('✅ 未发现权限相关问题')
  } else {
    console.log('❌ 发现以下权限问题:')
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`)
    })
  }
  
  console.log('===================')
  
  return issues
}

// 强制刷新权限
export const forceRefreshPermissions = async () => {
  console.log('强制刷新权限...')
  
  const permissionStore = usePermissionStore()
  
  // 清除本地缓存
  localStorage.removeItem('accessibleRoutes')
  
  // 重置状态
  permissionStore.isInitialized = false
  permissionStore.permissionsLoaded = false
  permissionStore.accessibleRoutesList = []
  
  // 重新初始化
  await permissionStore.initPermissions()
  
  console.log('权限刷新完成')
  monitorPermissionState()
}

// 导出调试工具到全局对象（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  window.permissionDebug = {
    monitor: monitorPermissionState,
    test: testRoutePermission,
    watch: watchPermissionChanges,
    simulate: simulatePermissionLoadDelay,
    diagnose: diagnosePermissionIssues,
    refresh: forceRefreshPermissions
  }
  
  console.log('权限调试工具已加载到 window.permissionDebug')
}
