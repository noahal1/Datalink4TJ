// dynamic.js - 动态路由处理模块

// 通用布局组件 - 用于动态路由
const DefaultLayout = () => import('../layouts/DefaultLayout.vue')

// 组件映射表，用于动态路由
export const componentMap = {
  'DefaultLayout': DefaultLayout,
  'Dashboard': () => import('../pages/Dashboard.vue'),
  'EHS': () => import('../pages/EHS.vue'),
  'Assy': () => import('../pages/Assy.vue'),
  'Quality': () => import('../pages/Quality.vue'),
  'Pcl': () => import('../pages/Pcl.vue'),
  'Admin': () => import('../pages/Admin.vue'),
  'Gmo': () => import('../pages/Gmo.vue'),
  'Maintenance': () => import('../pages/Maintenance.vue'),
  'MaintenanceMetrics': () => import('../pages/MaintenanceMetrics.vue'),
  'DowntimeRecords': () => import('../pages/DowntimeRecords.vue'),
  'Events': () => import('../pages/Events.vue'),
  'Qa_others': () => import('../pages/Qa_others.vue'),
  'RouteManagement': () => import('../pages/RouteManagement.vue'),
  'PermissionManagement': () => import('../pages/PermissionManagement.vue'),
  'AdminDepartments': () => import('../pages/admin/Departments.vue'),
  'AdminActivities': () => import('../pages/admin/Activities.vue'),
  'AdminUsers': () => import('../pages/admin/Users.vue')
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
    // 检查是否是字符串并在映射中存在
    if (typeof route.component === 'string' && componentMap[route.component]) {
      route.component = componentMap[route.component]
    } else if (typeof route.component === 'string') {
      console.warn(`组件 "${route.component}" 未找到，使用默认布局`)
      route.component = componentMap['DefaultLayout']
    }
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
    
    // 处理每个路由
    const processedRoutes = navigationRoutes
      .map(route => processRoute(route))
      .filter(route => route !== null)
    
    return processedRoutes
  } catch (error) {
    console.error('获取动态路由失败:', error)
    return []
  }
} 