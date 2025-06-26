import axios from 'axios'

/**
 * 创建并配置HTTP客户端
 */
const createHttp = (baseURL = '/api/v1') => {
  // 创建axios实例
  const http = axios.create({
    baseURL,
    timeout: 30000, // 30秒超时
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 请求拦截器
  http.interceptors.request.use(
    config => {
      // 从localStorage获取token
      const token = localStorage.getItem('auth') 
        ? JSON.parse(localStorage.getItem('auth')).token
        : null
      
      // 如果有token，添加到Authorization头
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // 记录请求日志
      console.log(`${config.method?.toUpperCase()} ${config.url}`, config)
      
      return config
    },
    error => {
      console.error('请求错误:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  http.interceptors.response.use(
    response => {
      // 记录响应日志
      console.log(`响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
      
      return response
    },
    error => {
      // 获取错误信息
      const errorResponse = error.response
      const errorData = errorResponse?.data
      const errorStatus = errorResponse?.status
      
      // 构造错误对象
      const enhancedError = {
        ...error,
        status: errorStatus,
        message: errorData?.detail || error.message || '未知错误',
        data: errorData
      }
      
      // 记录错误日志
      console.error('响应错误:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: errorStatus,
        message: enhancedError.message
      })
      
      // 根据状态码处理特定错误
      if (errorStatus === 401) {
        // 未授权，可能是token过期
        console.warn('认证失败，请重新登录')
        
        // 清除token
        localStorage.removeItem('auth')
        localStorage.removeItem('user')
        
        // 重定向到登录页面，避免循环重定向
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          window.location.href = '/login'
        }
      }
      
      return Promise.reject(enhancedError)
    }
  )

  return http
}

// 创建默认HTTP客户端
const http = createHttp()

export { http, createHttp }
export default http 