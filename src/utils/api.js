/**
 * API 请求工具类
 */
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

// API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * 发送请求
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise} - 响应数据
 */
export async function fetchApi(endpoint, options = {}) {
  const userStore = useUserStore()
  
  // 默认请求头
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  // 如果有token，添加到请求头
  if (userStore.token) {
    headers['Authorization'] = `Bearer ${userStore.token}`
  }
  
  // 构建完整URL
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    // 如果返回401，可能是token过期，尝试登出
    if (response.status === 401) {
      userStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      return Promise.reject(new Error('未授权'))
    }
    
    // 处理非200响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || `请求失败: ${response.status}`
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
    
    // 返回解析后的数据
    return await response.json()
  } catch (error) {
    console.error('API请求错误:', error)
    ElMessage.error('网络错误，请检查您的连接')
    return Promise.reject(error)
  }
}

/**
 * GET请求
 */
export function get(endpoint, params = {}) {
  // 构建查询字符串
  const queryString = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
    
  const url = queryString ? `${endpoint}?${queryString}` : endpoint
  
  return fetchApi(url, { method: 'GET' })
}

/**
 * POST请求
 */
export function post(endpoint, data = {}) {
  return fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * PUT请求
 */
export function put(endpoint, data = {}) {
  return fetchApi(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * DELETE请求
 */
export function del(endpoint) {
  return fetchApi(endpoint, { method: 'DELETE' })
} 