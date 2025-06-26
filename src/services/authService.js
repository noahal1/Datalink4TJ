import api from '../utils/api'
import { useUserStore } from '../stores/user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 认证服务
 */
const authService = {
  /**
   * 用户登录
   * @param {string} username 用户名
   * @param {string} password 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password) {
    try {
      console.log('用户登录:', username)
      
      // 构建表单数据
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)
      
      // 发送登录请求
      const response = await api.post(`${API_BASE_URL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      // 处理登录成功
      if (response.data && response.data.access_token) {
        // 保存token到localStorage
        localStorage.setItem('token', response.data.access_token)
        
        // 更新用户状态
        const userStore = useUserStore()
        await userStore.fetchUserInfo()
        
        return response.data
      } else {
        throw new Error('登录失败，未获取到访问令牌')
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },
  
  /**
   * 用户注销
   */
  logout() {
    try {
      // 清除token
      localStorage.removeItem('token')
      
      // 清除用户状态
      const userStore = useUserStore()
      userStore.clearUserInfo()
      
      return true
    } catch (error) {
      console.error('注销失败:', error)
      return false
    }
  },
  
  /**
   * 获取当前token
   * @returns {string|null} 当前token或null
   */
  getToken() {
    return localStorage.getItem('token')
  },
  
  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return !!this.getToken()
  },
  
  /**
   * 刷新token
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshToken() {
    try {
      const response = await api.post(`${API_BASE_URL}/auth/refresh-token`)
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
        return response.data
      } else {
        throw new Error('刷新令牌失败')
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      // 如果刷新失败，清除登录状态
      this.logout()
      throw error
    }
  }
}

export default authService 