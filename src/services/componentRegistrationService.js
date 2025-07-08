/**
 * 组件注册服务
 * 负责将前端可用的组件列表注册到后端
 */

import { componentMap } from '../router/dynamic'
import api from '../utils/api'

class ComponentRegistrationService {
  constructor() {
    this.isRegistered = false
    this.registrationPromise = null
  }

  /**
   * 获取所有可用的组件名称
   * @returns {string[]} 组件名称列表
   */
  getAvailableComponents() {
    return Object.keys(componentMap)
  }

  /**
   * 注册组件到后端
   * @returns {Promise<boolean>} 注册是否成功
   */
  async registerComponents() {
    // 如果已经注册过，直接返回成功
    if (this.isRegistered) {
      console.log('🔄 组件已注册，跳过重复注册')
      return true
    }

    // 如果正在注册中，返回现有的Promise
    if (this.registrationPromise) {
      console.log('🔄 组件注册正在进行中，等待完成...')
      return this.registrationPromise
    }

    // 开始注册流程
    this.registrationPromise = this._performRegistration()
    return this.registrationPromise
  }

  /**
   * 执行实际的注册操作
   * @private
   * @returns {Promise<boolean>}
   */
  async _performRegistration() {
    try {
      console.log('🚀 开始注册前端组件到后端...')
      
      const components = this.getAvailableComponents()
      console.log(`📋 准备注册 ${components.length} 个组件:`, components)

      const response = await api.post('/routes/components/register', {
        components: components
      })

      if (response.data && response.data.success) {
        this.isRegistered = true
        console.log('✅ 组件注册成功!')
        console.log(`📊 已注册组件数量: ${response.data.registered_components?.length || components.length}`)
        console.log('📋 已注册组件列表:', response.data.registered_components || components)
        return true
      } else {
        throw new Error('后端返回注册失败')
      }
    } catch (error) {
      console.error('❌ 组件注册失败:', error)
      
      // 如果是网络错误或后端未启动，不阻塞应用启动
      if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
        console.warn('⚠️ 后端服务暂时不可用，组件注册将在后续重试')
        return false
      }
      
      // 其他错误也不阻塞应用
      console.warn('⚠️ 组件注册失败，但不影响应用正常运行')
      return false
    } finally {
      // 清除注册Promise，允许重试
      this.registrationPromise = null
    }
  }

  /**
   * 重置注册状态（用于重试）
   */
  resetRegistration() {
    this.isRegistered = false
    this.registrationPromise = null
    console.log('🔄 组件注册状态已重置')
  }

  /**
   * 验证组件映射表的完整性
   * @returns {Object} 验证结果
   */
  validateComponentMap() {
    const components = this.getAvailableComponents()
    const validation = {
      total: components.length,
      valid: 0,
      invalid: [],
      details: []
    }

    components.forEach(componentName => {
      try {
        const loader = componentMap[componentName]
        if (typeof loader === 'function') {
          validation.valid++
          validation.details.push({
            name: componentName,
            status: 'valid',
            type: 'function'
          })
        } else {
          validation.invalid.push(componentName)
          validation.details.push({
            name: componentName,
            status: 'invalid',
            type: typeof loader,
            error: 'Not a function'
          })
        }
      } catch (error) {
        validation.invalid.push(componentName)
        validation.details.push({
          name: componentName,
          status: 'invalid',
          error: error.message
        })
      }
    })

    return validation
  }

  /**
   * 获取组件注册状态
   * @returns {Object} 注册状态信息
   */
  getRegistrationStatus() {
    return {
      isRegistered: this.isRegistered,
      isRegistering: !!this.registrationPromise,
      availableComponents: this.getAvailableComponents(),
      componentCount: this.getAvailableComponents().length
    }
  }

  /**
   * 自动注册组件（在应用启动时调用）
   * @param {Object} options 选项
   * @param {number} options.retryDelay 重试延迟（毫秒）
   * @param {number} options.maxRetries 最大重试次数
   * @returns {Promise<boolean>}
   */
  async autoRegister(options = {}) {
    const { retryDelay = 5000, maxRetries = 3 } = options
    
    console.log('🔧 开始自动组件注册...')
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 组件注册尝试 ${attempt}/${maxRetries}`)
      
      const success = await this.registerComponents()
      if (success) {
        console.log('🎉 自动组件注册成功!')
        return true
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ ${retryDelay/1000}秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        this.resetRegistration()
      }
    }
    
    console.warn('⚠️ 自动组件注册失败，已达到最大重试次数')
    return false
  }
}

// 创建单例实例
const componentRegistrationService = new ComponentRegistrationService()

export default componentRegistrationService

// 导出类以便测试
export { ComponentRegistrationService }
