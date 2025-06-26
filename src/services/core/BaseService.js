import http from './http'

/**
 * 基础服务类
 * 提供常见的CRUD操作和错误处理
 */
class BaseService {
  /**
   * 构造函数
   * @param {string} endpoint - 服务的API端点
   */
  constructor(endpoint) {
    this.endpoint = endpoint
  }

  /**
   * 获取所有记录
   * @param {object} params - 查询参数
   * @returns {Promise<Array>} - 记录列表
   */
  async getAll(params = {}) {
    try {
      const response = await http.get(this.endpoint, { params })
      return response.data || []
    } catch (error) {
      this._handleError(error, 'getAll')
      return []
    }
  }

  /**
   * 根据ID获取单个记录
   * @param {string|number} id - 记录ID
   * @returns {Promise<object>} - 记录对象
   */
  async getById(id) {
    try {
      const response = await http.get(`${this.endpoint}/${id}`)
      return response.data
    } catch (error) {
      this._handleError(error, 'getById')
      return null
    }
  }

  /**
   * 创建新记录
   * @param {object} data - 记录数据
   * @returns {Promise<object>} - 创建的记录
   */
  async create(data) {
    try {
      const response = await http.post(this.endpoint, data)
      return response.data
    } catch (error) {
      this._handleError(error, 'create')
      throw error
    }
  }

  /**
   * 更新记录
   * @param {string|number} id - 记录ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} - 更新后的记录
   */
  async update(id, data) {
    try {
      const response = await http.put(`${this.endpoint}/${id}`, data)
      return response.data
    } catch (error) {
      this._handleError(error, 'update')
      throw error
    }
  }

  /**
   * 删除记录
   * @param {string|number} id - 记录ID
   * @returns {Promise<boolean>} - 是否成功删除
   */
  async delete(id) {
    try {
      await http.delete(`${this.endpoint}/${id}`)
      return true
    } catch (error) {
      this._handleError(error, 'delete')
      return false
    }
  }

  /**
   * 发送自定义GET请求
   * @param {string} url - 请求URL
   * @param {object} params - 查询参数
   * @returns {Promise<any>} - 响应数据
   */
  async customGet(url, params = {}) {
    try {
      const response = await http.get(url, { params })
      return response.data
    } catch (error) {
      this._handleError(error, 'customGet')
      throw error
    }
  }

  /**
   * 发送自定义POST请求
   * @param {string} url - 请求URL
   * @param {object} data - 请求数据
   * @returns {Promise<any>} - 响应数据
   */
  async customPost(url, data = {}) {
    try {
      const response = await http.post(url, data)
      return response.data
    } catch (error) {
      this._handleError(error, 'customPost')
      throw error
    }
  }

  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} operation - 操作名称
   * @protected
   */
  _handleError(error, operation) {
    const message = error.message || '未知错误'
    const status = error.status || error.response?.status
    console.error(`[${this.endpoint}][${operation}] 错误:`, { message, status, error })
  }
}

export default BaseService 