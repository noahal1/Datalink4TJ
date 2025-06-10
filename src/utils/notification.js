/**
 * 统一的通知工具
 */
import { eventBus } from './eventBus';

/**
 * 显示通知消息
 * @param {Object} options - 配置选项
 * @param {string} options.message - 消息内容
 * @param {string} options.type - 消息类型: success, error, warning, info
 * @param {number} options.duration - 显示时间(毫秒)
 */
function showMessage(options) {
  if (typeof options === 'string') {
    options = { message: options };
  }
  
  const { message, type = 'info', duration = 3000 } = options;
  
  // 不再通过事件总线触发，避免 SimpleSnackbar 接收到事件
  // eventBus.emit('snackbar', {
  //   message,
  //   type,
  //   time: duration,
  //   location: 'bottom right'
  // });
  
  // 如果可以访问DOM，尝试使用组件引用
  if (window) {
    try {
      // 尝试获取Vuetify的Snackbar组件
      const app = window?.__VUE_APP__;
      if (app && app.$notify) {
        // 使用全局方法显示通知，仅使用常规显示方法（不使用顶部显示）
        app.$notify[type || 'info'](message, duration);
        return;
      }

      // 备选方案：尝试使用window全局对象
      if (window.$snackbar) {
        window.$snackbar.show({
          text: message,
          color: type,
          timeout: duration,
          location: 'bottom right' // 强制使用右下角位置
        });
      }
    } catch (error) {
      console.error('显示通知失败:', error);
    }
  }
}

// 创建不同类型的消息方法
const Message = {
  success(message, duration = 3000) {
    console.log('显示成功消息:', message);
    return showMessage({ message, type: 'success', duration });
  },
  error(message, duration = 3000) {
    console.log('显示错误消息:', message);
    return showMessage({ message, type: 'error', duration });
  },
  warning(message, duration = 3000) {
    console.log('显示警告消息:', message);
    return showMessage({ message, type: 'warning', duration });
  },
  info(message, duration = 3000) {
    console.log('显示信息消息:', message);
    return showMessage({ message, type: 'info', duration });
  }
};

export default Message; 