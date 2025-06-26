/**
 * 服务模块索引文件
 * 统一导出所有服务，方便全局引用
 */

// 导入旧的服务（为兼容性保留）
import userService from './userService'
import permissionService from './permissionService'
import activityService from './activityService'
import departmentService from './departmentService'
import routeService from './routeService'
import downtimeService from './downtimeService'
import authService from './authService'
import maintenanceService from './maintenanceService'

// 导入新的模块化服务
import * as modulesServices from './modules'

// 导出旧服务
export {
  userService,
  permissionService,
  activityService,
  departmentService,
  routeService,
  downtimeService,
  authService,
  maintenanceService
}

// 导出新的模块化服务
export const modularServices = modulesServices

/**
 * 统一服务对象
 * 可通过此对象直接访问所有服务
 * 例如: services.user.getCurrentUser()
 */
const services = {
  // 旧服务
  user: userService,
  permission: permissionService,
  activity: activityService,
  department: departmentService,
  route: routeService,
  downtime: downtimeService,
  auth: authService,
  maintenance: maintenanceService,
  
  // 新服务 (v2前缀)
  v2: modulesServices.default
}

export default services 