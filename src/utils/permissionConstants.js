/**
 * 权限常量定义
 * 简化的权限系统，直接使用权限代码
 */

// 常用权限代码前缀
export const PermissionPrefixes = {
  ACCESS: 'access_',      // 访问权限前缀
  MANAGE: 'manage_',      // 管理权限前缀
  VIEW: 'view_',          // 查看权限前缀
  EDIT: 'edit_',          // 编辑权限前缀
  CREATE: 'create_',      // 创建权限前缀
  DELETE: 'delete_'       // 删除权限前缀
}

// 预定义权限代码
export const PredefinedPermissions = {
  // 系统管理
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',
  MANAGE_ROUTES: 'manage_routes',
  MANAGE_DEPARTMENTS: 'manage_departments',
  
  // 通用操作权限
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  
  // 所有人权限
  ALL_USER: '*'
}

// 预定义角色
export const PredefinedRoles = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  USER: '普通用户'
}

// 权限帮助函数
export const PermissionHelper = {
  // 生成访问路由的权限代码
  generateRouteAccessCode: (routeName) => {
    if (!routeName) return null
    return `${PermissionPrefixes.ACCESS}${routeName.toLowerCase()}`
  },
  
  // 生成管理资源的权限代码
  generateManageCode: (resource) => {
    if (!resource) return null
    return `${PermissionPrefixes.MANAGE}${resource.toLowerCase()}`
  },
  
  // 生成查看资源的权限代码
  generateViewCode: (resource) => {
    if (!resource) return null
    return `${PermissionPrefixes.VIEW}${resource.toLowerCase()}`
  },
  
  // 生成编辑资源的权限代码
  generateEditCode: (resource) => {
    if (!resource) return null
    return `${PermissionPrefixes.EDIT}${resource.toLowerCase()}`
  },
  
  // 检查是否是公开权限代码
  isPublicCode: (code) => {
    return code === '*' || code === 'public'
  },
  
  // 将旧的MODULE.LEVEL格式转换为新的权限代码格式
  convertLegacyPermission: (module, level) => {
    if (!module || !level) return null
    
    module = module.toLowerCase()
    level = level.toLowerCase()
    
    // 根据不同级别生成不同前缀的权限代码
    switch (level) {
      case 'read':
        return `${PermissionPrefixes.VIEW}${module}`
      case 'write':
        return `${PermissionPrefixes.EDIT}${module}`
      case 'admin':
        return `${PermissionPrefixes.MANAGE}${module}`
      default:
        return null
    }
  }
}

// 权限描述映射，用于UI显示
export const PermissionDescriptions = {
  // 获取权限代码的友好描述
  getDescription: (permissionCode) => {
    if (!permissionCode) return '未知权限'
    if (permissionCode === '*') return '所有用户权限'
    
    // 检查是否是预定义权限
    const predefinedDesc = getPredefinedDescription(permissionCode)
    if (predefinedDesc) return predefinedDesc
    
    // 根据前缀生成描述
    if (permissionCode.startsWith(PermissionPrefixes.ACCESS)) {
      const resource = permissionCode.substring(PermissionPrefixes.ACCESS.length)
      return `访问${formatResource(resource)}`
    }
    
    if (permissionCode.startsWith(PermissionPrefixes.MANAGE)) {
      const resource = permissionCode.substring(PermissionPrefixes.MANAGE.length)
      return `管理${formatResource(resource)}`
    }
    
    if (permissionCode.startsWith(PermissionPrefixes.VIEW)) {
      const resource = permissionCode.substring(PermissionPrefixes.VIEW.length)
      return `查看${formatResource(resource)}`
    }
    
    if (permissionCode.startsWith(PermissionPrefixes.EDIT)) {
      const resource = permissionCode.substring(PermissionPrefixes.EDIT.length)
      return `编辑${formatResource(resource)}`
    }
    
    if (permissionCode.startsWith(PermissionPrefixes.CREATE)) {
      const resource = permissionCode.substring(PermissionPrefixes.CREATE.length)
      return `创建${formatResource(resource)}`
    }
    
    if (permissionCode.startsWith(PermissionPrefixes.DELETE)) {
      const resource = permissionCode.substring(PermissionPrefixes.DELETE.length)
      return `删除${formatResource(resource)}`
    }
    
    // 如果没有匹配的前缀，直接返回权限代码
    return permissionCode
  }
}

// 获取预定义权限的描述
function getPredefinedDescription(permissionCode) {
  const predefinedDescriptions = {
    [PredefinedPermissions.MANAGE_USERS]: '管理用户',
    [PredefinedPermissions.MANAGE_ROLES]: '管理角色',
    [PredefinedPermissions.MANAGE_PERMISSIONS]: '管理权限',
    [PredefinedPermissions.MANAGE_ROUTES]: '管理路由',
    [PredefinedPermissions.MANAGE_DEPARTMENTS]: '管理部门',
    [PredefinedPermissions.VIEW_DASHBOARD]: '查看仪表盘',
    [PredefinedPermissions.VIEW_REPORTS]: '查看报表',
    [PredefinedPermissions.EXPORT_DATA]: '导出数据',
    [PredefinedPermissions.IMPORT_DATA]: '导入数据',
  }
  
  return predefinedDescriptions[permissionCode]
}

// 格式化资源名称
function formatResource(resource) {
  if (!resource) return ''
  
  // 常见资源映射
  const resourceMapping = {
    users: '用户',
    roles: '角色',
    permissions: '权限',
    routes: '路由',
    departments: '部门',
    dashboard: '仪表盘',
    reports: '报表',
    data: '数据',
    quality: '质量管理',
    ehs: 'EHS管理',
    events: '事件管理',
    maintenance: '维护管理',
  }
  
  return resourceMapping[resource] || resource
} 