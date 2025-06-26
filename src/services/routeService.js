import api from '../utils/api'
import { usePermissionStore } from '../stores/permission'
import { useUserStore } from '../stores/user'

// 路由管理服务
class RouteService {
  // 缓存的路由数据
  #routes = []
  #isLoaded = false
  #loadPromise = null

  // 获取所有路由
  async getRoutes() {
    // 如果已经加载过，直接返回缓存
    if (this.#isLoaded && this.#routes.length > 0) {
      return this.#routes
    }

    // 如果正在加载中，等待加载完成
    if (this.#loadPromise) {
      return this.#loadPromise
    }

    // 开始加载
    this.#loadPromise = this.#loadRoutes()
    return this.#loadPromise
  }

  // 内部加载路由方法
  async #loadRoutes() {
    try {
      // 修改API路径，使用正确的后端端点
      const response = await api.get('/routes')
      if (response && response.data) {
        this.#routes = this.#processRoutes(response.data)
        this.#isLoaded = true
        return this.#routes
      }
      return []
    } catch (error) {
      console.error('加载路由失败:', error)
      return []
    } finally {
      this.#loadPromise = null
    }
  }

  // 处理路由数据，转换为前端所需格式
  #processRoutes(routes) {
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
      
      // 确保路径格式正确
      if (route.path && !route.path.startsWith('/') && route.path !== '*') {
        route.path = '/' + route.path
      }

      return route
    })
  }

  // 重新加载路由（强制刷新）
  async reloadRoutes() {
    this.#isLoaded = false
    this.#loadPromise = null
    return this.getRoutes()
  }

  // 获取导航菜单树
  async getNavigationTree() {
    try {
      console.log('正在获取导航菜单树...')
      // 优先使用专用的导航API端点
      const response = await api.get('/navigation')
      console.log('导航API响应:', response)
      
      if (response && response.data) {
        // 确保返回的是数组
        let routes = Array.isArray(response.data) ? response.data : [];
        
        // 如果返回的是空数组，尝试使用其他接口
        if (routes.length === 0) {
          console.log('导航API返回空数组，尝试其他接口...');
          return await this.#fallbackNavigationTree();
        }
        
        // 对路由进行处理
        routes = this.#processRoutes(routes);
        console.log('处理后的导航菜单树:', routes);
        return routes;
      } else {
        console.log('导航API返回无效数据，尝试其他接口...');
        return await this.#fallbackNavigationTree();
      }
    } catch (error) {
      console.error('获取导航菜单失败:', error)
      // 尝试降级策略
      return await this.#fallbackNavigationTree();
    }
  }
  
  // 降级策略 - 当主导航API失败时尝试其他接口
  async #fallbackNavigationTree() {
    try {
      // 尝试获取权限路由列表
      console.log('尝试获取权限路由列表...')
      const permResponse = await api.get('/permissions/routes')
      console.log('权限路由API响应:', permResponse)
      
      if (permResponse && permResponse.data && Array.isArray(permResponse.data)) {
        const routes = this.#processRoutes(permResponse.data)
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
    const processedRoutes = this.#processRoutes(sortRoutes(rootRoutes))
    console.log('构建完成的导航菜单树:', processedRoutes)
    return processedRoutes
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
      if (permissionStore.isSuperUser) {
        hasPermission = true
      }
      // 公共路由，所有人可访问
      else if (!route.meta || !route.meta.permission || route.meta.permission === '*') {
        hasPermission = true
      }
      // 检查allowed_roles字段
      else if (route.meta && route.meta.allowed_roles && Array.isArray(route.meta.allowed_roles)) {
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
      }
      // 检查权限对象
      else if (typeof route.meta.permission === 'object') {
        const { module, level, departmentId } = route.meta.permission
        hasPermission = permissionStore.hasPermission(module, level, departmentId)
      }
      // 检查权限字符串 (MODULE:LEVEL)
      else if (typeof route.meta.permission === 'string' && route.meta.permission.includes(':')) {
        hasPermission = permissionStore.hasPermissionByString(route.meta.permission)
      }
      // 兼容旧格式部门权限
      else if (typeof route.meta.permission === 'string') {
        hasPermission = userStore.department === route.meta.permission
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
      // 强制重新加载导航树，确保获取最新数据
      this.#isLoaded = false
      const routeTree = await this.getNavigationTree()
      // 过滤隐藏的路由
      const visibleRoutes = routeTree.filter(route => !route.meta?.hideInMenu)
      const permissionFilteredRoutes = this.filterRoutesByPermission(visibleRoutes)
      return permissionFilteredRoutes
    } catch (error) {
      console.error('获取导航菜单失败:', error)
      return []
    }
  }
}

export default new RouteService() 