/**
 * 响应式对象处理工具
 * 用于处理Vue响应式对象的序列化和转换
 */

import { toRaw, isRef, unref } from 'vue'

/**
 * 将响应式对象转换为普通对象
 * 解决JSON序列化时的循环引用问题
 * 
 * @param {any} obj - 要转换的对象
 * @returns {any} 转换后的普通对象
 */
export function toPlainObject(obj) {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  // 如果是ref，先解包
  if (isRef(obj)) {
    obj = unref(obj)
  }
  
  // 如果是响应式对象，转换为原始对象
  if (typeof obj === 'object') {
    obj = toRaw(obj)
  }
  
  // 如果是数组，递归处理每个元素
  if (Array.isArray(obj)) {
    return obj.map(item => toPlainObject(item))
  }
  
  // 如果是对象，递归处理每个属性
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const plainObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        plainObj[key] = toPlainObject(obj[key])
      }
    }
    return plainObj
  }
  
  // 其他类型直接返回
  return obj
}

/**
 * 深度克隆对象并转换为普通对象
 * 
 * @param {any} obj - 要克隆的对象
 * @returns {any} 克隆后的普通对象
 */
export function deepCloneToPlain(obj) {
  const plainObj = toPlainObject(obj)
  return JSON.parse(JSON.stringify(plainObj))
}

/**
 * 安全的JSON序列化
 * 自动处理响应式对象和循环引用
 * 
 * @param {any} obj - 要序列化的对象
 * @param {number} space - JSON格式化空格数
 * @returns {string} JSON字符串
 */
export function safeStringify(obj, space = 0) {
  try {
    const plainObj = toPlainObject(obj)
    return JSON.stringify(plainObj, null, space)
  } catch (error) {
    console.error('JSON序列化失败:', error)
    return '{}'
  }
}

/**
 * 为API请求准备数据
 * 将响应式对象转换为适合发送的普通对象
 * 
 * @param {any} data - 要发送的数据
 * @returns {any} 处理后的数据
 */
export function prepareApiData(data) {
  if (!data) return data

  // 如果是FormData、File、Blob等特殊对象，直接返回，不进行处理
  if (data instanceof FormData || data instanceof File || data instanceof Blob) {
    return data
  }

  // 转换为普通对象
  const plainData = toPlainObject(data)

  // 移除空值和undefined值（可选）
  if (typeof plainData === 'object' && !Array.isArray(plainData)) {
    const cleanData = {}
    for (const key in plainData) {
      if (plainData[key] !== undefined && plainData[key] !== null && plainData[key] !== '') {
        cleanData[key] = plainData[key]
      }
    }
    return cleanData
  }

  return plainData
}

/**
 * 检查对象是否包含循环引用
 * 
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 是否包含循环引用
 */
export function hasCircularReference(obj) {
  try {
    JSON.stringify(obj)
    return false
  } catch (error) {
    return error.message.includes('circular') || error.message.includes('Converting circular structure')
  }
}

/**
 * 表单数据处理器
 * 专门用于处理表单提交数据
 * 
 * @param {Object} formData - 表单数据
 * @param {Object} options - 选项
 * @param {boolean} options.removeEmpty - 是否移除空值
 * @param {boolean} options.trimStrings - 是否去除字符串首尾空格
 * @returns {Object} 处理后的表单数据
 */
export function processFormData(formData, options = {}) {
  const { removeEmpty = true, trimStrings = true } = options
  
  const plainData = toPlainObject(formData)
  
  if (typeof plainData !== 'object' || Array.isArray(plainData)) {
    return plainData
  }
  
  const processedData = {}
  
  for (const key in plainData) {
    if (plainData.hasOwnProperty(key)) {
      let value = plainData[key]
      
      // 去除字符串首尾空格
      if (trimStrings && typeof value === 'string') {
        value = value.trim()
      }
      
      // 移除空值
      if (removeEmpty && (value === '' || value === null || value === undefined)) {
        continue
      }
      
      processedData[key] = value
    }
  }
  
  return processedData
}

/**
 * 调试工具：打印对象的响应式状态
 * 
 * @param {any} obj - 要检查的对象
 * @param {string} label - 标签
 */
export function debugReactiveState(obj, label = 'Object') {
  console.group(`🔍 ${label} 响应式状态检查`)
  console.log('原始对象:', obj)
  console.log('是否为ref:', isRef(obj))
  console.log('是否有循环引用:', hasCircularReference(obj))
  console.log('转换后的普通对象:', toPlainObject(obj))
  console.groupEnd()
}

export default {
  toPlainObject,
  deepCloneToPlain,
  safeStringify,
  prepareApiData,
  hasCircularReference,
  processFormData,
  debugReactiveState
}
