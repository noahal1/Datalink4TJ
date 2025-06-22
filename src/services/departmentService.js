import BaseApiService from './apiService'

/**
 * 部门服务类
 * 处理与部门相关的API调用
 */
class DepartmentService extends BaseApiService {
  constructor() {
    super('/department')
  }

  /**
   * 获取部门列表
   * @param {object} params - 查询参数
   * @returns {Promise} - 部门列表
   */
  async getDepartments(params = {}) {
    return this.get('', params)
  }

  /**
   * 获取部门详情
   * @param {number} departmentId - 部门ID
   * @returns {Promise} - 部门详情
   */
  async getDepartment(departmentId) {
    return this.get(`/${departmentId}`)
  }

  /**
   * 创建部门
   * @param {object} departmentData - 部门数据
   * @returns {Promise} - 创建结果
   */
  async createDepartment(departmentData) {
    return this.post('', departmentData)
  }

  /**
   * 更新部门
   * @param {number} departmentId - 部门ID
   * @param {object} departmentData - 部门数据
   * @returns {Promise} - 更新结果
   */
  async updateDepartment(departmentId, departmentData) {
    return this.put(`/${departmentId}`, departmentData)
  }

  /**
   * 删除部门
   * @param {number} departmentId - 部门ID
   * @returns {Promise} - 删除结果
   */
  async deleteDepartment(departmentId) {
    return this.delete(`/${departmentId}`)
  }

  /**
   * 获取部门用户
   * @param {number} departmentId - 部门ID
   * @param {object} params - 查询参数
   * @returns {Promise} - 部门用户列表
   */
  async getDepartmentUsers(departmentId, params = {}) {
    return this.get(`/${departmentId}/users`, params)
  }

  /**
   * 获取部门树结构
   * @returns {Promise} - 部门树结构
   */
  async getDepartmentTree() {
    return this.get('/tree')
  }
}

// 创建并导出单例实例
export default new DepartmentService() 