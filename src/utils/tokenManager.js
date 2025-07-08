/**
 * Token管理工具
 * 用于处理token的自动刷新和错误处理
 */

let isRefreshing = false
let failedQueue = []

/**
 * 处理失败队列
 * @param {Error} error - 错误对象
 */
const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
  
  failedQueue = []
}

/**
 * 刷新token的统一处理
 * @param {Function} refreshFunction - 刷新token的函数
 * @returns {Promise} - 刷新结果
 */
export const handleTokenRefresh = async (refreshFunction) => {
  if (isRefreshing) {
    // 如果正在刷新，将请求加入队列
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
  }

  isRefreshing = true

  try {
    await refreshFunction()
    processQueue(null)
    return Promise.resolve()
  } catch (error) {
    processQueue(error)
    return Promise.reject(error)
  } finally {
    isRefreshing = false
  }
}

/**
 * 检查是否应该刷新token
 * @param {string} url - 请求URL
 * @param {string} token - 当前token
 * @returns {boolean} - 是否应该刷新
 */
export const shouldRefreshToken = (url, token) => {
  // 不在以下情况刷新token：
  // 1. 没有token
  // 2. 是登录请求
  // 3. 是token刷新请求
  // 4. 正在刷新中
  if (!token || 
      url.includes('/users/token') || 
      url.includes('/token/refresh') ||
      isRefreshing) {
    return false
  }
  
  return true
}

/**
 * 解析JWT token获取过期时间
 * @param {string} token - JWT token
 * @returns {number|null} - 过期时间戳或null
 */
export const getTokenExpiry = (token) => {
  try {
    if (!token) return null
    
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch (error) {
    console.warn('解析token失败:', error)
    return null
  }
}

/**
 * 检查token是否即将过期
 * @param {string} token - JWT token
 * @param {number} threshold - 提前刷新的时间阈值（毫秒）
 * @returns {boolean} - 是否即将过期
 */
export const isTokenExpiringSoon = (token, threshold = 5 * 60 * 1000) => {
  const expiry = getTokenExpiry(token)
  if (!expiry) return false
  
  const now = Date.now()
  return (expiry - now) < threshold
}

/**
 * 检查token是否已过期
 * @param {string} token - JWT token
 * @returns {boolean} - 是否已过期
 */
export const isTokenExpired = (token) => {
  const expiry = getTokenExpiry(token)
  if (!expiry) return false
  
  return Date.now() >= expiry
}

/**
 * 清理token相关的存储
 */
export const clearTokenStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('redirectPath')
}

/**
 * 安全的token存储
 * @param {string} token - 要存储的token
 */
export const storeToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
  }
}

/**
 * 获取存储的token
 * @returns {string|null} - 存储的token或null
 */
export const getStoredToken = () => {
  return localStorage.getItem('token')
}

export default {
  handleTokenRefresh,
  shouldRefreshToken,
  getTokenExpiry,
  isTokenExpiringSoon,
  isTokenExpired,
  clearTokenStorage,
  storeToken,
  getStoredToken
}
