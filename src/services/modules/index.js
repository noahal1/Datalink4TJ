/**
 * 服务模块索引文件
 * 统一导出所有模块化服务
 */

import authService from './AuthService'
import userService from './UserService'
import departmentService from './DepartmentService'

// 导出服务实例
export {
  authService,
  userService,
  departmentService
}

// 默认导出服务对象
export default {
  auth: authService,
  user: userService,
  department: departmentService
} 