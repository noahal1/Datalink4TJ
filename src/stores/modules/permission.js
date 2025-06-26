import { defineStore } from 'pinia'
import { permissionService } from '../../services'

// 调试模式标志
const isDebugMode = false // 默认关闭调试模式
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[权限模块]', ...args)
  }
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissionCodes: [],   // 当前用户的权限代码列表
    accessibleRoutes: [],  // 当前用户可访问的路由路径
    isInitialized: false,  // 是否已初始化
  }),

  getters: {
    // 检查是否拥有特定权限
    hasPermission: (state) => (permissionCode) => {
      if (!permissionCode) return true
      if (permissionCode === '*') return true
      
      // 检查权限代码是否存在
      return state.permissionCodes.includes(permissionCode)
    },

    // 检查是否能访问特定路由
    canAccessRoute: (state) => (routePath) => {
      if (!routePath) return false
      
      // 规范化路径
      const normalizedPath = routePath.startsWith('/') 
        ? routePath 
        : `/${routePath}`
      
      // 检查路径是否在可访问路由列表中
      return state.accessibleRoutes.some(route => {
        // 完全匹配
        if (route === normalizedPath) return true
        
        // 路径前缀匹配 (例如 /user/* 可以匹配 /user/profile)
        if (route.endsWith('/*')) {
          const baseRoute = route.slice(0, -2)
          return normalizedPath.startsWith(baseRoute)
        }
        
        return false
      })
    }
  },

  actions: {
    // 初始化权限
    async initialize() {
      debug('初始化权限')
      
      try {
        // 加载用户权限
        await this.loadUserPermissions()
        
        // 加载可访问路由
        await this.loadAccessibleRoutes()
        
        // 标记为已初始化
        this.isInitialized = true
        debug('权限初始化完成')
        
        // 保存到本地存储
        this.saveToStorage()
        
        return true
      } catch (error) {
        console.error('初始化权限失败:', error)
        this.isInitialized = false
        return false
      }
    },

    // 加载用户权限
    async loadUserPermissions() {
      try {
        // 调用权限服务获取用户权限
        const permissions = await permissionService.getUserPermissions()
        
        if (permissions && Array.isArray(permissions)) {
          // 提取权限代码
          this.permissionCodes = permissions.map(p => p.code || p)
          debug('加载用户权限成功:', this.permissionCodes.length, '个权限')
          return true
        } else {
          debug('获取用户权限失败: 无效数据')
          return false
        }
      } catch (error) {
        debug('加载用户权限失败:', error)
        return false
      }
    },

    // 加载用户可访问的路由
    async loadAccessibleRoutes() {
      try {
        // 调用权限服务获取可访问路由
        const routes = await permissionService.getAccessibleRoutes()
        
        if (routes && Array.isArray(routes)) {
          this.accessibleRoutes = routes.map(r => r.path || r)
          debug('加载可访问路由成功:', this.accessibleRoutes.length, '个路由')
          return true
        } else {
          debug('获取可访问路由失败: 无效数据')
          return false
        }
      } catch (error) {
        debug('加载可访问路由失败:', error)
        return false
      }
    },

    // 从本地存储加载权限状态
    loadFromStorage() {
      try {
        const storedPermissions = localStorage.getItem('permissions')
        if (storedPermissions) {
          const permissionsData = JSON.parse(storedPermissions)
          this.permissionCodes = permissionsData.permissionCodes || []
          this.accessibleRoutes = permissionsData.accessibleRoutes || []
          this.isInitialized = permissionsData.isInitialized || false
          debug('从本地存储加载权限状态')
        }
      } catch (error) {
        debug('从本地存储加载权限状态失败:', error)
        this.clearPermissions()
      }
    },

    // 保存权限状态到本地存储
    saveToStorage() {
      try {
        const permissionsData = {
          permissionCodes: this.permissionCodes,
          accessibleRoutes: this.accessibleRoutes,
          isInitialized: this.isInitialized
        }
        localStorage.setItem('permissions', JSON.stringify(permissionsData))
        debug('权限状态已保存到本地存储')
      } catch (error) {
        debug('保存权限状态到本地存储失败:', error)
      }
    },

    // 清除权限数据
    clearPermissions() {
      this.permissionCodes = []
      this.accessibleRoutes = []
      this.isInitialized = false
      
      // 清除本地存储
      localStorage.removeItem('permissions')
      debug('权限数据已清除')
    }
  },
  
  // 启用该store的持久化
  persist: {
    // 只持久化以下字段
    paths: ['permissionCodes', 'accessibleRoutes', 'isInitialized']
  }
}) 