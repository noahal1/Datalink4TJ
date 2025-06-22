import BaseApiService from './apiService'
import api from '../utils/api'

/**
 * 用户服务类
 * 处理与用户相关的API调用
 */
class UserService extends BaseApiService {
  constructor() {
    super('/users')
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise} - 登录结果
   */
  async login(username, password) {
    try {
      // 使用URLSearchParams构造x-www-form-urlencoded格式的数据，这是FastAPI OAuth2PasswordRequestForm期望的格式
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      console.log('登录请求数据:', username, '密码长度:', password ? password.length : 0);
      
      // 发送请求，使用正确的Content-Type
      const response = await api.post('/users/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const data = response.data;
      console.log('登录响应数据:', data);
      
      // 标准化返回数据格式
      return {
        token: data.access_token,
        user_id: data.user_id,
        user_name: data.user_name,
        department: data.department,
        roles: data.roles || []
      };
    } catch (error) {
      console.error('登录失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   * @returns {Promise} - 用户信息
   */
  async getCurrentUser() {
    try {
      const response = await this.get('/me');
      
      // 标准化返回数据格式
      return {
        id: response.user_id,
        name: response.user_name,
        username: response.user_name,
        department: response.department,
        roles: response.roles || []
      };
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 刷新token
   * @returns {Promise} - 刷新结果
   */
  async refreshToken() {
    return this.post('/token/refresh')
  }

  /**
   * 获取用户列表
   * @param {object} params - 查询参数
   * @returns {Promise} - 用户列表
   */
  async getUsers(params = {}) {
    return this.get('', params)
  }

  /**
   * 获取指定用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise} - 用户信息
   */
  async getUser(userId) {
    return this.get(`/${userId}`)
  }

  /**
   * 创建用户
   * @param {object} userData - 用户数据
   * @returns {Promise} - 创建结果
   */
  async createUser(userData) {
    return this.post('', userData)
  }

  /**
   * 更新用户
   * @param {number} userId - 用户ID
   * @param {object} userData - 用户数据
   * @returns {Promise} - 更新结果
   */
  async updateUser(userId, userData) {
    return this.put(`/${userId}`, userData)
  }

  /**
   * 删除用户
   * @param {number} userId - 用户ID
   * @returns {Promise} - 删除结果
   */
  async deleteUser(userId) {
    return this.delete(`/${userId}`)
  }

  /**
   * 修改密码
   * @param {object} passwordData - 密码数据
   * @returns {Promise} - 修改结果
   */
  async changePassword(passwordData) {
    return this.post('/change-password', passwordData)
  }

  /**
   * 获取用户权限
   * @returns {Promise} - 用户权限
   */
  async getUserPermissions() {
    return this.get('/permissions')
  }
}

// 创建并导出单例实例
export default new UserService() 