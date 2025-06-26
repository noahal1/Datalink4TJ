import BaseService from '../core/BaseService'

/**
 * 部门服务类
 * 处理部门相关操作
 */
class DepartmentService extends BaseService {
  constructor() {
    // 部门端点
    super('departments')
  }

  /**
   * 获取部门列表
   * @param {object} params - 查询参数
   * @returns {Promise<Array>} - 部门列表
   */
  async getDepartments(params = {}) {
    return this.getAll(params)
  }

  /**
   * 创建新部门
   * @param {object} departmentData - 部门数据
   * @returns {Promise<object>} - 创建的部门
   */
  async createDepartment(departmentData) {
    return this.create(departmentData)
  }

  /**
   * 更新部门
   * @param {string|number} departmentId - 部门ID
   * @param {object} departmentData - 部门数据
   * @returns {Promise<object>} - 更新后的部门
   */
  async updateDepartment(departmentId, departmentData) {
    return this.update(departmentId, departmentData)
  }

  /**
   * 删除部门
   * @param {string|number} departmentId - 部门ID
   * @returns {Promise<boolean>} - 是否成功删除
   */
  async deleteDepartment(departmentId) {
    return this.delete(departmentId)
  }
}

// 创建服务单例
const departmentService = new DepartmentService()
export default departmentService 