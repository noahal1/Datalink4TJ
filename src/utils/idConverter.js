/**
 * ID转换工具
 * 用于确保API调用中的ID参数都是正确的类型
 */

/**
 * 将值转换为整数
 * @param {any} value - 要转换的值
 * @param {string} fieldName - 字段名称（用于错误信息）
 * @returns {number} 转换后的整数
 * @throws {Error} 如果转换失败
 */
export function toInteger(value, fieldName = 'ID') {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} 不能为空`)
  }
  
  // 如果已经是数字类型
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value > 0) {
      return value
    }
    throw new Error(`${fieldName} 必须是正整数`)
  }
  
  // 如果是字符串，尝试转换
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      throw new Error(`${fieldName} 不能为空字符串`)
    }
    
    const parsed = parseInt(trimmed, 10)
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(`${fieldName} 必须是有效的正整数`)
    }
    
    return parsed
  }
  
  throw new Error(`${fieldName} 类型无效，必须是数字或数字字符串`)
}

/**
 * 将ID数组转换为整数数组
 * @param {Array} ids - ID数组
 * @param {string} fieldName - 字段名称
 * @returns {Array<number>} 转换后的整数数组
 */
export function toIntegerArray(ids, fieldName = 'IDs') {
  if (!Array.isArray(ids)) {
    throw new Error(`${fieldName} 必须是数组`)
  }
  
  return ids.map((id, index) => {
    try {
      return toInteger(id, `${fieldName}[${index}]`)
    } catch (error) {
      throw new Error(`${fieldName}[${index}]: ${error.message}`)
    }
  })
}

/**
 * 验证并转换API请求中的ID参数
 * @param {Object} params - 参数对象
 * @param {Array<string>} idFields - 需要转换的ID字段名数组
 * @returns {Object} 转换后的参数对象
 */
export function convertApiIds(params, idFields = []) {
  if (!params || typeof params !== 'object') {
    return params
  }

  // 如果是数组，直接返回，不进行ID转换
  if (Array.isArray(params)) {
    return params
  }

  const converted = { ...params }

  for (const field of idFields) {
    if (field in converted) {
      try {
        if (field.endsWith('_ids') || field.endsWith('Ids')) {
          // 数组类型的ID字段
          converted[field] = toIntegerArray(converted[field], field)
        } else {
          // 单个ID字段
          converted[field] = toInteger(converted[field], field)
        }
      } catch (error) {
        console.error(`转换${field}失败:`, error.message)
        throw error
      }
    }
  }

  return converted
}

/**
 * 为API路径中的ID参数进行转换
 * @param {string} path - API路径
 * @param {Object} pathParams - 路径参数
 * @returns {string} 转换后的路径
 */
export function convertApiPath(path, pathParams = {}) {
  let convertedPath = path
  
  for (const [key, value] of Object.entries(pathParams)) {
    if (key.endsWith('_id') || key.endsWith('Id')) {
      try {
        const convertedValue = toInteger(value, key)
        convertedPath = convertedPath.replace(`{${key}}`, convertedValue.toString())
      } catch (error) {
        console.error(`转换路径参数${key}失败:`, error.message)
        throw error
      }
    }
  }
  
  return convertedPath
}

/**
 * 通用的API请求参数转换器
 * @param {Object} options - 请求选项
 * @param {string} options.method - HTTP方法
 * @param {string} options.url - 请求URL
 * @param {Object} options.data - 请求数据
 * @param {Object} options.params - URL参数
 * @returns {Object} 转换后的请求选项
 */
export function convertApiRequest(options) {
  const converted = { ...options }
  
  // 转换URL中的ID参数
  if (converted.url) {
    // 匹配URL中的ID参数，如 /users/{user_id}/roles/{role_id}
    const idMatches = converted.url.match(/\{(\w*_?id)\}/g)
    if (idMatches) {
      console.warn('URL中包含未替换的ID参数:', idMatches)
    }
  }
  
  // 转换请求体中的ID字段
  if (converted.data && typeof converted.data === 'object') {
    // 如果是数组，跳过ID转换
    if (Array.isArray(converted.data)) {
      // 数组数据不需要ID转换，直接跳过
    } else {
      const commonIdFields = [
        'id', 'user_id', 'role_id', 'permission_id', 'route_id', 'department_id',
        'role_ids', 'permission_ids', 'user_ids'
      ]

      try {
        converted.data = convertApiIds(converted.data, commonIdFields)
      } catch (error) {
        console.error('转换请求数据中的ID失败:', error)
        throw error
      }
    }
  }
  
  // 转换URL参数中的ID字段
  if (converted.params && typeof converted.params === 'object') {
    const commonIdFields = [
      'id', 'user_id', 'role_id', 'permission_id', 'route_id', 'department_id'
    ]
    
    try {
      converted.params = convertApiIds(converted.params, commonIdFields)
    } catch (error) {
      console.error('转换URL参数中的ID失败:', error)
      throw error
    }
  }
  
  return converted
}

// 默认导出
export default {
  toInteger,
  toIntegerArray,
  convertApiIds,
  convertApiPath,
  convertApiRequest
}
