import BaseApiService from './apiService'

/**
 * 活动日志服务类
 * 处理与活动记录相关的API调用
 */
class ActivityService extends BaseApiService {
  constructor() {
    super('/activity')
  }

  /**
   * 获取活动日志列表
   * @param {object} params - 查询参数
   * @returns {Promise} - 活动日志列表
   */
  async getActivities(params = {}) {
    return this.get('', params)
  }

  /**
   * 获取活动日志详情
   * @param {number} activityId - 活动日志ID
   * @returns {Promise} - 活动日志详情
   */
  async getActivity(activityId) {
    return this.get(`/${activityId}`)
  }

  /**
   * 记录新的活动日志
   * @param {object} activityData - 活动数据
   * @returns {Promise} - 创建结果
   */
  async recordActivity(activityData) {
    return this.post('', activityData)
  }

  /**
   * 获取用户活动历史
   * @param {number} userId - 用户ID
   * @param {object} params - 查询参数
   * @returns {Promise} - 用户活动历史
   */
  async getUserActivities(userId, params = {}) {
    return this.get(`/user/${userId}`, params)
  }

  /**
   * 获取某个模块的活动记录
   * @param {string} module - 模块名称
   * @param {object} params - 查询参数
   * @returns {Promise} - 模块活动记录
   */
  async getModuleActivities(module, params = {}) {
    return this.get(`/module/${module}`, params)
  }
  
  /**
   * 获取最近活动记录
   * @param {number} limit - 限制返回数量
   * @returns {Promise} - 最近活动记录
   */
  async getRecentActivities(limit = 10) {
    return this.get('/recent', { limit })
  }
  
  /**
   * 搜索活动记录
   * @param {object} searchParams - 搜索参数
   * @returns {Promise} - 搜索结果
   */
  async searchActivities(searchParams = {}) {
    return this.post('/search', searchParams)
  }
}

// 创建并导出单例实例
export default new ActivityService() 