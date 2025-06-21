import { defineStore } from 'pinia'
import { useUserStore } from './user'
import api from '../utils/api'
import { Module, PermissionLevel, PermissionHelper } from '../utils/permissionConstants'

// 调试模式 - 开发环境打印详细日志
const isDebugMode = false
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[权限模块]', ...args)
  }
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    // 权限缓存 - 确保使用Map实例
    permissionCache: {},
    // 角色列表
    roles: [],
    // 权限列表
    permissions: [],
    // 当前用户的权限信息
    currentUserPermissions: {
      roles: []
    },
    // 加载状态
    loading: false
  }),
  
  getters: {
    // 检查是否有特定模块和级别的权限
    hasPermission: (state) => (module, level, departmentId = null) => {
      const userStore = useUserStore()
      
      // 如果用户未登录，返回false
      if (!userStore.isLogin) {
        debug('用户未登录，无权限')
        return false
      }
      
      // 检查是否有超级管理员角色
      if (state.currentUserPermissions.roles.includes('超级管理员')) {
        debug('超级管理员角色，拥有所有权限')
        return true
      }
      
      // 构建缓存键
      const cacheKey = `${module}:${level}:${departmentId || 'all'}`
      
      // 如果缓存中有结果，直接返回
      if (state.permissionCache[cacheKey] !== undefined) {
        const result = state.permissionCache[cacheKey]
        debug(`使用缓存权限 [${cacheKey}]: ${result}`)
        return result
      }
      
      // 检查角色权限
      const userRoles = state.currentUserPermissions.roles || []
      debug(`检查权限 [${cacheKey}], 用户角色: ${JSON.stringify(userRoles)}`)
      
      // 如果角色列表为空，直接返回false
      if (!Array.isArray(state.roles) || state.roles.length === 0) {
        debug('角色列表为空，可能用户不是管理员，无权限')
        state.permissionCache[cacheKey] = false
        return false
      }
      
      // 权限等级映射
      const levelMap = {
        [PermissionLevel.READ]: 1,
        [PermissionLevel.WRITE]: 2,
        [PermissionLevel.ADMIN]: 3,
        [PermissionLevel.SUPER_ADMIN]: 4
      }
      
      const requiredLevel = levelMap[level] || 0
      debug(`需要的权限级别: ${level} (${requiredLevel})`)
      
      // 检查用户的每个角色
      for (const roleName of userRoles) {
        const role = state.roles.find(r => r.name === roleName)
        if (!role) {
          debug(`找不到角色: ${roleName}`)
          continue
        }
        
        debug(`检查角色 ${roleName} 的权限, 拥有 ${role.permissions?.length || 0} 个权限`)
        
        // 检查角色的每个权限
        for (const permission of role.permissions || []) {
          debug(`检查权限: ${permission.module}:${permission.level}`)
          
          // 检查模块是否匹配
          if (permission.module !== module && permission.module !== Module.ALL) {
            debug(`模块不匹配: ${permission.module} != ${module}`)
            continue
          }
          
          // 检查权限等级
          const permLevel = levelMap[permission.level] || 0
          if (permLevel < requiredLevel) {
            debug(`权限级别不足: ${permission.level} (${permLevel}) < ${level} (${requiredLevel})`)
            continue
          }
          
          // 检查部门限制
          if (permission.department_id !== null && departmentId !== null) {
            if (permission.department_id !== departmentId && permission.department_id !== userStore.department?.id) {
              debug(`部门不匹配: ${permission.department_id} != ${departmentId}`)
              continue
            }
          }
          
          // 通过所有检查，拥有权限
          debug(`用户拥有权限 [${cacheKey}]，通过角色 ${roleName}，权限 ${permission.module}:${permission.level}`)
          state.permissionCache[cacheKey] = true
          return true
        }
      }
      
      // 默认无权限
      debug(`用户无权限 [${cacheKey}]`)
      state.permissionCache[cacheKey] = false
      return false
    },
    
    // 检查格式化的权限字符串 (MODULE:LEVEL)
    hasPermissionByString: (state) => (permissionString, departmentId = null) => {
      const { module, level } = PermissionHelper.parsePermission(permissionString)
      return state.hasPermission(module, level, departmentId)
    },
    
    // 获取用户角色名称列表
    userRoles: (state) => {
      return state.currentUserPermissions.roles || []
    },
    
    // 检查是否是超级管理员
    isSuperUser: (state) => {
      return state.currentUserPermissions.roles.includes('超级管理员')
    },
    
    // 获取用户所有权限的描述列表（用于UI显示）
    userPermissionDescriptions: (state) => {
      const descriptions = []
      const userRoles = state.currentUserPermissions.roles || []
      
      for (const roleName of userRoles) {
        const role = state.roles.find(r => r.name === roleName)
        if (!role) continue
        
        for (const permission of role.permissions || []) {
          const desc = `${permission.module}:${permission.level}`
          if (!descriptions.includes(desc)) {
            descriptions.push(desc)
          }
        }
      }
      
      return descriptions
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
        { path: '/dashboard', name: '首页' },
        { path: '/quality', name: '质量' },
        { path: '/qa_others', name: '质量管理' }
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
        
        // 更新当前用户权限信息
        this.currentUserPermissions = {
          roles: userStore.roles || []
        }
        
        debug('当前用户权限信息:', this.currentUserPermissions)
        
        // 清除权限缓存 - 使用对象重置方式
        this.permissionCache = {}
        
        // 检查用户是否具有管理员角色
        const isAdmin = userStore.roles && (
          userStore.roles.includes('超级管理员') || 
          userStore.roles.includes('管理员')
        )
        
        // 只有管理员才加载角色列表
        if (isAdmin) {
          debug('用户具有管理员权限，加载角色列表')
          await this.loadRoles()
        } else {
          debug('用户不是管理员，跳过加载角色列表')
          // 为非管理员用户设置空角色列表
          this.roles = []
        }
        
        // 获取权限列表
        await this.loadPermissions()
        
        // 获取用户详细权限信息
        try {
          const response = await api.get('/users/permissions')
          if (response && response.data) {
            debug('获取到用户详细权限信息:', response.data)
            
            // 更新用户角色和权限
            this.currentUserPermissions = {
              roles: response.data.roles.map(r => r.name) || [],
              permissions: response.data.permissions || []
            }
            
            // 检查QA:READ权限
            debug('用户是否有QA:READ权限:', response.data.has_qa_read)
            
            // 更新用户存储中的角色
            userStore.roles = this.currentUserPermissions.roles
          }
        } catch (error) {
          console.error('获取用户详细权限信息失败:', error)
        }
        
        // 获取用户可访问的路由列表
        try {
          const navResponse = await api.get('/navigation')
          if (navResponse && navResponse.data) {
            debug('获取到用户可访问的路由列表:', navResponse.data.length, '个路由')
            
            // 提取路由列表并保存到本地存储
            const routes = navResponse.data.map(route => ({
              path: route.path,
              name: route.name || route.meta?.title || route.path
            }))
            
            // 确保质量页面在可访问列表中
            if (!routes.some(r => r.path === '/quality')) {
              routes.push({ path: '/quality', name: '质量' })
            }
            if (!routes.some(r => r.path === '/qa_others')) {
              routes.push({ path: '/qa_others', name: '质量管理' })
            }
            
            localStorage.setItem('accessibleRoutes', JSON.stringify(routes))
            debug('保存可访问路由列表到本地存储:', routes.length, '个路由')
          }
        } catch (error) {
          console.error('获取用户可访问路由列表失败:', error)
          
          // 确保至少有基本路由
          const basicRoutes = [
            { path: '/dashboard', name: '首页' },
            { path: '/quality', name: '质量' },
            { path: '/qa_others', name: '质量管理' }
          ]
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
    
    // 加载角色列表
    async loadRoles() {
      try {
        const response = await api.get('/roles')
        if (response && response.data && Array.isArray(response.data)) {
          this.roles = response.data
          debug('角色列表加载成功:', this.roles)
        } else {
          console.warn('角色数据格式不正确:', response)
          this.roles = []
        }
      } catch (error) {
        console.error('加载角色列表失败:', error)
        this.roles = []
      }
    },
    
    // 加载权限列表
    async loadPermissions() {
      try {
        // 检查用户是否有管理员角色
        const userRoles = this.currentUserPermissions.roles || []
        const isAdmin = userRoles.includes('超级管理员') || userRoles.includes('管理员')
        
        if (isAdmin) {
          const response = await api.get('/permissions')
          this.permissions = response.data
          debug('权限列表加载成功:', this.permissions)
        } else {
          debug('用户不是管理员，跳过加载权限列表')
          this.permissions = []
        }
      } catch (error) {
        console.error('加载权限列表失败:', error)
        this.permissions = []
      }
    },
    
    // 检查是否有权限 - 可以用于前端组件中的动态检查
    async checkPermission(module, level, departmentId = null) {
      // 构建缓存键
      const cacheKey = `${module}:${level}:${departmentId || 'all'}`
      
      // 如果缓存中有结果，直接返回
      if (this.permissionCache[cacheKey] !== undefined) {
        return this.permissionCache[cacheKey]
      }
      
      try {
        // 调用后端API检查权限
        const response = await api.post('/check-permission', {
          module,
          level,
          department_id: departmentId
        })
        
        const result = response.data.has_permission
        
        // 缓存结果
        this.permissionCache[cacheKey] = result
        
        return result
      } catch (error) {
        console.error('检查权限失败:', error)
        return false
      }
    },
    
    // 批量检查多个权限（用于复杂组件的权限控制）
    async checkMultiplePermissions(permissionList) {
      const results = {}
      
      for (const perm of permissionList) {
        const { module, level, departmentId = null } = perm
        const key = `${module}:${level}`
        results[key] = await this.checkPermission(module, level, departmentId)
      }
      
      return results
    },
    
    // 获取所有可用的权限模块
    getAvailableModules() {
      return Object.values(Module)
    },
    
    // 获取所有可用的权限等级
    getAvailableLevels() {
      return Object.values(PermissionLevel)
    },
    
    // 重置权限状态
    reset() {
      this.permissionCache = {}
      this.roles = []
      this.permissions = []
      this.currentUserPermissions = {
        roles: []
      }
    }
  },
  persist: {
    key: 'permission-store',
    storage: localStorage,
    paths: ['roles', 'permissions', 'currentUserPermissions', 'accessibleRoutes'],
  }
}) 