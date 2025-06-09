/**
 * API 请求工具类
 */
import axios from 'axios'
import { useUserStore } from '../stores/user'
import Message from './notification'
import router from '../router'

// API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    
    // 如果有token，则添加到请求头
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (!error.response) {
      Message.error('网络错误，请检查您的网络连接')
      return Promise.reject(new Error('网络错误'))
    }
    
    const { status } = error.response
    
    switch (status) {
      case 401:
        Message.error('登录已过期，请重新登录')
        // 清除用户信息
        const userStore = useUserStore()
        userStore.logout()
        // 重定向到登录页面
        router.push('/login')
        break
      case 403:
        Message.error('没有权限访问该资源')
        break
      case 404:
        Message.error('请求的资源不存在')
        break
      case 500:
        Message.error('服务器错误，请联系管理员')
        break
      default:
        Message.error(error.response.data?.detail || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default api

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
  
  return api.get(url)
}

/**
 * POST请求
 */
export function post(endpoint, data = {}) {
  return api.post(endpoint, data)
}

/**
 * PUT请求
 */
export function put(endpoint, data = {}) {
  return api.put(endpoint, data)
}

/**
 * DELETE请求
 */
export function del(endpoint) {
  return api.delete(endpoint)
} 