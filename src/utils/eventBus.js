// 创建事件总线对象
const eventBus = {
  events: {},
  
  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // 返回取消订阅的函数
    return () => this.off(event, callback);
  },
  
  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} payload - 传递的数据
   */
  emit(event, payload) {
    console.log(`[EventBus] 触发事件: ${event}`, payload);
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[EventBus] 事件处理器错误:`, error);
        }
      });
    }
  },
  
  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 不传则移除该事件的所有监听器
   */
  off(event, callback) {
    if (this.events[event]) {
      if (callback) {
        this.events[event] = this.events[event].filter(cb => cb !== callback);
      } else {
        delete this.events[event];
      }
    }
  },
  
  /**
   * 只监听一次事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const onceCallback = (payload) => {
      callback(payload);
      this.off(event, onceCallback);
    };
    
    this.on(event, onceCallback);
  }
};

export { eventBus }; 