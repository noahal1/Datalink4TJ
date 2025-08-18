import { createApp } from 'vue'
import { pinia } from '@/stores'
import App from './App.vue'
import router from '@/router'
import vuetify from '@/plugins/vuetify'
import services from '@/services'

// 样式导入
import 'remixicon/fonts/remixicon.css'
import '@/styles/transitions.css'
import '@/styles/theme.css'
import '@/styles/unified-theme.css'
import '@/styles/enhanced-components.css'
import '@/styles/dark-theme.css'

// 工具模块
import errorHandler from '@/utils/errorHandler'
import performanceMonitor from '@/utils/performance'
import registerPermissionDirective from '@/directives/permission'
import '@/utils/componentMappingValidator'

// 插件模块
import { setupECharts } from '@/plugins/echarts'
import { registerGlobalComponents } from '@/plugins/globalComponents'
import { setupGlobalNotification } from '@/plugins/notification'
import { initializeApp } from '@/bootstrap/app'

// 初始化ECharts
setupECharts()

// 创建应用实例
const app = createApp(App)

// 安装插件
app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(errorHandler)
app.use(performanceMonitor)

// 注册指令和组件
registerPermissionDirective(app)
registerGlobalComponents(app)

// 全局服务
app.config.globalProperties.$services = services

// 挂载应用
const appInstance = app.mount('#app')

// 设置全局通知系统
setupGlobalNotification(app, appInstance)

// 全局变量
if (window) {
  window.__VUE_APP__ = appInstance
}

// 初始化应用
initializeApp().then(result => {
  if (result.success) {
    console.log('应用启动成功')
  } else {
    console.warn('应用启动部分失败，但核心功能正常')
  }
})    