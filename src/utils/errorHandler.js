import { ElMessage } from 'element-plus'

/**
 * 全局错误处理器
 */
class ErrorHandler {
  /**
   * 处理全局Vue错误
   * @param {Error} error - 错误对象
   * @param {Vue} vm - Vue实例
   * @param {String} info - 错误信息
   */
  vueErrorHandler(error, vm, info) {
    console.error('Vue错误:', error)
    console.error('组件:', vm)
    console.error('信息:', info)

    // 在生产环境中，可以将错误发送到服务端进行日志记录
    if (import.meta.env.PROD) {
      this.reportErrorToServer({
        type: 'vue',
        error: error.message,
        stack: error.stack,
        info,
        component: vm?.$options?._componentTag || '未知组件'
      })
    }

    // 仅对非HTTP错误(已经在API拦截器中处理过的)显示通知
    if (!error.isAxiosError) {
      ElMessage.error('应用发生错误，请刷新重试')
    }
  }

  /**
   * 处理Promise错误
   * @param {Event} event - 错误事件
   */
  promiseErrorHandler(event) {
    if (event.reason && !event.reason.isAxiosError) {
      console.error('未处理的Promise错误:', event.reason)
      ElMessage.error('操作失败，请刷新重试')
      
      if (import.meta.env.PROD) {
        this.reportErrorToServer({
          type: 'promise',
          error: event.reason?.message || '未知Promise错误',
          stack: event.reason?.stack
        })
      }
    }
  }

  /**
   * 处理全局JS错误
   * @param {Event} event - 错误事件
   */
  windowErrorHandler(event) {
    console.error('全局错误:', event.error)
    
    if (import.meta.env.PROD) {
      this.reportErrorToServer({
        type: 'window',
        message: event.message,
        error: event.error?.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno
      })
    }

    ElMessage.error('应用发生错误，请刷新页面')
  }

  /**
   * 向服务器报告错误
   * @param {Object} errorData - 错误数据
   */
  reportErrorToServer(errorData) {
    // TODO: 实现错误上报逻辑，例如发送到API或使用第三方服务
    // 比如Sentry，LogRocket等
    console.log('向服务器报告错误:', errorData)
  }

  /**
   * 安装全局错误处理
   * @param {Vue} app - Vue应用实例
   */
  install(app) {
    // 处理Vue组件错误
    app.config.errorHandler = this.vueErrorHandler.bind(this)
    
    // 处理Promise错误
    window.addEventListener('unhandledrejection', this.promiseErrorHandler.bind(this))
    
    // 处理JS错误
    window.addEventListener('error', this.windowErrorHandler.bind(this))
  }
}

export default new ErrorHandler() 