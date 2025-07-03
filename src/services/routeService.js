import api from '../utils/api'
import { usePermissionStore } from '../stores/permission'
import { useUserStore } from '../stores/user'

// 路由管理服务
class RouteService {
  constructor() {
    // 缓存的路由数据
    this._routes = []
    this._isLoaded = false
    this._loadPromise = null
    this._routeCache = new Map()
  }

  // 获取所有路由
  async getRoutes() {
    // 如果已经加载过，直接返回缓存
    if (this._isLoaded && this._routes.length > 0) {
      return this._routes
    }

    // 如果正在加载中，等待加载完成
    if (this._loadPromise) {
      return this._loadPromise
    }

    // 开始加载
    this._loadPromise = this._loadRoutes()
    return this._loadPromise
  }

  // 内部加载路由方法
  async _loadRoutes() {
    try {
      // 修改API路径，使用正确的后端端点
      const response = await api.get('/routes')
      if (response && response.data) {
        this._routes = this._processRoutes(response.data)
        this._isLoaded = true
        return this._routes
      }
      return []
    } catch (error) {
      console.error('加载路由失败:', error)
      return []
    } finally {
      this._loadPromise = null
    }
  }

  // 处理路由数据，转换为前端所需格式
  _processRoutes(routes) {
    // 处理meta字段，确保格式一致
    return routes.map(route => {
      // 确保meta是对象格式
      if (typeof route.meta === 'string') {
        try {
          route.meta = JSON.parse(route.meta)
        } catch (e) {
          route.meta = { title: route.name || '未命名' }
        }
      } else if (!route.meta) {
        route.meta = { title: route.name || '未命名' }
      }

      // 确保必要的字段存在
      if (!route.meta.title) {
        route.meta.title = route.name || '未命名'
      }
      if (!route.meta.icon) {
        route.meta.icon = 'mdi-link'
      }

      // 注意：组件映射在 dynamic.js 的 processRoute 函数中处理

      // 确保路径格式正确
      if (route.path && !route.path.startsWith('/') && route.path !== '*') {
        route.path = '/' + route.path
      }

      return route
    })
  }

  // 重新加载路由（强制刷新）
  async reloadRoutes() {
    this._isLoaded = false
    this._loadPromise = null
    return this.getRoutes()
  }

  // 获取导航菜单树
  async getNavigationTree() {
    try {
      console.log('RouteService: 获取导航菜单树...')

      // 尝试多个API端点 - 修正API路径
      const apiEndpoints = [
        '/user-routes',              // 权限路由接口
        '/navigation',               // 导航接口
        '/routes'                    // 基础路由接口
      ]

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`RouteService: 尝试API端点: ${endpoint}`)
          const response = await api.get(endpoint)
          console.log(`RouteService: ${endpoint} 响应:`, response)

          if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            let routes = response.data

            // 对路由进行处理
            routes = this._processRoutes(routes);
            console.log('RouteService: 处理后的导航菜单树:', routes);
            return routes;
          }
        } catch (endpointError) {
          console.warn(`RouteService: ${endpoint} 失败:`, endpointError.message)
          continue
        }
      }

      // 所有API都失败，使用降级策略
      console.log('RouteService: 所有API端点都失败，使用降级策略')
      return await this._fallbackNavigationTree();

    } catch (error) {
      console.error('RouteService: 获取导航菜单失败:', error)
      // 尝试降级策略
      return await this._fallbackNavigationTree();
    }
  }
  
  // 降级策略 - 当主导航API失败时尝试其他接口
  async _fallbackNavigationTree() {
    try {
      // 尝试获取权限路由列表
      console.log('尝试获取权限路由列表...')
      const permResponse = await api.get('/permissions/routes')
      console.log('权限路由API响应:', permResponse)
      
      if (permResponse && permResponse.data && Array.isArray(permResponse.data)) {
        const routes = this._processRoutes(permResponse.data)
        console.log('处理后的权限路由:', routes)
        return routes
      }
    } catch (permError) {
      console.error('获取权限路由列表失败:', permError)
    }
    
    // 最终降级方案：使用路由列表构建
    console.log('使用路由列表构建导航菜单树...')
    const routes = await this.getRoutes()
    
    // 创建一个映射来存储路由和它们的子路由
    const routeMap = {}
    const rootRoutes = []

    // 第一遍循环初始化所有路由对象
    console.log('构建路由映射...')
    routes.forEach(route => {
      // 确保路由有唯一ID
      if (!route.id) {
        console.warn('路由缺少ID:', route)
        return
      }
      
      // 复制路由对象并添加children数组
      const routeObj = { ...route, children: [] }
      routeMap[route.id] = routeObj
      
      // 如果没有父路由，则为根路由
      if (!route.parent_id) {
        rootRoutes.push(routeObj)
      }
    })

    // 第二遍循环建立父子关系
    console.log('建立父子关系...')
    routes.forEach(route => {
      // 如果有父路由，将此路由添加到父路由的children中
      if (route.parent_id && routeMap[route.parent_id]) {
        routeMap[route.parent_id].children.push(routeMap[route.id])
      }
    })

    // 对每个层级的路由按sort_order排序
    const sortRoutes = (routeList) => {
      // 排序当前层级
      routeList.sort((a, b) => {
        const sortA = a.sort_order || 0
        const sortB = b.sort_order || 0
        return sortA - sortB
      })
      
      // 递归排序子路由
      routeList.forEach(route => {
        if (route.children && route.children.length > 0) {
          sortRoutes(route.children)
        }
      })
      
      return routeList
    }

    // 返回排序后的路由树
    const processedRoutes = this._processRoutes(sortRoutes(rootRoutes))
    console.log('构建完成的导航菜单树:', processedRoutes)
    return processedRoutes
  }

  // 获取默认路由（当所有API都失败时使用）
  getDefaultRoutes() {
    console.log('RouteService: 使用默认路由')

    const defaultRoutes = [
      {
        id: 'dashboard',
        path: '/dashboard',
        name: 'Dashboard',
        meta: {
          title: '仪表板',
          icon: 'mdi-view-dashboard',
          requiresAuth: true
        },
        children: []
      }
    ]

    return defaultRoutes
  }

  // 根据权限过滤路由
  filterRoutesByPermission(routes) {
    if (!routes || !Array.isArray(routes)) return []
    
    // 获取权限存储
    const permissionStore = usePermissionStore()
    const userStore = useUserStore()
    
    // 深拷贝路由，避免修改原始数据
    const cloneRoutes = JSON.parse(JSON.stringify(routes))
    
    // 递归过滤路由
    const filteredRoutes = cloneRoutes.filter(route => {
      // 跳过无效路由
      if (!route) return false

      // 路由权限验证
      let hasPermission = false

      // 如果是超级管理员，拥有所有权限
      if (permissionStore.isSuperUser || userStore.roles.includes('超级管理员') || userStore.roles.includes('管理员')) {
        hasPermission = true
        console.log('RouteService: 管理员访问路由:', route.path)
      }
      // 使用新的权限检查方法：检查用户是否可以访问该路由
      else {
        // 首先检查路由是否在用户的可访问路由列表中
        const accessibleRoutes = permissionStore.accessibleRoutesList
        if (accessibleRoutes && accessibleRoutes.length > 0) {
          hasPermission = accessibleRoutes.some(r => r.path === route.path)
          console.log('RouteService: 路由列表权限检查:', route.path, hasPermission)
        } else {
          // 如果没有路由列表，使用传统的权限检查
          hasPermission = permissionStore.canAccessRoute(route.path)
          console.log('RouteService: 传统权限检查:', route.path, hasPermission)
        }

        // 如果新方法没有权限，尝试旧的权限检查方式（向后兼容）
        if (!hasPermission) {
          // 公共路由，所有人可访问
          if (!route.meta || !route.meta.permission_code || route.meta.permission_code === '*') {
            hasPermission = true
            console.log('RouteService: 公共路由:', route.path)
          }
          // 检查新的权限代码系统
          else if (route.meta.permission_code) {
            hasPermission = permissionStore.hasPermission(route.meta.permission_code)
            console.log('RouteService: 权限代码检查:', route.path, route.meta.permission_code, hasPermission)
          }
          // 兼容旧的permission字段
          else if (route.meta.permission) {
            // 检查allowed_roles字段
            if (route.meta.allowed_roles && Array.isArray(route.meta.allowed_roles)) {
              const userRoleIds = userStore.roles.map(role => {
                // 如果是角色名称，尝试在permissionStore中查找对应的ID
                const roleObj = permissionStore.roles.find(r => r.name === role)
                return roleObj ? String(roleObj.id) : role
              })

              // 检查用户角色ID是否在allowed_roles中
              const hasAllowedRole = route.meta.allowed_roles.some(roleId =>
                userRoleIds.includes(roleId) || userRoleIds.includes(String(roleId))
              )

              hasPermission = hasAllowedRole
              console.log('RouteService: 角色权限检查:', route.path, hasAllowedRole)
            }
            // 检查权限对象
            else if (typeof route.meta.permission === 'object') {
              const { module, level, departmentId } = route.meta.permission
              hasPermission = permissionStore.hasPermission(module, level, departmentId)
              console.log('RouteService: 对象权限检查:', route.path, hasPermission)
            }
            // 检查权限字符串 (MODULE:LEVEL)
            else if (typeof route.meta.permission === 'string' && route.meta.permission.includes(':')) {
              hasPermission = permissionStore.hasPermissionByString && permissionStore.hasPermissionByString(route.meta.permission)
              console.log('RouteService: 字符串权限检查:', route.path, hasPermission)
            }
          }
        }
      }
      
      // 如果有权限并且有子路由，递归过滤子路由
      if (hasPermission && route.children && route.children.length > 0) {
        const filteredChildren = this.filterRoutesByPermission(route.children)
        // 更新子路由列表
        route.children = filteredChildren
        // 如果过滤后没有子路由但需要子路由，则隐藏此路由
        if (filteredChildren.length === 0 && route.meta && route.meta.requiresChildren) {
          return false
        }
      }
      
      return hasPermission
    })
    
    return filteredRoutes
  }

  // 获取导航菜单
  async getNavigationMenu() {
    try {
      console.log('RouteService: 获取导航菜单...')

      // 强制重新加载导航树，确保获取最新数据
      this._isLoaded = false
      const routeTree = await this.getNavigationTree()

      console.log('RouteService: 原始路由树:', routeTree.length, '个路由')

      // 过滤隐藏的路由
      const visibleRoutes = routeTree.filter(route => {
        const isVisible = !route.meta?.hideInMenu
        if (!isVisible) {
          console.log('RouteService: 隐藏路由:', route.path)
        }
        return isVisible
      })

      console.log('RouteService: 可见路由:', visibleRoutes.length, '个')

      // 根据权限过滤路由
      const permissionFilteredRoutes = this.filterRoutesByPermission(visibleRoutes)

      console.log('RouteService: 权限过滤后路由:', permissionFilteredRoutes.length, '个')

      return permissionFilteredRoutes
    } catch (error) {
      console.error('获取导航菜单失败:', error)
      return []
    }
  }

  // 强制重新加载路由（清除缓存）
  async reloadRoutes() {
    console.log('RouteService: 强制重新加载路由...')
    this._isLoaded = false
    this._routeCache.clear()

    try {
      const routes = await this.getNavigationTree()
      console.log('RouteService: 重新加载完成，获得', routes.length, '个路由')
      return routes
    } catch (error) {
      console.error('RouteService: 重新加载路由失败:', error)
      return []
    }
  }
}

export default new RouteService() 