import api from '../utils/api'

/**
 * 基础API服务类
 * 提供基本的API请求方法，其他服务类将继承这个类
 */
class BaseApiService {
  constructor(baseEndpoint = '') {
    this.baseEndpoint = baseEndpoint
  }

  /**
   * GET请求
   * @param {string} endpoint - API端点
   * @param {object} params - 查询参数
   * @returns {Promise} - 请求Promise
   */
  async get(endpoint = '', params = {}) {
    const url = this._buildUrl(endpoint)
    try {
      const response = await api.get(url, { params })
      return response.data
    } catch (error) {
      this._handleError(error, 'GET', url)
      throw error
    }
  }

  /**
   * POST请求
   * @param {string} endpoint - API端点
   * @param {object} data - 请求体数据
   * @returns {Promise} - 请求Promise
   */
  async post(endpoint = '', data = {}) {
    const url = this._buildUrl(endpoint)
    try {
      const response = await api.post(url, data)
      return response.data
    } catch (error) {
      this._handleError(error, 'POST', url)
      throw error
    }
  }

  /**
   * PUT请求
   * @param {string} endpoint - API端点
   * @param {object} data - 请求体数据
   * @returns {Promise} - 请求Promise
   */
  async put(endpoint = '', data = {}) {
    const url = this._buildUrl(endpoint)
    try {
      const response = await api.put(url, data)
      return response.data
    } catch (error) {
      this._handleError(error, 'PUT', url)
      throw error
    }
  }

  /**
   * DELETE请求
   * @param {string} endpoint - API端点
   * @returns {Promise} - 请求Promise
   */
  async delete(endpoint = '') {
    const url = this._buildUrl(endpoint)
    try {
      const response = await api.delete(url)
      return response.data
    } catch (error) {
      this._handleError(error, 'DELETE', url)
      throw error
    }
  }

  /**
   * 构建完整URL
   * @param {string} endpoint - API端点
   * @returns {string} - 完整URL
   * @private
   */
  _buildUrl(endpoint) {
    if (!endpoint) return this.baseEndpoint
    if (endpoint.startsWith('/')) endpoint = endpoint.substring(1)
    return `${this.baseEndpoint}/${endpoint}`
  }

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} method - 请求方法
   * @param {string} url - 请求URL
   * @private
   */
  _handleError(error, method, url) {
    const errorMessage = error.response?.data?.detail || error.message || '未知错误'
    console.error(`API错误 [${method} ${url}]:`, errorMessage, error)
  }
}

export default BaseApiService 