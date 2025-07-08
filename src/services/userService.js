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
      // 确保参数是字符串
      if (typeof username !== 'string' || typeof password !== 'string') {
        console.error('登录参数类型错误:', typeof username, typeof password);
        throw new Error('用户名和密码必须是字符串');
      }
      
      // 根据后端API要求构造x-www-form-urlencoded格式的数据
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      
      console.log('登录请求参数:', username, '密码长度:', password ? password.length : 0);
      
      // 直接使用axios发送请求，避免通过api工具类
      const axios = (await import('axios')).default;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/users/token`,
        data: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const data = response.data;
      
      // 检查响应数据格式
      if (!data) {
        throw new Error('服务器返回空响应');
      }
      
      if (!data.access_token) {
        console.error('登录响应缺少token:', data);
        throw new Error('登录响应格式错误');
      }
      
      // 去除敏感信息后再输出日志
      const logData = { ...data };
      if (logData.access_token) logData.access_token = logData.access_token.substring(0, 10) + '...';
      console.log('登录响应数据:', logData);
      
      // 标准化返回数据格式
      return {
        token: data.access_token,
        user_id: data.user_id,
        user_name: data.user_name,
        department: data.department,
        roles: data.roles || []
      };
    } catch (error) {
      // 处理不同类型的错误
      if (error.response && error.response.status === 422) {
        // 表单验证错误
        const detail = error.response.data && error.response.data.detail;
        let errorMsg = '登录验证失败: ';
        
        if (Array.isArray(detail)) {
          errorMsg += detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('; ');
        } else if (typeof detail === 'string') {
          errorMsg += detail;
        } else {
          errorMsg += '用户名或密码格式不正确';
        }
        
        console.error('登录验证错误:', errorMsg, error.response.data);
        throw new Error(errorMsg);
      } else if (error.response && error.response.status === 401) {
        console.error('登录认证失败:', error.response.data);
        throw new Error('用户名或密码不正确');
      } else {
        console.error('登录失败:', error.response?.data || error.message || error);
        throw new Error('登录服务暂时不可用，请稍后再试');
      }
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
    try {
      const response = await this.post('/token/refresh')
      return {
        token: response.access_token,
        access_token: response.access_token,
        token_type: response.token_type,
        user_id: response.user_id,
        user_name: response.user_name
      }
    } catch (error) {
      console.error('刷新token失败:', error)
      throw error
    }
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