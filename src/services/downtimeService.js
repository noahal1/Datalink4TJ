import BaseApiService from './apiService'

/**
 * 停机单服务模块
 */
class DowntimeService extends BaseApiService {
  constructor() {
    super('/downtime')
  }

  /**
   * 获取停机单列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 停机单列表及总数
   */
  async getDowntimeRecords(params = {}) {
    // 确保参数正确传递
    const queryParams = { ...params };
    
    // 特殊处理日期参数
    if (queryParams.start_from) {
      // 确保日期格式正确
      if (!queryParams.start_from.includes('T')) {
        queryParams.start_from += 'T00:00:00';
      }
    }
    
    if (queryParams.start_to) {
      // 确保日期格式正确
      if (!queryParams.start_to.includes('T')) {
        queryParams.start_to += 'T23:59:59';
      }
    }
    
    console.log('查询停机单最终参数:', queryParams);
    return this.get('/', queryParams);
  }

  /**
   * 获取停机单详情
   * @param {number} id - 停机单ID
   * @returns {Promise<Object>} 停机单详情
   */
  async getDowntime(id) {
    return this.get(`/${id}`)
  }

  /**
   * 创建停机单
   * @param {Object} data - 停机单数据
   * @returns {Promise<Object>} 创建的停机单
   */
  async createDowntime(data) {
    return this.post('/', data)
  }

  /**
   * 更新停机单
   * @param {number} id - 停机单ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<Object>} 更新后的停机单
   */
  async updateDowntime(id, data) {
    return this.put(`/${id}`, data)
  }

  /**
   * 删除停机单
   * @param {number} id - 停机单ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteDowntime(id) {
    return this.delete(`/${id}`)
  }

  /**
   * 获取所有产线列表
   * @returns {Promise<Array>} 产线列表
   */
  async getLines() {
    return this.get('/lines')
  }

  /**
   * 获取所有停机类型
   * @returns {Promise<Array>} 停机类型列表
   */
  async getDowntimeTypes() {
    return this.get('/types')
  }

  /**
   * 获取所有停机原因
   * @param {string} typeCode - 停机类型编码
   * @returns {Promise<Array>} 停机原因列表
   */
  async getDowntimeReasons(typeCode) {
    // 确保typeCode有值，否则设置默认值
    if (!typeCode) {
      typeCode = 'PLANNED';
      console.log('警告: 未提供type_code参数，使用默认值', typeCode);
    }
    
    // 检查typeCode是否是有效的预定义类型之一
    const validTypes = ['PLANNED', 'UNPLANNED', 'MAINTENANCE'];
    if (!validTypes.includes(typeCode)) {
      console.warn(`警告: type_code "${typeCode}" 不是预定义类型之一，使用默认值 PLANNED`);
      typeCode = 'PLANNED';
    }
    
    try {
      // 直接使用内置的GET方法，URL已在构造函数中指定了前缀
      const response = await this.get('/reasons', { type_code: typeCode });
      console.log('获取停机原因成功:', response);
      return response;
    } catch (error) {
      console.error('获取停机原因失败:', error);
      // 返回默认值
      return this._getDefaultReasons(typeCode);
    }
  }
  
  /**
   * 获取默认停机原因（当API请求失败时使用）
   * @private
   * @param {string} typeCode - 停机类型编码
   * @returns {Array} 默认停机原因列表
   */
  _getDefaultReasons(typeCode) {
    const defaultReasons = {
      'PLANNED': [
        { code: 'MAINTENANCE', name: '定期维护' },
        { code: 'ADJUSTMENT', name: '设备调整' },
        { code: 'CHANGEOVER', name: '产品切换' }
      ],
      'UNPLANNED': [
        { code: 'EQUIPMENT', name: '设备故障' },
        { code: 'MATERIAL', name: '材料问题' },
        { code: 'QUALITY', name: '质量问题' },
        { code: 'UTILITY', name: '公共设施故障' }
      ],
      'MAINTENANCE': [
        { code: 'BREAKDOWN', name: '设备损坏' },
        { code: 'INSPECTION', name: '安全检查' },
        { code: 'REPAIR', name: '修复工作' }
      ]
    };
    
    return defaultReasons[typeCode] || defaultReasons['PLANNED'];
  }

  /**
   * 获取停机统计数据
   * @param {Object} params - 统计参数
   * @returns {Promise<Object>} 统计结果
   */
  async getDowntimeStats(params = {}) {
    return this.get('/stats', params)
  }
}

export default new DowntimeService() 