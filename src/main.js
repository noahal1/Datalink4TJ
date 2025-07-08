import { createApp } from 'vue'
import { pinia } from './stores'
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
import { LineChart, BarChart, RadarChart } from "echarts/charts"
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
  RadarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
])

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

// 导入动态路由加载函数
import { addDynamicRoutes } from './router'

// 导入组件注册服务
import componentRegistrationService from './services/componentRegistrationService'

// 导入组件映射验证器（仅在开发环境中运行）
import './utils/componentMappingValidator'

// 导入路由测试工具（仅在开发环境中运行）
import './utils/routeTestHelper'

// 应用启动时的初始化流程
async function initializeApp() {
  console.log('🚀 开始应用初始化...')

  try {
    // 1. 首先注册组件到后端
    console.log('📋 步骤1: 注册前端组件到后端...')
    await componentRegistrationService.autoRegister({
      retryDelay: 2000,
      maxRetries: 2
    })

    // 2. 然后加载动态路由
    console.log('🛣️ 步骤2: 加载动态路由...')
    const routes = await addDynamicRoutes()
    console.log(`🎉 应用初始化完成! 成功加载 ${routes.length} 个动态路由`)

  } catch (err) {
    console.error('❌ 应用初始化过程中出现错误:', err)
    console.log('💡 应用将继续运行，动态路由将在首次访问时延迟加载')
  }
}

// 启动初始化流程
initializeApp()

// 注册全局组件
app.component('v-chart', ECharts);
app.component('GlobalNotification', GlobalNotification);
app.component('LoadingOverlay', LoadingOverlay);
app.component('PageHeader', PageHeader);
app.component('GlobalSnackbar', GlobalSnackbar);
app.component('UnifiedPageTemplate', UnifiedPageTemplate);
app.component('UnifiedStatsCard', UnifiedStatsCard);
app.component('UnifiedDataTable', UnifiedDataTable);
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

// 导入服务层
import services from './services'

// 添加全局属性，使服务层在所有组件中可用
app.config.globalProperties.$services = services

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