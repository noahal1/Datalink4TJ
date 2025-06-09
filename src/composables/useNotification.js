import { inject } from 'vue'

/**
 * 通知工具composable
 * 提供全局通知和消息提示功能
 */
export function useNotification() {
  // 注入全局通知组件
  const globalNotification = inject('globalNotification')
  const globalSnackbar = inject('globalSnackbar')
  
  /**
   * 显示成功通知
   * @param {string} message 通知消息
   * @param {number} timeout 显示时间，默认3000ms
   */
  const showSuccess = (message, timeout = 3000) => {
    if (globalSnackbar) {
      globalSnackbar.show({
        text: message,
        color: 'success',
        timeout
      })
    } else {
      console.warn('全局通知组件未注册')
    }
  }
  
  /**
   * 显示错误通知
   * @param {string} message 通知消息
   * @param {number} timeout 显示时间，默认5000ms
   */
  const showError = (message, timeout = 5000) => {
    if (globalSnackbar) {
      globalSnackbar.show({
        text: message,
        color: 'error',
        timeout
      })
    } else {
      console.error('全局通知组件未注册')
    }
  }
  
  /**
   * 显示警告通知
   * @param {string} message 通知消息
   * @param {number} timeout 显示时间，默认4000ms
   */
  const showWarning = (message, timeout = 4000) => {
    if (globalSnackbar) {
      globalSnackbar.show({
        text: message,
        color: 'warning',
        timeout
      })
    } else {
      console.warn('全局通知组件未注册')
    }
  }
  
  /**
   * 显示信息通知
   * @param {string} message 通知消息
   * @param {number} timeout 显示时间，默认3000ms
   */
  const showInfo = (message, timeout = 3000) => {
    if (globalSnackbar) {
      globalSnackbar.show({
        text: message,
        color: 'info',
        timeout
      })
    } else {
      console.warn('全局通知组件未注册')
    }
  }
  
  /**
   * 显示确认对话框
   * @param {Object} options 配置选项
   * @param {string} options.title 标题
   * @param {string} options.message 消息内容
   * @param {string} options.confirmText 确认按钮文本
   * @param {string} options.cancelText 取消按钮文本
   * @returns {Promise<boolean>} 用户选择结果
   */
  const showConfirm = (options) => {
    if (globalNotification) {
      return globalNotification.confirm(options)
    } else {
      console.error('全局通知组件未注册')
      return Promise.reject(new Error('全局通知组件未注册'))
    }
  }
  
  /**
   * 显示警告确认对话框
   * @param {Object} options 配置选项
   * @param {string} options.title 标题
   * @param {string} options.message 消息内容
   * @param {string} options.confirmText 确认按钮文本
   * @param {string} options.cancelText 取消按钮文本
   * @returns {Promise<boolean>} 用户选择结果
   */
  const showWarningConfirm = (options) => {
    if (globalNotification) {
      return globalNotification.confirm({
        ...options,
        type: 'warning'
      })
    } else {
      console.error('全局通知组件未注册')
      return Promise.reject(new Error('全局通知组件未注册'))
    }
  }
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showWarningConfirm
  }
} 