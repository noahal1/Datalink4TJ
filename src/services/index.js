/**
 * 服务模块索引文件
 * 统一导出所有服务，方便全局引用
 */

import userService from './userService'
import permissionService from './permissionService'
import activityService from './activityService'
import departmentService from './departmentService'
import routeService from './routeService'

export {
  userService,
  permissionService,
  activityService,
  departmentService,
  routeService
}

/**
 * 统一服务对象
 * 可通过此对象直接访问所有服务
 * 例如: services.user.getCurrentUser()
 */
const services = {
  user: userService,
  permission: permissionService,
  activity: activityService,
  department: departmentService,
  route: routeService
}

export default services 