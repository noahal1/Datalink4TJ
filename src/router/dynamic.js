// dynamic.js - 动态路由处理模块

const DefaultLayout = () => import('../layouts/DefaultLayout.vue')

export const componentMap = {
  'DefaultLayout': DefaultLayout,
  'AdminUser': () => import('../pages/admin/Users.vue'),
  'Dashboard': () => import('../pages/Dashboard.vue'),
  'ComponentTest': () => import('../pages/ComponentTest.vue'),
  'EHS': () => import('../pages/EHS.vue'),
  'Assy': () => import('../pages/Assy.vue'),
  'Quality': () => import('../pages/Quality.vue'),
  'QualityKpi': () => import('../pages/QualityKpi.vue'),
  'EhsKpi': () => import('../pages/EhsKpi.vue'),
  'MaintenanceKpi': () => import('../pages/MaintenanceKpi.vue'),
  'ProductionKpi': () => import('../pages/ProductionKpi.vue'),
  'GmoKpi': () => import('../pages/GmoKpi.vue'),
  'EngKpi': () => import('../pages/EngKpi.vue'),
  'PrsKpi': () => import('../pages/PrsKpi.vue'),
  'HrKpi': () => import('../pages/HrKpi.vue'),
  'LogisticsKpi': () => import('../pages/LogisticsKpi.vue'),
  'DohDaily': () => import('../pages/DohDaily.vue'),
  'DohMaster':() => import('../pages/DohMasterData.vue'),
  'Pcl': () => import('../pages/Pcl.vue'),
  'Admin': () => import('../pages/Admin.vue'),
  'Gmo': () => import('../pages/Gmo.vue'),
  'Maintenance': () => import('../pages/Maintenance.vue'),
  'MaintenanceMetrics': () => import('../pages/MaintenanceMetrics.vue'),
  'PrManagement': () => import('../pages/PrManagement.vue'),
  'DowntimeRecords': () => import('../pages/DowntimeRecords.vue'),
  'Events': () => import('../pages/Events.vue'),
  'RouteManagement': () => import('../pages/RouteManagement.vue'),
  'PermissionManagement': () => import('../pages/PermissionManagement.vue'),
  'SimplePermissionManagement': () => import('../pages/PermissionManagement.vue'),
  'AdminDepartments': () => import('../pages/admin/Departments.vue'),
  'AdminActivities': () => import('../pages/admin/Activities.vue'),
  'AdminUser': () => import('../pages/admin/Users.vue'),
  'Login': () => import('../pages/Login.vue'),
  'RouteDebug': () => import('../pages/RouteDebug.vue'),
  'ReactiveTestPage': () => import('../pages/ReactiveTestPage.vue'),
  'Profile': () => import('../pages/Profile.vue'),
  'Settings': () => import('../pages/Settings.vue'),
}

/**
 * 生成组件映射表的代码字符串（用于开发调试）
 * @param {Array<string>} componentNames 组件名称列表
 * @returns {string} 组件映射表代码
 */
export function generateComponentMapCode(componentNames) {
  if (!componentNames || !Array.isArray(componentNames)) {
    return ''
  }

  const lines = ['export const componentMap = {']
  lines.push("  'DefaultLayout': DefaultLayout,")

  componentNames.forEach(name => {
    if (name !== 'DefaultLayout') {
      // 根据组件名称推断可能的文件路径
      let importPath = `../pages/${name}.vue`
      if (name.startsWith('Admin')) {
        importPath = `../pages/admin/${name.replace('Admin', '')}.vue`
      }
      lines.push(`  '${name}': () => import('${importPath}'),`)
    }
  })

  lines.push('}')
  return lines.join('\n')
}

/**
 * 获取所有可用的组件名称列表
 * @returns {Array<string>} 组件名称数组
 */
export function getAvailableComponents() {
  return Object.keys(componentMap)
}

/**
 * 检查组件映射表与API返回组件的一致性
 * @param {Array} apiComponents API返回的组件列表
 * @returns {Object} 检查结果
 */
export function validateComponentMapping(apiComponents) {
  const availableComponents = getAvailableComponents()
  const missingInMap = []
  const missingInApi = []

  // 检查API返回的组件是否都在映射表中
  if (apiComponents && Array.isArray(apiComponents)) {
    apiComponents.forEach(component => {
      if (typeof component === 'string' && !availableComponents.includes(component)) {
        missingInMap.push(component)
      }
    })
  }

  // 检查映射表中的组件是否都被API使用
  availableComponents.forEach(component => {
    if (component !== 'DefaultLayout' && (!apiComponents || !apiComponents.includes(component))) {
      missingInApi.push(component)
    }
  })

  return {
    totalMapped: availableComponents.length,
    totalFromApi: apiComponents ? apiComponents.length : 0,
    missingInMap,
    missingInApi,
    isConsistent: missingInMap.length === 0 && missingInApi.length === 0
  }
}

/**
 * 处理从后端获取的路由配置
 * @param {Object} route 路由配置对象
 * @returns {Object|null} 处理后的路由对象，无效则返回null
 */
export function processRoute(route) {
  if (!route || !route.path) {
    console.warn('跳过无效路由:', route)
    return null
  }

  // 如果没有name字段，使用路径创建一个唯一name
  if (!route.name) {
    route.name = route.path.replace(/\//g, '_').replace(/:/g, '_param_')
    if (route.name.startsWith('_')) {
      route.name = route.name.substring(1)
    }
  }

  // 处理路由组件
  if (route.component) {
    console.log(`🔍 处理路由组件: ${route.path} -> ${route.component} (类型: ${typeof route.component})`)

    // 检查是否是字符串并在映射中存在
    if (typeof route.component === 'string' && componentMap[route.component]) {
      console.log(`✅ 找到组件映射: ${route.component} -> ${route.path}`)
      route.component = componentMap[route.component]
    } else if (typeof route.component === 'string') {
      console.warn(`❌ 组件 "${route.component}" 未在组件映射表中找到，使用默认布局`)
      console.warn('🔍 可用组件列表:', getAvailableComponents())
      console.warn(`🛣️ 当前路由路径: ${route.path}`)
      route.component = componentMap['DefaultLayout']
    }
  } else {
    console.warn(`⚠️ 路由 ${route.path} 没有组件配置`)
  }

  // 处理子路由
  if (route.children && Array.isArray(route.children)) {
    route.children = route.children
      .map(child => processRoute(child))
      .filter(child => child !== null)
  }

  return route
}

/**
 * 获取并处理动态路由
 * @param {Function} routeService 路由服务
 * @returns {Promise<Array>} 处理后的路由数组
 */
export async function fetchDynamicRoutes(routeService) {
  try {
    console.log('开始获取动态路由...')
    // 获取动态路由配置
    const navigationRoutes = await routeService.getNavigationTree()

    if (!navigationRoutes || !Array.isArray(navigationRoutes)) {
      console.warn('获取动态路由失败或格式不正确')
      return []
    }

    console.log('获取到后端动态路由：', navigationRoutes.length, '个')

    // 提取所有组件名称进行一致性检查
    const extractComponents = (routes) => {
      const components = []
      routes.forEach(route => {
        if (route.component && typeof route.component === 'string') {
          components.push(route.component)
        }
        if (route.children && Array.isArray(route.children)) {
          components.push(...extractComponents(route.children))
        }
      })
      return [...new Set(components)] // 去重
    }

    const apiComponents = extractComponents(navigationRoutes)
    console.log('API返回的组件列表：', apiComponents)

    // 执行组件映射一致性检查
    const validationResult = validateComponentMapping(apiComponents)
    console.log('组件映射一致性检查结果：', validationResult)

    if (!validationResult.isConsistent) {
      console.warn('⚠️ 组件映射不一致检测到问题：')
      console.warn(`- 硬编码组件数量: ${validationResult.totalMapped}`)
      console.warn(`- API返回组件数量: ${validationResult.totalFromApi}`)

      if (validationResult.missingInMap.length > 0) {
        console.warn('- 以下组件在API中存在但映射表中缺失：', validationResult.missingInMap)
      }

      if (validationResult.missingInApi.length > 0) {
        console.warn('- 以下组件在映射表中存在但API中未使用：', validationResult.missingInApi)
      }

      console.warn('建议：请检查组件映射表与后端API返回的组件是否一致')
    } else {
      console.log('组件映射一致性检查通过')
    }

    // 处理每个路由
    const processedRoutes = navigationRoutes
      .map(route => processRoute(route))
      .filter(route => route !== null)

    console.log('处理完成的路由数量：', processedRoutes.length)
    return processedRoutes
  } catch (error) {
    console.error('获取动态路由失败:', error)
    return []
  }
}