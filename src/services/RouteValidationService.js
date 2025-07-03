/**
 * 路由验证服务
 * 提供路由配置的验证功能
 */

import { RouteType } from './RouteManagerService'

export const ValidationRule = {
  REQUIRED: 'required',
  PATH_FORMAT: 'path_format',
  UNIQUE_PATH: 'unique_path',
  UNIQUE_NAME: 'unique_name',
  COMPONENT_EXISTS: 'component_exists',
  PARENT_EXISTS: 'parent_exists',
  NO_CIRCULAR_REFERENCE: 'no_circular_reference'
}

class RouteValidationService {
  constructor() {
    // 验证规则映射
    this.rules = new Map([
      [ValidationRule.REQUIRED, this._validateRequired],
      [ValidationRule.PATH_FORMAT, this._validatePathFormat],
      [ValidationRule.UNIQUE_PATH, this._validateUniquePath],
      [ValidationRule.UNIQUE_NAME, this._validateUniqueName],
      [ValidationRule.COMPONENT_EXISTS, this._validateComponentExists],
      [ValidationRule.PARENT_EXISTS, this._validateParentExists],
      [ValidationRule.NO_CIRCULAR_REFERENCE, this._validateNoCircularReference]
    ])

    // 路径格式正则表达式
    this.pathRegex = /^\/[a-zA-Z0-9\-_/:]*$/
    this.dynamicSegmentRegex = /^:[a-zA-Z][a-zA-Z0-9_]*$/
  }

  /**
   * 验证单个路由
   * @param {Object} route - 路由配置
   * @param {Object} context - 验证上下文
   * @returns {Object} 验证结果
   */
  validateRoute(route, context = {}) {
    const { existingRoutes = [], availableComponents = [] } = context
    const errors = []
    const warnings = []

    // 执行所有验证规则
    for (const [ruleName, ruleFunction] of this.rules) {
      try {
        const result = ruleFunction.call(this, route, { existingRoutes, availableComponents })
        if (result.errors) {
          errors.push(...result.errors)
        }
        if (result.warnings) {
          warnings.push(...result.warnings)
        }
      } catch (error) {
        console.error(`验证规则 ${ruleName} 执行失败:`, error)
        errors.push(`验证规则执行失败: ${ruleName}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      route
    }
  }

  /**
   * 批量验证路由
   * @param {Array} routes - 路由列表
   * @param {Object} context - 验证上下文
   * @returns {Object} 批量验证结果
   */
  validateRoutes(routes, context = {}) {
    const results = []
    let totalErrors = 0
    let totalWarnings = 0

    routes.forEach((route, index) => {
      const result = this.validateRoute(route, {
        ...context,
        existingRoutes: routes.filter((_, i) => i !== index)
      })
      
      results.push(result)
      totalErrors += result.errors.length
      totalWarnings += result.warnings.length
    })

    return {
      isValid: totalErrors === 0,
      totalErrors,
      totalWarnings,
      results
    }
  }

  // ==================== 验证规则实现 ====================

  /**
   * 验证必填字段
   */
  _validateRequired(route) {
    const errors = []
    
    if (!route.name || route.name.trim() === '') {
      errors.push('路由名称不能为空')
    }
    
    if (!route.meta?.title || route.meta.title.trim() === '') {
      errors.push('路由标题不能为空')
    }

    // 页面路由的特殊要求
    if (route.type !== RouteType.PARENT_MENU && !route.meta?.isParentMenu) {
      if (!route.path || route.path.trim() === '') {
        errors.push('路由路径不能为空')
      }
      
      if (!route.component || route.component.trim() === '') {
        errors.push('路由组件不能为空')
      }
    }

    return { errors }
  }

  /**
   * 验证路径格式
   */
  _validatePathFormat(route) {
    const errors = []
    const warnings = []

    if (!route.path) return { errors, warnings }

    // 基本格式检查
    if (!this.pathRegex.test(route.path) && route.path !== '*') {
      errors.push('路径格式不正确，应该以 / 开头，只包含字母、数字、连字符、下划线和冒号')
    }

    // 检查是否以 / 开头
    if (!route.path.startsWith('/') && route.path !== '*') {
      warnings.push('路径应该以 / 开头')
    }

    // 检查动态段格式
    const segments = route.path.split('/')
    segments.forEach(segment => {
      if (segment.startsWith(':') && !this.dynamicSegmentRegex.test(segment)) {
        errors.push(`动态路径段格式不正确: ${segment}`)
      }
    })

    // 检查路径长度
    if (route.path.length > 200) {
      warnings.push('路径过长，建议控制在200字符以内')
    }

    return { errors, warnings }
  }

  /**
   * 验证路径唯一性
   */
  _validateUniquePath(route, { existingRoutes }) {
    const errors = []
    
    if (!route.path) return { errors }

    const duplicate = existingRoutes.find(r => 
      r.id !== route.id && r.path === route.path
    )
    
    if (duplicate) {
      errors.push(`路径已存在: ${route.path} (与路由 "${duplicate.name}" 冲突)`)
    }

    return { errors }
  }

  /**
   * 验证名称唯一性
   */
  _validateUniqueName(route, { existingRoutes }) {
    const errors = []
    
    if (!route.name) return { errors }

    const duplicate = existingRoutes.find(r => 
      r.id !== route.id && r.name === route.name
    )
    
    if (duplicate) {
      errors.push(`路由名称已存在: ${route.name}`)
    }

    return { errors }
  }

  /**
   * 验证组件是否存在
   */
  _validateComponentExists(route, { availableComponents }) {
    const errors = []
    const warnings = []
    
    if (!route.component || route.type === RouteType.PARENT_MENU) {
      return { errors, warnings }
    }

    if (!availableComponents.includes(route.component)) {
      warnings.push(`组件 "${route.component}" 不在可用组件列表中`)
    }

    return { errors, warnings }
  }

  /**
   * 验证父路由是否存在
   */
  _validateParentExists(route, { existingRoutes }) {
    const errors = []
    
    if (!route.parentId) return { errors }

    const parent = existingRoutes.find(r => r.id === route.parentId)
    if (!parent) {
      errors.push(`父路由不存在: ${route.parentId}`)
    }

    return { errors }
  }

  /**
   * 验证无循环引用
   */
  _validateNoCircularReference(route, { existingRoutes }) {
    const errors = []
    
    if (!route.parentId) return { errors }

    // 检查是否形成循环
    const visited = new Set()
    let currentId = route.parentId
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)
      
      if (currentId === route.id) {
        errors.push('检测到循环引用')
        break
      }
      
      const parent = existingRoutes.find(r => r.id === currentId)
      currentId = parent?.parentId
    }

    return { errors }
  }

  /**
   * 添加自定义验证规则
   */
  addRule(name, ruleFunction) {
    this.rules.set(name, ruleFunction)
  }

  /**
   * 移除验证规则
   */
  removeRule(name) {
    this.rules.delete(name)
  }

  /**
   * 获取所有验证规则名称
   */
  getRuleNames() {
    return Array.from(this.rules.keys())
  }
}

// 创建单例实例
export default new RouteValidationService()
