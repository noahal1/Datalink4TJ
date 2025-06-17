/**
 * API 请求工具类
 */
import axios from 'axios'
import { useUserStore } from '../stores/user'
import Message from './notification'
import router from '../router'

// API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

console.log('API基础URL:', API_BASE_URL)

// 调试功能 - 开发模式下打印详细日志
const isDebugMode = true;
const debug = (...args) => {
  if (isDebugMode) {
    console.log(...args);
  }
};

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
    // 使用函数而不是直接导入，避免循环依赖
    const userStore = useUserStore()
    
    // 如果有token，则添加到请求头
    if (userStore.token) {
      // 确保Authorization头格式正确
      const token = userStore.token.trim();
      config.headers['Authorization'] = `Bearer ${token}`;
      debug(`请求添加认证头: ${config.method.toUpperCase()} ${config.url}`);
      debug(`Token: ${token}`);
    } else {
      debug(`请求无认证: ${config.method.toUpperCase()} ${config.url}`);
      
      // 如果是需要认证的API，且不是登录请求，则提示用户先登录
      if (!config.url.includes('/users/token') && !config.url.includes('/login')) {
        const isAuthRequired = true; // 大多数API都需要认证
        if (isAuthRequired && router.currentRoute.value.path !== '/login') {
          console.warn('未授权访问API，将重定向到登录页面');
          // 这里不直接跳转，让响应拦截器处理401错误时跳转
        }
      }
    }
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    debug(`请求成功: ${response.config.method.toUpperCase()} ${response.config.url}`);
    // 返回原始响应对象，保留响应结构
    return response;
  },
  error => {
    // 网络错误处理
    if (!error.response) {
      console.error('网络错误:', error)
      Message.error('网络错误，请检查您的网络连接')
      return Promise.reject(new Error('网络错误'))
    }
    
    const { status, config, data } = error.response
    console.error(`请求失败(${status}):`, config.method.toUpperCase(), config.url, data)
    
    // 处理特定错误码
    switch (status) {
      case 401:
        // 避免在登录请求本身上触发登出逻辑
        if (config.url.includes('/users/token')) {
          Message.error('用户名或密码错误')
        } else {
          console.warn('认证失败，需要重新登录')
          Message.error('登录已过期，请重新登录')
          
          // 清除用户信息
          const userStore = useUserStore()
          userStore.logout()
          
          // 保存当前路径，登录后重定向回来
          const currentPath = router.currentRoute.value.path
          if (currentPath !== '/login') {
            sessionStorage.setItem('redirectPath', currentPath)
            // 重定向到登录页面
            router.push('/login')
          }
        }
        break
        
      case 403:
        Message.error('没有权限访问该资源')
        // 可能是因为用户不是管理员
        console.error('权限错误:', data?.detail || '权限不足')
        break
        
      case 404:
        Message.error('请求的资源不存在')
        break
        
      case 422:
        // 处理验证错误
        let validationError = '请求参数验证失败'
        if (data?.detail && Array.isArray(data.detail)) {
          // FastAPI验证错误格式
          const errors = data.detail.map(err => {
            const field = err.loc.slice(1).join('.')
            return `${field}: ${err.msg}`
          }).join('; ')
          validationError = `参数验证错误: ${errors}`
        } else if (data?.detail) {
          validationError = data.detail
        }
        console.error('验证错误:', validationError)
        Message.error(validationError)
        break
        
      case 500:
        Message.error('服务器错误，请联系管理员')
        console.error('服务器错误:', data?.detail || '未知服务器错误')
        break
        
      default:
        // 提取详细错误信息
        const errorMsg = error.response.data?.detail || '请求失败'
        Message.error(errorMsg)
    }
    
    return Promise.reject(error)
  }
)

export default api

/**
 * GET请求
 */
export function get(endpoint, params = {}) {
  debug(`发起GET请求: ${endpoint}`, params);
  
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
  debug(`发起POST请求: ${endpoint}`, data);
  return api.post(endpoint, data)
}

/**
 * PUT请求
 */
export function put(endpoint, data = {}) {
  debug(`发起PUT请求: ${endpoint}`, data);
  return api.put(endpoint, data)
}

/**
 * DELETE请求
 */
export function del(endpoint) {
  debug(`发起DELETE请求: ${endpoint}`);
  return api.delete(endpoint)
} 