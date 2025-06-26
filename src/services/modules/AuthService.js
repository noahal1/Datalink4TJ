import BaseService from '../core/BaseService'
import http from '../core/http'

/**
 * 身份验证服务类
 * 处理用户登录、登出和令牌刷新
 */
class AuthService extends BaseService {
  constructor() {
    // 身份验证端点
    super('auth')
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<object>} - 包含token的登录响应
   */
  async login(username, password) {
    try {
      const response = await http.post('/auth/login', { username, password })
      return response.data
    } catch (error) {
      this._handleError(error, 'login')
      throw error
    }
  }

  /**
   * 刷新令牌
   * @returns {Promise<object>} - 包含新token的响应
   */
  async refreshToken() {
    try {
      const response = await http.post('/auth/refresh-token')
      return response.data
    } catch (error) {
      this._handleError(error, 'refreshToken')
      throw error
    }
  }

  /**
   * 验证当前令牌是否有效
   * @returns {Promise<boolean>} - 令牌是否有效
   */
  async validateToken() {
    try {
      const response = await http.get('/auth/validate-token')
      return response.status === 200
    } catch (error) {
      this._handleError(error, 'validateToken')
      return false
    }
  }

  /**
   * 重置密码请求
   * @param {string} email - 用户邮箱
   * @returns {Promise<boolean>} - 是否成功发送重置请求
   */
  async requestPasswordReset(email) {
    try {
      await http.post('/auth/request-password-reset', { email })
      return true
    } catch (error) {
      this._handleError(error, 'requestPasswordReset')
      return false
    }
  }

  /**
   * 重置密码
   * @param {string} token - 重置令牌
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} - 是否成功重置密码
   */
  async resetPassword(token, newPassword) {
    try {
      await http.post('/auth/reset-password', { token, new_password: newPassword })
      return true
    } catch (error) {
      this._handleError(error, 'resetPassword')
      return false
    }
  }
}

// 创建服务单例
const authService = new AuthService()
export default authService 