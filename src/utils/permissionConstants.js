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
  ROUTE: 'ROUTE',          // 路线管理
  ALL: 'ALL'               // 所有模块
}

// 权限帮助函数
export const PermissionHelper = {
  // 格式化权限名称：MODULE:LEVEL
  formatPermission: (module, level) => {
    return `${module}:${level}`
  },
  
  // 解析权限字符串：MODULE:LEVEL -> { module, level }
  parsePermission: (permissionString) => {
    const [module, level] = permissionString.split(':')
    return { module, level }
  },
  
  // 权限等级比较
  isLevelSufficient: (userLevel, requiredLevel) => {
    const levelValues = {
      'READ': 1,
      'WRITE': 2,
      'ADMIN': 3,
      'SUPER_ADMIN': 4
    }
    
    return levelValues[userLevel] >= levelValues[requiredLevel]
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
  ]
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
  }
} 