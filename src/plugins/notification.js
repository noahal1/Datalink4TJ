export function setupGlobalNotification(app, appInstance) {
  // 全局通知系统
  app.config.globalProperties.$notify = {
    show: (msg, type = 'info', timeout = 3000) => {
      appInstance.$refs.globalSnackbar?.show({
        text: msg,
        color: type,
        timeout
      })
    },
    success: (msg, timeout = 3000) => {
      appInstance.$refs.globalSnackbar?.show({
        text: msg,
        color: 'success',
        timeout
      })
    },
    error: (msg, timeout = 3000) => {
      appInstance.$refs.globalSnackbar?.show({
        text: msg,
        color: 'error',
        timeout
      })
    },
    warning: (msg, timeout = 3000) => {
      appInstance.$refs.globalSnackbar?.show({
        text: msg,
        color: 'warning',
        timeout
      })
    },
    info: (msg, timeout = 3000) => {
      appInstance.$refs.globalSnackbar?.show({
        text: msg,
        color: 'info',
        timeout
      })
    }
  }

  // 提供全局组件引用
  app.provide('globalNotification', null)
  app.provide('globalSnackbar', null)

  // 更新全局组件引用的方法
  app.config.globalProperties.$updateGlobalComponents = () => {
    const notification = document.querySelector('.global-notification')?.__vueParentComponent?.ctx
    const snackbar = document.querySelector('.global-snackbar')?.__vueParentComponent?.ctx
    
    if (notification) {
      app._context.provides.globalNotification = notification
    }
    
    if (snackbar) {
      app._context.provides.globalSnackbar = snackbar
    }
  }
}