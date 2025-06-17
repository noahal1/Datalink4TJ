import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ECharts from 'vue-echarts'
import 'remixicon/fonts/remixicon.css'
import errorHandler from './utils/errorHandler'
import performanceMonitor from './utils/performance'
import registerPermissionDirective from './directives/permission'

// 导入自定义样式
import './styles/transitions.css'
import './styles/theme.css'
// 导入统一设计系统主题
import './styles/unified-theme.css'

// 导入全局通用组件
import GlobalNotification from './components/GlobalNotification.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import PageHeader from './components/PageHeader.vue'
import GlobalSnackbar from './components/GlobalSnackbar.vue'
import UnifiedPageTemplate from './components/UnifiedPageTemplate.vue'
import UnifiedStatsCard from './components/UnifiedStatsCard.vue'
import UnifiedDataTable from './components/UnifiedDataTable.vue'
import UnifiedForm from './components/UnifiedForm.vue'
import PermissionControl from './components/PermissionControl.vue'

// Echarts核心配置
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { LineChart, BarChart } from "echarts/charts"
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
} from "echarts/components"

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
])

// 创建Pinia状态管理实例
const pinia = createPinia()

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// 创建Vuetify实例
const vuetify = createVuetify({
  components,
  directives,
})

// 创建Vue应用
const app = createApp(App)

// 注册插件和全局组件
app.use(pinia) // 必须在router之前，因为router可能依赖pinia中的状态
app.use(router)
app.use(vuetify)

// 注册权限指令
registerPermissionDirective(app)

// 注册全局组件
app.component('v-chart', ECharts);
app.component('GlobalNotification', GlobalNotification);
app.component('LoadingOverlay', LoadingOverlay);
app.component('PageHeader', PageHeader);
app.component('GlobalSnackbar', GlobalSnackbar);
app.component('UnifiedPageTemplate', UnifiedPageTemplate);
app.component('UnifiedStatsCard', UnifiedStatsCard);
app.component('UnifiedDataTable', UnifiedDataTable);
app.component('EnhancedDataTable', UnifiedDataTable);
app.component('StatsCard', UnifiedStatsCard);
app.component('UnifiedForm', UnifiedForm);
app.component('PermissionControl', PermissionControl);

// 注册 RiIcon 组件
app.component('ri-icon', {
  props: {
    icon: {
      type: String,
      required: true
    },
    size: {
      type: [String, Number],
      default: '24px'
    }
  },
  template: `
    <i :class="['ri-' + icon, 'remixicon']" :style="{ fontSize: size }"></i>
  `
});

// 注册全局错误处理器
app.use(errorHandler)

// 注册性能监控工具
app.use(performanceMonitor)

// 挂载应用
const appInstance = app.mount('#app')

// 存储应用实例在window对象上，方便消息通知系统使用
if (window) {
  window.__VUE_APP__ = appInstance;
}

// 全局挂载 $notify
app.config.globalProperties.$notify = {
  show: (msg, type = 'info', timeout = 3000) => {
    appInstance.$refs.globalSnackbar?.show({
      text: msg,
      color: type,
      timeout
    });
  },
  success: (msg, timeout = 3000) => {
    appInstance.$refs.globalSnackbar?.show({
      text: msg,
      color: 'success',
      timeout
    });
  },
  error: (msg, timeout = 3000) => {
    appInstance.$refs.globalSnackbar?.show({
      text: msg,
      color: 'error',
      timeout
    });
  },
  warning: (msg, timeout = 3000) => {
    appInstance.$refs.globalSnackbar?.show({
      text: msg,
      color: 'warning',
      timeout
    });
  },
  info: (msg, timeout = 3000) => {
    appInstance.$refs.globalSnackbar?.show({
      text: msg,
      color: 'info',
      timeout
    });
  }
}

// 注册全局通知组件
app.component('GlobalNotification', GlobalNotification)
app.component('GlobalSnackbar', GlobalSnackbar)

// 提供全局通知组件
app.provide('globalNotification', null) // 将在组件挂载后更新
app.provide('globalSnackbar', null) // 将在组件挂载后更新

// 在应用挂载后更新提供的组件引用
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