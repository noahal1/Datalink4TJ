import BaseApiService from './apiService'

/**
 * 权限服务类
 * 处理与权限和角色相关的API调用
 */
class PermissionService extends BaseApiService {
  constructor() {
    // 不设置特定的基础路径，因为需要调用不同的基础路径
    super('')
  }

  /**
   * 获取权限列表
   * @param {object} params - 查询参数
   * @returns {Promise} - 权限列表
   */
  async getPermissions(params = {}) {
    return this.get('/permissions', params)
  }

  /**
   * 获取权限详情
   * @param {number} permissionId - 权限ID
   * @returns {Promise} - 权限详情
   */
  async getPermission(permissionId) {
    return this.get(`/permissions/${permissionId}`)
  }

  /**
   * 创建权限
   * @param {object} permissionData - 权限数据
   * @returns {Promise} - 创建结果
   */
  async createPermission(permissionData) {
    return this.post('/permissions', permissionData)
  }

  /**
   * 更新权限
   * @param {number} permissionId - 权限ID
   * @param {object} permissionData - 权限数据
   * @returns {Promise} - 更新结果
   */
  async updatePermission(permissionId, permissionData) {
    return this.put(`/permissions/${permissionId}`, permissionData)
  }

  /**
   * 删除权限
   * @param {number} permissionId - 权限ID
   * @returns {Promise} - 删除结果
   */
  async deletePermission(permissionId) {
    return this.delete(`/permissions/${permissionId}`)
  }

  /**
   * 获取角色列表
   * @param {object} params - 查询参数
   * @returns {Promise} - 角色列表
   */
  async getRoles(params = {}) {
    return this.get('/roles', params)
  }

  /**
   * 获取简化的角色列表
   * @returns {Promise} - 简化的角色列表
   */
  async getSimpleRoles() {
    return this.get('/simple-roles')
  }

  /**
   * 获取角色详情
   * @param {number} roleId - 角色ID
   * @returns {Promise} - 角色详情
   */
  async getRole(roleId) {
    return this.get(`/roles/${roleId}`)
  }

  /**
   * 创建角色
   * @param {object} roleData - 角色数据
   * @returns {Promise} - 创建结果
   */
  async createRole(roleData) {
    return this.post('/roles', roleData)
  }

  /**
   * 更新角色
   * @param {number} roleId - 角色ID
   * @param {object} roleData - 角色数据
   * @returns {Promise} - 更新结果
   */
  async updateRole(roleId, roleData) {
    return this.put(`/roles/${roleId}`, roleData)
  }

  /**
   * 删除角色
   * @param {number} roleId - 角色ID
   * @returns {Promise} - 删除结果
   */
  async deleteRole(roleId) {
    return this.delete(`/roles/${roleId}`)
  }

  /**
   * 为角色分配权限
   * @param {number} roleId - 角色ID
   * @param {Array<number>} permissionIds - 权限ID数组
   * @returns {Promise} - 操作结果
   */
  async assignRolePermissions(roleId, permissionIds) {
    return this.post(`/roles/${roleId}/permissions`, permissionIds)
  }

  /**
   * 为用户分配角色
   * @param {number} userId - 用户ID
   * @param {object} assignment - 角色分配数据，包含角色ID数组
   * @returns {Promise} - 操作结果
   */
  async assignUserRoles(userId, assignment) {
    return this.post(`/users/${userId}/roles`, assignment)
  }

  /**
   * 检查当前用户权限
   * @param {object} permissionCheck - 权限检查数据
   * @returns {Promise} - 检查结果
   */
  async checkPermission(permissionCheck) {
    return this.post('/check-permission', permissionCheck)
  }

  /**
   * 获取路由权限列表
   * @param {object} params - 查询参数，可包含route_id和role_id
   * @returns {Promise} - 路由权限列表
   */
  async getRoutePermissions(params = {}) {
    return this.get('/route-permissions', params)
  }

  /**
   * 创建路由权限
   * @param {object} routePermission - 路由权限数据
   * @returns {Promise} - 创建结果
   */
  async createRoutePermission(routePermission) {
    return this.post('/route-permissions', routePermission)
  }

  /**
   * 检查特定权限代码
   * @param {string} permissionCode - 权限代码
   * @returns {Promise<boolean>} - 是否有权限
   */
  async checkPermissionCode(permissionCode) {
    try {
      const result = await this.get(`/check-permission-code/${permissionCode}`)
      return result.has_permission
    } catch (error) {
      console.error(`检查权限代码 ${permissionCode} 失败:`, error)
      return false
    }
  }

  /**
   * 获取当前用户的所有权限代码
   * @returns {Promise<string[]>} - 权限代码列表
   */
  async getUserPermissionCodes() {
    try {
      return this.get('/user-permission-codes')
    } catch (error) {
      console.error('获取用户权限代码失败:', error)
      return []
    }
  }

  /**
   * 获取当前用户的权限信息
   * @returns {Promise} - 用户权限信息
   */
  async getUserPermissions() {
    try {
      // 使用正确的API端点
      return this.get('/users/permissions');
    } catch (error) {
      console.error('获取用户权限信息失败:', error);
      // 返回默认的空权限
      return {
        roles: [],
        permission_codes: [],
        permissions: [],
        has_qa_read: false
      };
    }
  }

  /**
   * 获取用户可访问的路由列表
   * @returns {Promise} - 路由列表
   */
  async getUserRoutes() {
    try {
      // 使用正确的API端点
      return this.get('/user-routes');
    } catch (error) {
      console.error('获取路由列表失败:', error);
      // 返回空数组作为默认值
      return [];
    }
  }
}

// 创建并导出单例实例
export default new PermissionService() 