/**
 * 权限常量定义
 * 与后端模型保持一致，用于统一前后端权限系统
 */

// 权限等级枚举
export const PermissionLevel = {
  READ: 'READ',            // 只读权限
  WRITE: 'WRITE',          // 写入权限
  ADMIN: 'ADMIN',          // 管理员权限
  SUPER_ADMIN: 'SUPER_ADMIN' // 超级管理员权限
}

// 模块枚举
export const Module = {
  USER: 'USER',            // 用户管理
  DEPARTMENT: 'DEPARTMENT', // 部门管理
  EHS: 'EHS',              // EHS模块
  QA: 'QA',                // 质量管理
  EVENT: 'EVENT',          // 事件管理
  MAINT: 'MAINT',          // 维护管理
  ACTIVITY: 'ACTIVITY',    // 活动管理
  ROUTE: 'ROUTE',          // 路由管理
  ALL: 'ALL'               // 所有模块
}

// 权限等级值映射（用于比较）
export const PermissionLevelValues = {
  [PermissionLevel.READ]: 1,
  [PermissionLevel.WRITE]: 2,
  [PermissionLevel.ADMIN]: 3,
  [PermissionLevel.SUPER_ADMIN]: 4
}

// 预定义角色
export const PredefinedRoles = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  USER: '普通用户'
}

// 权限帮助函数
export const PermissionHelper = {
  // 格式化权限名称：MODULE:LEVEL
  formatPermission: (module, level) => {
    return `${module}:${level}`
  },
  
  // 解析权限字符串：MODULE:LEVEL -> { module, level }
  parsePermission: (permissionString) => {
    if (!permissionString || permissionString.indexOf(':') === -1) {
      return { module: null, level: null }
    }
    const [module, level] = permissionString.split(':')
    return { module, level }
  },
  
  // 权限等级比较
  isLevelSufficient: (userLevel, requiredLevel) => {
    const userLevelValue = PermissionLevelValues[userLevel] || 0
    const requiredLevelValue = PermissionLevelValues[requiredLevel] || 0
    
    return userLevelValue >= requiredLevelValue
  },
  
  // 检查模块是否有效
  isValidModule: (module) => {
    return Object.values(Module).includes(module)
  },
  
  // 检查权限等级是否有效
  isValidLevel: (level) => {
    return Object.values(PermissionLevel).includes(level)
  },
  
  // 获取权限等级的数值
  getLevelValue: (level) => {
    return PermissionLevelValues[level] || 0
  },
  
  // 获取权限等级的显示名称
  getLevelDisplayName: (level) => {
    return PermissionDescriptions.levels[level] || level
  },
  
  // 获取模块的显示名称
  getModuleDisplayName: (module) => {
    return PermissionDescriptions.modules[module] || module
  }
}

// 权限组合辅助函数
export const PermissionCombinations = {
  // 生成常用权限组合
  // 例如：所有用户模块权限
  allUserPermissions: [
    { module: Module.USER, level: PermissionLevel.READ },
    { module: Module.USER, level: PermissionLevel.WRITE },
    { module: Module.USER, level: PermissionLevel.ADMIN }
  ],
  
  // 部门管理权限
  allDepartmentPermissions: [
    { module: Module.DEPARTMENT, level: PermissionLevel.READ },
    { module: Module.DEPARTMENT, level: PermissionLevel.WRITE },
    { module: Module.DEPARTMENT, level: PermissionLevel.ADMIN }
  ],
  
  // 所有管理员权限组合
  adminPermissions: [
    { module: Module.USER, level: PermissionLevel.ADMIN },
    { module: Module.DEPARTMENT, level: PermissionLevel.ADMIN },
    { module: Module.ROUTE, level: PermissionLevel.ADMIN }
  ],
  
  // 创建给定模块的所有权限级别
  createModulePermissions: (module) => {
    return [
      { module, level: PermissionLevel.READ },
      { module, level: PermissionLevel.WRITE },
      { module, level: PermissionLevel.ADMIN }
    ]
  },
  
  // 创建给定模块和部门的所有权限级别
  createModulePermissionsWithDepartment: (module, departmentId) => {
    return [
      { module, level: PermissionLevel.READ, department_id: departmentId },
      { module, level: PermissionLevel.WRITE, department_id: departmentId },
      { module, level: PermissionLevel.ADMIN, department_id: departmentId }
    ]
  }
}

// 权限描述映射，用于UI显示
export const PermissionDescriptions = {
  // 模块描述
  modules: {
    [Module.USER]: '用户管理',
    [Module.DEPARTMENT]: '部门管理',
    [Module.EHS]: 'EHS管理',
    [Module.QA]: '质量管理',
    [Module.EVENT]: '事件管理',
    [Module.MAINT]: '维护管理',
    [Module.ACTIVITY]: '活动管理',
    [Module.ROUTE]: '路由管理',
    [Module.ALL]: '所有模块'
  },
  
  // 权限等级描述
  levels: {
    [PermissionLevel.READ]: '只读',
    [PermissionLevel.WRITE]: '编辑',
    [PermissionLevel.ADMIN]: '管理',
    [PermissionLevel.SUPER_ADMIN]: '超级管理'
  },
  
  // 格式化权限描述
  getDescription: (module, level) => {
    const moduleDesc = PermissionDescriptions.modules[module] || module
    const levelDesc = PermissionDescriptions.levels[level] || level
    return `${moduleDesc}(${levelDesc})`
  },
  
  // 获取带部门的权限描述
  getDescriptionWithDepartment: (module, level, departmentName) => {
    const baseDesc = PermissionDescriptions.getDescription(module, level)
    return departmentName ? `${baseDesc} - ${departmentName}` : baseDesc
  }
} 