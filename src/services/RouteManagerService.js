/**
 * 路由管理服务
 */

import { reactive, computed } from 'vue'
import api from '../utils/api'

/**
 * 路由类型枚举
 */
export const RouteType = {
  PAGE: 'page',
  PARENT_MENU: 'parent_menu'
}

/**
 * 操作类型枚举
 */
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MOVE: 'move',
  PERMISSION: 'permission',
  BATCH_DELETE: 'batch_delete'
}

/**
 * 事件类型枚举
 */
export const EventType = {
  ROUTE_CREATED: 'route:created',
  ROUTE_UPDATED: 'route:updated',
  ROUTE_DELETED: 'route:deleted',
  ROUTES_LOADED: 'routes:loaded',
  PERMISSION_CHANGED: 'permission:changed',
  VALIDATION_ERROR: 'validation:error',
  LOADING_START: 'loading:start',
  LOADING_END: 'loading:end'
}

/**
 * 默认路由配置
 */
export const DEFAULT_ROUTE_CONFIG = {
  name: '',
  path: '',
  component: '',
  parentId: null,
  sortOrder: 0,
  meta: {
    title: '',
    icon: 'mdi-file',
    requiresAuth: true,
    hideInMenu: false,
    permission: null,
    permissionCode: null,
    public: false,
    isParentMenu: false
  },
  type: RouteType.PAGE
}

class RouteManagerService {
  constructor() {
    // 响应式状态
    this.state = reactive({
      routes: [],
      components: [],
      roles: [],
      loading: false,
      error: null,
      editingRoute: null,
      filter: {
        search: '',
        type: 'all',
        permission: 'all',
        showHidden: false
      },
      history: [],
      historyIndex: -1
    })

    // 计算属性
    this.computed = {
      // 过滤后的路由
      filteredRoutes: computed(() => this._filterRoutes()),
      // 路由树结构
      routeTree: computed(() => this._buildRouteTree()),
      // 是否可以撤销
      canUndo: computed(() => this.state.historyIndex >= 0),
      // 是否可以重做
      canRedo: computed(() => this.state.historyIndex < this.state.history.length - 1)
    }

    // 事件监听器
    this.listeners = new Map()
  }

  /**
   * 加载路由列表
   */
  async loadRoutes() {
    try {
      this._setLoading(true)
      const response = await api.get('/routes')
      this.state.routes = (response.data || []).map(route => this._processRoute(route))
      this._emit(EventType.ROUTES_LOADED, this.state.routes)
      return this.state.routes
    } catch (error) {
      this._setError('加载路由失败: ' + error.message)
      throw error
    } finally {
      this._setLoading(false)
    }
  }

  /**
   * 创建路由
   */
  async createRoute(routeData) {
    try {
      this._setLoading(true)
      const processedRoute = this._prepareRouteForSave(routeData)
      const response = await api.post('/routes', processedRoute)
      const newRoute = this._processRoute(response.data)
      
      this.state.routes.push(newRoute)
      
      // 记录操作历史
      this._addToHistory({
        type: OperationType.CREATE,
        route: newRoute,
        description: `创建路由: ${newRoute.name}`
      })
      
      this._emit(EventType.ROUTE_CREATED, newRoute)
      return newRoute
    } catch (error) {
      this._setError('创建路由失败: ' + error.message)
      throw error
    } finally {
      this._setLoading(false)
    }
  }

  /**
   * 更新路由
   */
  async updateRoute(routeId, routeData) {
    try {
      this._setLoading(true)
      const processedRoute = this._prepareRouteForSave(routeData)
      const response = await api.put(`/routes/${routeId}`, processedRoute)
      const updatedRoute = this._processRoute(response.data)
      
      const index = this.state.routes.findIndex(r => r.id === routeId)
      if (index !== -1) {
        const oldRoute = { ...this.state.routes[index] }
        this.state.routes[index] = updatedRoute
        
        // 记录操作历史
        this._addToHistory({
          type: OperationType.UPDATE,
          route: updatedRoute,
          oldValue: oldRoute,
          newValue: updatedRoute,
          description: `更新路由: ${updatedRoute.name}`
        })
      }
      
      this._emit(EventType.ROUTE_UPDATED, updatedRoute)
      return updatedRoute
    } catch (error) {
      this._setError('更新路由失败: ' + error.message)
      throw error
    } finally {
      this._setLoading(false)
    }
  }

  /**
   * 删除路由
   */
  async deleteRoute(routeId) {
    try {
      this._setLoading(true)
      const route = this.state.routes.find(r => r.id === routeId)
      if (!route) {
        throw new Error('路由不存在')
      }
      
      await api.delete(`/routes/${routeId}`)
      this.state.routes = this.state.routes.filter(r => r.id !== routeId)
      
      // 记录操作历史
      this._addToHistory({
        type: OperationType.DELETE,
        route: route,
        description: `删除路由: ${route.name}`
      })
      
      this._emit(EventType.ROUTE_DELETED, route)
      return route
    } catch (error) {
      this._setError('删除路由失败: ' + error.message)
      throw error
    } finally {
      this._setLoading(false)
    }
  }

  /**
   * 批量删除路由
   */
  async batchDeleteRoutes(routeIds) {
    try {
      this._setLoading(true)
      const deletedRoutes = []
      
      for (const routeId of routeIds) {
        const route = this.state.routes.find(r => r.id === routeId)
        if (route) {
          await api.delete(`/routes/${routeId}`)
          deletedRoutes.push(route)
        }
      }
      
      this.state.routes = this.state.routes.filter(r => !routeIds.includes(r.id))
      
      // 记录操作历史
      this._addToHistory({
        type: OperationType.BATCH_DELETE,
        routes: deletedRoutes,
        description: `批量删除 ${deletedRoutes.length} 个路由`
      })
      
      return deletedRoutes
    } catch (error) {
      this._setError('批量删除失败: ' + error.message)
      throw error
    } finally {
      this._setLoading(false)
    }
  }

  /**
   * 加载组件列表
   */
  async loadComponents() {
    try {
      // 添加时间戳参数防止缓存
      const timestamp = Date.now()
      const response = await api.get(`/routes/components?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      console.log("RouteManagerService 组件列表API响应:", response)

      if (response && response.data && response.data.components) {
        this.state.components = response.data.components
        console.log(`RouteManagerService 成功获取组件列表: ${this.state.components.length} 个组件`)
      } else if (response && response.data && Array.isArray(response.data)) {
        // 如果直接返回数组
        this.state.components = response.data
        console.log(`RouteManagerService 成功获取组件列表: ${this.state.components.length} 个组件`)
      } else {
        console.warn("RouteManagerService API响应格式不符合预期:", response)
        // 使用默认组件列表
        this.state.components = [
          'DefaultLayout', 'Dashboard', 'EHS', 'Assy', 'Quality', 'Pcl', 'Admin', 'Gmo',
          'Maintenance', 'MaintenanceMetrics', 'DowntimeRecords', 'Events',
          'Qa_others', 'RouteManagement', 'PermissionManagement', 'PermissionTest',
          'AdminDepartments', 'AdminActivities', 'AdminUsers', 'Login'
        ]
        console.log('RouteManagerService 使用默认组件列表')
      }

      return this.state.components
    } catch (error) {
      console.error('RouteManagerService 加载组件失败:', error)
      // 使用默认组件列表作为后备
      this.state.components = [
        'DefaultLayout', 'Dashboard', 'EHS', 'Assy', 'Quality', 'Pcl', 'Admin', 'Gmo',
        'Maintenance', 'MaintenanceMetrics', 'DowntimeRecords', 'Events',
        'Qa_others', 'RouteManagement', 'PermissionManagement', 'PermissionTest',
        'AdminDepartments', 'AdminActivities', 'AdminUsers', 'Login'
      ]
      console.log('RouteManagerService 使用默认组件列表作为后备方案')
      return this.state.components
    }
  }

  /**
   * 加载角色列表
   */
  async loadRoles() {
    try {
      const response = await api.get('/roles')
      this.state.roles = response.data || []
      return this.state.roles
    } catch (error) {
      console.error('加载角色失败:', error)
      this.state.roles = []
      throw error
    }
  }

  /**
   * 设置过滤器
   */
  setFilter(filterKey, value) {
    this.state.filter[filterKey] = value
  }

  /**
   * 撤销操作
   */
  undo() {
    if (this.computed.canUndo.value) {
      const operation = this.state.history[this.state.historyIndex]
      this._executeUndo(operation)
      this.state.historyIndex--
    }
  }

  /**
   * 重做操作
   */
  redo() {
    if (this.computed.canRedo.value) {
      this.state.historyIndex++
      const operation = this.state.history[this.state.historyIndex]
      this._executeRedo(operation)
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 过滤路由
   */
  _filterRoutes() {
    let filtered = [...this.state.routes]
    const filter = this.state.filter

    // 搜索过滤
    if (filter.search) {
      const search = filter.search.toLowerCase()
      filtered = filtered.filter(route =>
        route.path?.toLowerCase().includes(search) ||
        route.name?.toLowerCase().includes(search) ||
        route.meta?.title?.toLowerCase().includes(search)
      )
    }

    // 类型过滤
    if (filter.type !== 'all') {
      filtered = filtered.filter(route => {
        if (filter.type === 'parent_menu') {
          return route.meta?.isParentMenu === true
        } else if (filter.type === 'page') {
          return route.meta?.isParentMenu !== true
        }
        return true
      })
    }

    // 隐藏路由过滤
    if (!filter.showHidden) {
      filtered = filtered.filter(route => !route.meta?.hideInMenu)
    }

    return filtered
  }

  /**
   * 构建路由树
   */
  _buildRouteTree() {
    const routes = [...this.state.routes]
    const routeMap = new Map()
    const rootRoutes = []

    // 创建路由映射
    routes.forEach(route => {
      routeMap.set(route.id, { ...route, children: [] })
    })

    // 构建树结构
    routes.forEach(route => {
      const routeNode = routeMap.get(route.id)
      if (route.parentId && routeMap.has(route.parentId)) {
        routeMap.get(route.parentId).children.push(routeNode)
      } else {
        rootRoutes.push(routeNode)
      }
    })

    // 排序
    const sortRoutes = (routeList) => {
      routeList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      routeList.forEach(route => {
        if (route.children.length > 0) {
          sortRoutes(route.children)
        }
      })
    }

    sortRoutes(rootRoutes)
    return rootRoutes
  }

  /**
   * 处理路由数据
   */
  _processRoute(route) {
    // 确保meta是对象
    if (typeof route.meta === 'string') {
      try {
        route.meta = JSON.parse(route.meta)
      } catch (e) {
        route.meta = { title: route.name || '未命名' }
      }
    } else if (!route.meta) {
      route.meta = { title: route.name || '未命名' }
    }

    // 设置默认值
    route.meta = {
      title: route.name || '未命名',
      icon: 'mdi-link',
      requiresAuth: true,
      hideInMenu: false,
      ...route.meta
    }

    return route
  }

  /**
   * 准备保存的路由数据
   */
  _prepareRouteForSave(route) {
    const prepared = { ...route }
    
    // 处理父级菜单
    if (route.type === RouteType.PARENT_MENU) {
      prepared.component = ''
      prepared.meta.isParentMenu = true
    }

    return prepared
  }

  /**
   * 添加到历史记录
   */
  _addToHistory(operation) {
    // 移除当前索引之后的历史记录
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1)
    
    // 添加新操作
    this.state.history.push({
      ...operation,
      timestamp: Date.now()
    })
    
    // 限制历史记录数量
    if (this.state.history.length > 50) {
      this.state.history.shift()
    } else {
      this.state.historyIndex++
    }
  }

  /**
   * 执行撤销
   */
  _executeUndo(operation) {
    // 根据操作类型执行相应的撤销逻辑
    switch (operation.type) {
      case OperationType.CREATE:
        this.state.routes = this.state.routes.filter(r => r.id !== operation.route.id)
        break
      case OperationType.UPDATE:
        const index = this.state.routes.findIndex(r => r.id === operation.route.id)
        if (index !== -1 && operation.oldValue) {
          this.state.routes[index] = operation.oldValue
        }
        break
      case OperationType.DELETE:
        this.state.routes.push(operation.route)
        break
    }
  }

  /**
   * 执行重做
   */
  _executeRedo(operation) {
    // 根据操作类型执行相应的重做逻辑
    switch (operation.type) {
      case OperationType.CREATE:
        this.state.routes.push(operation.route)
        break
      case OperationType.UPDATE:
        const index = this.state.routes.findIndex(r => r.id === operation.route.id)
        if (index !== -1 && operation.newValue) {
          this.state.routes[index] = operation.newValue
        }
        break
      case OperationType.DELETE:
        this.state.routes = this.state.routes.filter(r => r.id !== operation.route.id)
        break
    }
  }

  /**
   * 设置加载状态
   */
  _setLoading(loading) {
    this.state.loading = loading
    this._emit(loading ? EventType.LOADING_START : EventType.LOADING_END)
  }

  /**
   * 设置错误信息
   */
  _setError(error) {
    this.state.error = error
    this._emit(EventType.VALIDATION_ERROR, { error })
  }

  /**
   * 发送事件
   */
  _emit(eventType, data = null) {
    const listeners = this.listeners.get(eventType) || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`事件监听器执行失败 [${eventType}]:`, error)
      }
    })
  }

  /**
   * 添加事件监听器
   */
  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(listener)
  }

  /**
   * 移除事件监听器
   */
  off(eventType, listener) {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }
}

// 创建单例实例
export default new RouteManagerService()
