import { defineStore } from 'pinia'
import { useUserStore } from './user'
import api from '../utils/api'

// 调试模式 - 开发环境打印详细日志
const isDebugMode = true
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[权限模块]', ...args)
  }
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    // 简化的权限状态，只保留必要信息
    roles: [],
    // 用户可访问的路由（从后端获取）
    accessibleRoutesList: [],
    // 加载状态
    loading: false,
    // 初始化状态
    isInitialized: false,
    // 权限加载完成状态
    permissionsLoaded: false
  }),

  getters: {
    // 检查是否有指定角色
    hasRole: () => (roleName) => {
      const userStore = useUserStore()

      if (!userStore.isLogin) {
        debug('用户未登录，无角色权限')
        return false
      }

      const hasRole = userStore.roles.includes(roleName)
      debug(`检查角色权限: ${roleName} = ${hasRole}`)
      return hasRole
    },
    
    // 检查是否是超级管理员
    isSuperUser: () => {
      const userStore = useUserStore()
      return userStore.roles.includes('超级管理员') || userStore.roles.includes('管理员')
    },
    
    // 获取用户可访问的路由列表
    accessibleRoutes: (state) => {
      return state.accessibleRoutesList || []
    },

    // 检查用户是否可以访问指定路由
    canAccessRoute: (state) => (routePath) => {
      const userStore = useUserStore()

      // 超级管理员和管理员可以访问所有路由
      if (userStore.roles.includes('超级管理员') || userStore.roles.includes('管理员')) {
        return true
      }

      // 如果权限还在加载中，暂时拒绝访问（避免首次登录时显示未授权路由）
      if (state.loading || !state.permissionsLoaded) {
        debug(`权限加载中，暂时拒绝访问路由: ${routePath}`)
        return false
      }

      // 检查路由是否在可访问列表中
      if (state.accessibleRoutesList && state.accessibleRoutesList.length > 0) {
        const hasAccess = state.accessibleRoutesList.some(route => route.path === routePath)
        debug(`路由权限检查: ${routePath} = ${hasAccess}`)
        return hasAccess
      }

      // 如果权限已加载但列表为空，默认拒绝访问
      debug(`权限已加载但无可访问路由，拒绝访问: ${routePath}`)
      return false
    }
  },

  actions: {
    // 初始化权限信息
    async initPermissions() {
      if (this.isInitialized) {
        debug('权限已初始化，跳过')
        return
      }

      try {
        this.loading = true
        this.permissionsLoaded = false
        debug('开始初始化权限信息')

        const userStore = useUserStore()
        if (!userStore.isLogin) {
          debug('用户未登录，跳过权限初始化')
          this.loading = false
          return
        }

        // 获取用户可访问的路由
        await this.fetchUserRoutes()

        this.isInitialized = true
        this.permissionsLoaded = true
        debug('权限初始化完成')

      } catch (error) {
        console.error('初始化权限失败:', error)
        this.permissionsLoaded = false
      } finally {
        this.loading = false
      }
    },

    // 获取用户可访问的路由
    async fetchUserRoutes() {
      try {
        debug('获取用户可访问路由')

        const response = await api.get('/user-routes')
        this.accessibleRoutesList = response.data || []

        debug(`获取到 ${this.accessibleRoutesList.length} 个可访问路由:`, this.accessibleRoutesList.map(r => r.path))

        // 保存到本地存储
        localStorage.setItem('accessibleRoutes', JSON.stringify(this.accessibleRoutesList))

        // 标记权限加载完成
        this.permissionsLoaded = true

      } catch (error) {
        console.error('获取用户路由失败:', error)

        // 尝试从本地存储恢复
        const cached = localStorage.getItem('accessibleRoutes')
        if (cached) {
          try {
            this.accessibleRoutesList = JSON.parse(cached)
            this.permissionsLoaded = true
            debug('从本地存储恢复路由信息')
          } catch (e) {
            console.error('解析本地存储的路由信息失败:', e)
            this.accessibleRoutesList = []
            this.permissionsLoaded = false
          }
        } else {
          this.accessibleRoutesList = []
          this.permissionsLoaded = false
        }

        // 重新抛出错误，让调用者知道获取失败
        throw error
      }
    },

    // 检查路由访问权限
    async checkRouteAccess(routePath) {
      try {
        const response = await api.post('/permissions/check-route-access', null, {
          params: { route_path: routePath }
        })
        
        return response.data.has_access || false
      } catch (error) {
        console.error('检查路由访问权限失败:', error)
        return false
      }
    },

    // 清除权限信息
    clearPermissions() {
      debug('清除权限信息')
      this.roles = []
      this.accessibleRoutesList = []
      this.isInitialized = false
      this.permissionsLoaded = false

      // 清除本地存储
      localStorage.removeItem('accessibleRoutes')
    },

    // 刷新权限信息
    async refreshPermissions() {
      debug('刷新权限信息')
      this.isInitialized = false
      this.permissionsLoaded = false
      await this.initPermissions()
    }
  }
})

// 权限检查工具函数
export const checkPermission = (permissionCode) => {
  const permissionStore = usePermissionStore()
  const userStore = useUserStore()
  
  // 超级管理员拥有所有权限
  if (userStore.roles.includes('超级管理员') || userStore.roles.includes('管理员')) {
    return true
  }
  
  // 基于角色的简单权限检查
  const rolePermissions = {
    '普通用户': ['dashboard_view'],
    '质量部门负责人': ['dashboard_view', 'quality_view', 'quality_manage'],
    '质量班组负责人': ['dashboard_view', 'quality_view', 'quality_manage'],
    '维修班组负责人': ['dashboard_view', 'maintenance_view', 'maintenance_manage'],
    '安全负责人': ['dashboard_view', 'safety_view', 'safety_manage']
  }
  
  for (const role of userStore.roles) {
    const permissions = rolePermissions[role] || []
    if (permissions.includes(permissionCode)) {
      return true
    }
  }
  
  return false
}

// 路由权限检查工具函数
export const checkRoutePermission = (routePath) => {
  const permissionStore = usePermissionStore()
  return permissionStore.canAccessRoute(routePath)
}

export default usePermissionStore
