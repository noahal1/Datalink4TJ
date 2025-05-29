import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@mdi/font/css/materialdesignicons.css'
import vuetify from './plugins/vuetify'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import pinia from './stores'
import ECharts from 'vue-echarts'
import 'remixicon/fonts/remixicon.css'
import errorHandler from './utils/errorHandler'
import performanceMonitor from './utils/performance'

// 导入自定义样式
import './styles/transitions.css'
import './styles/theme.css'

// 导入全局通用组件
import GlobalNotification from './components/GlobalNotification.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import EnhancedDataTable from './components/EnhancedDataTable.vue'
import PageHeader from './components/PageHeader.vue'
import StatsCard from './components/StatsCard.vue'

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

const app = createApp(App)

// 注册全局组件
app.component('v-chart', ECharts);
app.component('GlobalNotification', GlobalNotification);
app.component('LoadingOverlay', LoadingOverlay);
app.component('EnhancedDataTable', EnhancedDataTable);
app.component('PageHeader', PageHeader);
app.component('StatsCard', StatsCard);

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

// 添加全局通知到应用根实例
app.config.globalProperties.$notify = {
  show: null,
  success: null,
  error: null,
  warning: null,
  info: null,
  // 实际方法会在应用挂载后设置
}

// 插件注册
app.use(router)
app.use(vuetify)
app.use(ElementPlus)
app.use(pinia)

// 挂载应用
const appInstance = app.mount('#app')

// 设置通知方法引用
app.config.globalProperties.$notify = {
  show: appInstance.$refs.globalNotification?.showNotification,
  success: appInstance.$refs.globalNotification?.success,
  error: appInstance.$refs.globalNotification?.error,
  warning: appInstance.$refs.globalNotification?.warning,
  info: appInstance.$refs.globalNotification?.info
}    