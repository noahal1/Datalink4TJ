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
      // 改进：简单手动构建查询参数，避免axios的复杂序列化逻辑
      let finalUrl = url;
      
      // 只有当有参数时才添加查询字符串
      if (Object.keys(params).length > 0) {
        const queryParams = Object.keys(params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join('&');
          
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`;
        console.log('GET请求最终URL:', finalUrl);
      }
      
      // 直接使用构建好的URL发送请求，不传递params参数
      const response = await api.get(finalUrl);
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
    // 如果endpoint为空，直接返回基础端点
    if (!endpoint) return this.baseEndpoint;
    
    // 如果endpoint以/开头，则移除开头的斜杠
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    
    // 确保baseEndpoint末尾没有斜杠，如果有则移除
    let base = this.baseEndpoint;
    if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }
    
    // 组合URL，确保中间有一个斜杠
    return `${base}/${endpoint}`;
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