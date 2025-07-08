/**
 * API调试工具
 * 用于调试和监控API请求
 */

// 拦截并记录API请求
export const debugApiRequest = (config) => {
  // 只在开发环境显示详细日志
  if (import.meta.env.DEV) {
    console.log(`API请求: ${config.method?.toUpperCase()} ${config.url}`)

    // 特别检查QA相关的请求
    if (config.url?.includes('/qa')) {
      console.log('QA API请求 - 数据类型:', typeof config.data, '是否为数组:', Array.isArray(config.data))

      // 验证数据格式
      if (!Array.isArray(config.data)) {
        console.warn('警告：QA API发送的数据不是数组格式！', typeof config.data)
      }
    }
  }

  return config
}

// 拦截并记录API响应
export const debugApiResponse = (response) => {
  if (import.meta.env.DEV) {
    console.log(`API响应: ${response.config?.method?.toUpperCase()} ${response.config?.url} - ${response.status}`)
  }
  return response
}

// 拦截并记录API错误
export const debugApiError = (error) => {
  console.error(`API错误: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`)

  // 特别处理422错误
  if (error.response?.status === 422) {
    console.error('验证错误详情:', error.response?.data?.detail)

    // 如果是QA相关的错误，提供更多信息
    if (error.config?.url?.includes('/qa')) {
      console.error('QA API错误 - 后端期望数组格式，实际发送:', typeof error.config?.data)
      if (!Array.isArray(error.config?.data)) {
        console.error('数据格式错误，发送的不是数组:', error.config?.data)
      }
    }
  }

  return Promise.reject(error)
}

// 验证QA数据格式
export const validateQaData = (data) => {
  console.group('🔍 QA数据验证')
  
  const issues = []
  
  // 检查是否为数组
  if (!Array.isArray(data)) {
    issues.push(`数据不是数组类型，当前类型: ${typeof data}`)
  } else {
    console.log('✅ 数据是数组类型')
    console.log(`📊 数组长度: ${data.length}`)
    
    // 检查数组元素
    data.forEach((item, index) => {
      const requiredFields = ['line', 'day', 'month', 'year', 'value', 'scrapflag']
      const missingFields = requiredFields.filter(field => !(field in item))
      
      if (missingFields.length > 0) {
        issues.push(`第${index + 1}个元素缺少字段: ${missingFields.join(', ')}`)
      }
      
      // 检查字段类型
      if (typeof item.line !== 'string') {
        issues.push(`第${index + 1}个元素的line字段应为字符串`)
      }
      if (typeof item.day !== 'string') {
        issues.push(`第${index + 1}个元素的day字段应为字符串`)
      }
      if (typeof item.month !== 'string') {
        issues.push(`第${index + 1}个元素的month字段应为字符串`)
      }
      if (typeof item.year !== 'string') {
        issues.push(`第${index + 1}个元素的year字段应为字符串`)
      }
      if (typeof item.value !== 'string') {
        issues.push(`第${index + 1}个元素的value字段应为字符串`)
      }
      if (typeof item.scrapflag !== 'boolean') {
        issues.push(`第${index + 1}个元素的scrapflag字段应为布尔值`)
      }
    })
  }
  
  if (issues.length === 0) {
    console.log('✅ 数据格式验证通过')
  } else {
    console.log('❌ 数据格式验证失败:')
    issues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  console.groupEnd()
  return issues
}

// 格式化QA数据
export const formatQaData = (rawData) => {
  // 检查数据类型并尝试修复
  let dataToProcess = rawData

  if (!Array.isArray(rawData)) {
    // 如果是对象，尝试转换为数组
    if (typeof rawData === 'object' && rawData !== null) {
      // 检查是否是类数组对象 {0: {...}, 1: {...}}
      const keys = Object.keys(rawData)
      const isArrayLike = keys.every(key => /^\d+$/.test(key))

      if (isArrayLike) {
        dataToProcess = Object.values(rawData)
      } else {
        console.error('无法转换为数组格式')
        return []
      }
    } else {
      console.error('输入数据不是有效的对象或数组')
      return []
    }
  }

  if (!Array.isArray(dataToProcess)) {
    console.error('数据修复失败，仍然不是数组')
    return []
  }

  const formattedData = dataToProcess.map((item) => {
    return {
      line: String(item.line || ''),
      day: String(item.day || ''),
      month: String(item.month || ''),
      year: String(item.year || new Date().getFullYear()),
      value: String(item.value || '0'),
      scrapflag: Boolean(item.scrapflag)
    }
  })

  // 确保返回的是真正的数组
  return Array.from(formattedData)
}

// 启用API调试
export const enableApiDebug = (apiInstance) => {
  // 添加请求拦截器
  apiInstance.interceptors.request.use(
    debugApiRequest,
    (error) => {
      console.error('❌ 请求拦截器错误:', error)
      return Promise.reject(error)
    }
  )
  
  // 添加响应拦截器
  apiInstance.interceptors.response.use(
    debugApiResponse,
    debugApiError
  )
  
  console.log('🔧 API调试已启用')
}

export default {
  debugApiRequest,
  debugApiResponse,
  debugApiError,
  validateQaData,
  formatQaData,
  enableApiDebug
}
