import Message from './notification'
import api from './api'

/**
 * 全局错误处理器
 */
class ErrorHandler {
  constructor() {
    this.lastErrorTime = 0;
    this.errorThreshold = 3000; // 3秒内不重复显示错误
    this.isProduction = import.meta.env.PROD;
    this.debugMode = !this.isProduction && import.meta.env.VITE_DEBUG_ERRORS === 'true';
  }

  /**
   * 节流函数，防止短时间内显示多个错误通知
   * @param {string} message - 错误消息
   */
  throttledErrorMessage(message = '应用发生错误，请刷新页面') {
    const now = Date.now();
    if (now - this.lastErrorTime > this.errorThreshold) {
      this.lastErrorTime = now;
      Message.error(message);
    }
  }

  /**
   * 处理全局Vue错误
   * @param {Error} error - 错误对象
   * @param {Vue} vm - Vue实例
   * @param {String} info - 错误信息
   */
  vueErrorHandler(error, vm, info) {
    // 记录错误到控制台（仅在非生产环境）
    if (!this.isProduction || this.debugMode) {
      console.error('Vue错误:', error);
      console.error('组件:', vm?.$options?._componentTag || '未知组件');
      console.error('信息:', info);
    }

    // 在生产环境中，将错误发送到服务端进行日志记录
    if (this.isProduction) {
      this.reportErrorToServer({
        type: 'vue',
        error: error.message,
        stack: error.stack,
        info,
        component: vm?.$options?._componentTag || '未知组件',
        url: window.location.href
      });
    }

    // 仅对非HTTP错误(已经在API拦截器中处理过的)显示通知
    if (!error.isAxiosError) {
      this.throttledErrorMessage('组件渲染错误，请刷新页面');
    }
  }

  /**
   * 处理Promise错误
   * @param {Event} event - 错误事件
   */
  promiseErrorHandler(event) {
    // 忽略已处理的API错误
    if (event.reason && !event.reason.isAxiosError) {
      // 记录错误到控制台（仅在非生产环境）
      if (!this.isProduction || this.debugMode) {
        console.error('Promise错误:', event.reason);
      }

      if (this.isProduction) {
        this.reportErrorToServer({
          type: 'promise',
          error: event.reason?.message || '未知Promise错误',
          stack: event.reason?.stack,
          url: window.location.href
        });
      }
      
      this.throttledErrorMessage('操作失败，请刷新重试');
    }
  }

  /**
   * 处理全局JS错误
   * @param {Event} event - 错误事件
   */
  windowErrorHandler(event) {
    // 检查event和error是否存在，避免null错误
    if (!event) return;
    
    // 忽略某些第三方脚本错误和跨域错误
    if (event.message && (
      event.message.includes('Script error') || 
      event.message.includes('ResizeObserver loop') ||
      event.message.includes('ChunkLoadError')
    )) {
      return;
    }
    
    // 记录错误到控制台（仅在非生产环境）
    if (!this.isProduction || this.debugMode) {
      console.error('JS错误:', event);
    }

    if (this.isProduction) {
      this.reportErrorToServer({
        type: 'window',
        message: event.message,
        error: event.error?.message || '未知错误',
        stack: event.error?.stack || new Error().stack,
        source: event.filename || 'unknown',
        line: event.lineno || 0,
        column: event.colno || 0,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }

    // 避免对用户显示过多的错误通知
    this.throttledErrorMessage();
  }

  /**
   * 向服务器报告错误
   * @param {Object} errorData - 错误数据
   */
  reportErrorToServer(errorData) {
    try {
      // 添加客户端信息
      const enhancedErrorData = {
        ...errorData,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
        appVersion: import.meta.env.VITE_APP_VERSION || '未知'
      };
      
      // 发送错误到后端API
      api.post('/logs/client-error', enhancedErrorData)
        .catch(e => {
          // 错误上报失败，静默处理
          if (this.debugMode) {
            console.warn('错误上报失败:', e);
          }
        });
    } catch (e) {
      // 错误上报过程出错，静默处理
      if (this.debugMode) {
        console.warn('错误上报过程出错:', e);
      }
    }
  }

  /**
   * 安装全局错误处理
   * @param {Vue} app - Vue应用实例
   */
  install(app) {
    // 处理Vue组件错误
    app.config.errorHandler = this.vueErrorHandler.bind(this);
    
    // 处理Promise错误
    window.addEventListener('unhandledrejection', this.promiseErrorHandler.bind(this));
    
    // 处理JS错误
    window.addEventListener('error', this.windowErrorHandler.bind(this));
    
    if (this.debugMode) {
      console.log('全局错误处理器已启用');
    }
  }
}

export default new ErrorHandler(); 