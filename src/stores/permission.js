import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { permissionService } from '../services'

// 调试模式 - 开发环境打印详细日志
const isDebugMode = true
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[权限模块]', ...args)
  }
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    // 权限缓存
    permissionCache: {},
    // 角色列表
    roles: [],
    // 权限代码列表
    permissionCodes: [],
    // 当前用户的权限信息
    currentUserPermissions: {
      roles: []
    },
    // 可访问路由列表
    routePermissions: [],
    // 加载状态
    loading: false
  }),
  
  getters: {
    // 检查是否有特定权限代码
    hasPermission: (state) => (permissionCode) => {
      const userStore = useUserStore()
      
      // 如果用户未登录，返回false
      if (!userStore.isLogin) {
        return false
      }
      
      // 检查是否有超级管理员角色
      if (userStore.roles.includes('超级管理员')) {
        return true
      }
      
      // 构建缓存键
      const cacheKey = `perm:${permissionCode}`
      
      // 如果缓存中有结果，直接返回
      if (state.permissionCache[cacheKey] !== undefined) {
        return state.permissionCache[cacheKey]
      }

      // 检查特殊权限：所有人都可访问的页面
      if (permissionCode === '*') {
        return true
      }
      
      // 检查是否在权限代码列表中
      const result = state.permissionCodes.includes(permissionCode)
      
      // 缓存结果
      state.permissionCache[cacheKey] = result
      
      return result
    },
    
    // 获取用户角色名称列表
    userRoles: (state) => {
      return state.currentUserPermissions.roles || []
    },
    
    // 检查是否是超级管理员
    isSuperUser: (state) => {
      const userStore = useUserStore()
      return userStore.roles.includes('超级管理员')
    },
    
    // 获取用户可访问的路由列表
    accessibleRoutes: (state) => {
      // 从本地存储获取路由列表
      const routesStr = localStorage.getItem('accessibleRoutes')
      if (routesStr) {
        try {
          return JSON.parse(routesStr)
        } catch (e) {
          console.error('解析可访问路由列表失败:', e)
        }
      }
      
      // 默认可访问的基本路由
      return [
        { path: '/dashboard', name: '首页' }
      ]
    }
  },
  
  actions: {
    // 初始化权限信息
    async initialize() {
      try {
        this.loading = true
        debug('初始化权限信息')
        
        const userStore = useUserStore()
        
        // 确保用户已登录
        if (!userStore.isLogin) {
          debug('用户未登录，跳过权限初始化')
          return
        }
        
        // 获取用户权限信息
        try {
          debug('获取用户权限信息...')
          const userPermissions = await permissionService.getUserPermissions()
          
          if (userPermissions) {
            // 更新当前用户权限信息
            this.currentUserPermissions = userPermissions
            
            // 更新角色列表
            if (userPermissions.roles && Array.isArray(userPermissions.roles)) {
              this.roles = userPermissions.roles
              
              // 同步到userStore
              userStore.setRoles(userPermissions.roles.map(role => role.name))
            }
            
            // 更新权限代码列表
            if (userPermissions.permission_codes && Array.isArray(userPermissions.permission_codes)) {
              this.permissionCodes = userPermissions.permission_codes
              debug('权限代码列表已更新:', this.permissionCodes)
            }
            
            debug('用户权限信息已更新:', this.currentUserPermissions)
          } else {
            debug('未获取到用户权限信息')
          }
        } catch (error) {
          console.error('获取用户权限信息失败:', error)
        }
        
        // 清除权限缓存
        this.permissionCache = {}
        
        // 获取用户可访问的路由列表
        try {
          debug('获取用户可访问路由...')
          const routes = await permissionService.getUserRoutes()
          
          if (routes && Array.isArray(routes)) {
            debug('获取到用户可访问的路由列表:', routes.length, '个路由')
            
            // 提取路由列表并保存到本地存储
            const routesList = routes.map(route => {
              // 保留路由的元数据，用于后续权限检查
              return {
                path: route.path,
                name: route.name || route.meta?.title || route.path,
                permissionCode: route.meta?.permission || null
              }
            })
            
            // 添加管理页面
            if (userStore.roles.includes('管理员') || userStore.roles.includes('超级管理员')) {
              if (!routesList.some(r => r.path === '/admin')) {
                routesList.push({ path: '/admin', name: '管理' })
              }
            }
            
            localStorage.setItem('accessibleRoutes', JSON.stringify(routesList))
            debug('保存可访问路由列表到本地存储:', routesList.length, '个路由')
          }
        } catch (error) {
          console.error('获取用户可访问路由列表失败:', error)
          
          // 确保至少有基本路由
          const basicRoutes = [
            { path: '/dashboard', name: '首页' }
          ]
          
          // 添加管理页面
          if (userStore.roles.includes('管理员') || userStore.roles.includes('超级管理员')) {
            basicRoutes.push({ path: '/admin', name: '管理' })
          }
          
          localStorage.setItem('accessibleRoutes', JSON.stringify(basicRoutes))
          debug('保存基本路由列表到本地存储')
        }
        
        debug('权限初始化完成')
      } catch (error) {
        console.error('初始化权限信息出错:', error)
      } finally {
        this.loading = false
      }
    },
    
    // 检查路由权限
    canAccessRoute(routePath) {
      const userStore = useUserStore()
      
      // 超级管理员可以访问所有路由
      if (userStore.roles.includes('超级管理员')) {
        return true
      }
      
      // 检查路由是否在可访问列表中
      const routes = this.accessibleRoutes
      
      // 找到匹配的路由
      const matchedRoute = routes.find(route => route.path === routePath)
      if (!matchedRoute) {
        return false
      }
      
      // 如果路由没有权限代码要求，则可以访问
      if (!matchedRoute.permissionCode) {
        return true
      }
      
      // 如果是所有人都可访问的权限代码
      if (matchedRoute.permissionCode === '*') {
        return true
      }
      
      // 检查是否有此权限代码
      return this.hasPermission(matchedRoute.permissionCode)
    },
    
    // 检查权限代码是否存在
    hasPermissionCode(code) {
      return this.permissionCodes.includes(code)
    },
    
    // 重置权限状态
    reset() {
      this.permissionCache = {}
      this.roles = []
      this.permissionCodes = []
      this.currentUserPermissions = {
        roles: []
      }
      
      // 清除路由权限
      localStorage.removeItem('accessibleRoutes')
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'permission_store',
        storage: localStorage
      }
    ]
  }
}) 