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
  
  // 使用事件总线触发snackbar事件
  eventBus.emit('snackbar', {
    message,
    type,
    time: duration
  });
}

// 创建不同类型的消息方法
const Message = {
  success(message, duration = 3000) {
    return showMessage({ message, type: 'success', duration });
  },
  error(message, duration = 3000) {
    return showMessage({ message, type: 'error', duration });
  },
  warning(message, duration = 3000) {
    return showMessage({ message, type: 'warning', duration });
  },
  info(message, duration = 3000) {
    return showMessage({ message, type: 'info', duration });
  },
};

export default Message; 