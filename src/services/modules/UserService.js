import BaseService from '../core/BaseService'
import http from '../core/http'

/**
 * 用户服务类
 * 处理用户相关操作
 */
class UserService extends BaseService {
  constructor() {
    // 用户端点
    super('users')
  }

  /**
   * 获取当前登录用户信息
   * @returns {Promise<object>} - 用户信息
   */
  async getCurrentUser() {
    try {
      const response = await http.get('/users/me')
      return response.data
    } catch (error) {
      this._handleError(error, 'getCurrentUser')
      throw error
    }
  }

  /**
   * 更新当前用户信息
   * @param {object} userData - 用户数据
   * @returns {Promise<object>} - 更新后的用户信息
   */
  async updateCurrentUser(userData) {
    try {
      const response = await http.put('/users/me', userData)
      return response.data
    } catch (error) {
      this._handleError(error, 'updateCurrentUser')
      throw error
    }
  }

  /**
   * 更改密码
   * @param {string} currentPassword - 当前密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} - 是否成功更改密码
   */
  async changePassword(currentPassword, newPassword) {
    try {
      await http.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      })
      return true
    } catch (error) {
      this._handleError(error, 'changePassword')
      throw error
    }
  }

  /**
   * 获取用户列表
   * @param {object} params - 查询参数
   * @returns {Promise<Array>} - 用户列表
   */
  async getUsers(params = {}) {
    return this.getAll(params)
  }

  /**
   * 创建新用户
   * @param {object} userData - 用户数据
   * @returns {Promise<object>} - 创建的用户
   */
  async createUser(userData) {
    return this.create(userData)
  }

  /**
   * 更新用户
   * @param {string|number} userId - 用户ID
   * @param {object} userData - 用户数据
   * @returns {Promise<object>} - 更新后的用户
   */
  async updateUser(userId, userData) {
    return this.update(userId, userData)
  }

  /**
   * 删除用户
   * @param {string|number} userId - 用户ID
   * @returns {Promise<boolean>} - 是否成功删除
   */
  async deleteUser(userId) {
    return this.delete(userId)
  }

  /**
   * 为用户分配角色
   * @param {string|number} userId - 用户ID
   * @param {Array<string>} roles - 角色列表
   * @returns {Promise<object>} - 更新后的用户
   */
  async assignRoles(userId, roles) {
    try {
      const response = await http.post(`/users/${userId}/roles`, { roles })
      return response.data
    } catch (error) {
      this._handleError(error, 'assignRoles')
      throw error
    }
  }
}

// 创建服务单例
const userService = new UserService()
export default userService 