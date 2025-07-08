import { createApp } from 'vue'
import { pinia } from './stores'
import App from './App.vue'
import router from './router'
import ECharts from 'vue-echarts'
import 'remixicon/fonts/remixicon.css'
import errorHandler from './utils/errorHandler'
import performanceMonitor from './utils/performance'
import registerPermissionDirective from './directives/permission'

import './styles/transitions.css'
import './styles/theme.css'
import './styles/unified-theme.css'

import GlobalNotification from './components/GlobalNotification.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import PageHeader from './components/PageHeader.vue'
import GlobalSnackbar from './components/GlobalSnackbar.vue'
import UnifiedPageTemplate from './components/UnifiedPageTemplate.vue'
import UnifiedStatsCard from './components/UnifiedStatsCard.vue'
import UnifiedDataTable from './components/UnifiedDataTable.vue'
import UnifiedForm from './components/UnifiedForm.vue'
import PermissionControl from './components/PermissionControl.vue'

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

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)
app.use(pinia) 
app.use(router)
app.use(vuetify)


registerPermissionDirective(app)

import { addDynamicRoutes } from './router'
import componentRegistrationService from './services/componentRegistrationService'
import './utils/componentMappingValidator'
import './utils/routeTestHelper'

async function initializeApp() {
  console.log('开始应用初始化...')

  try {
    console.log('步骤1: 注册前端组件到后端...')
    await componentRegistrationService.autoRegister({
      retryDelay: 2000,
      maxRetries: 2
    })

    console.log('步骤2: 加载动态路由...')
    const routes = await addDynamicRoutes()
    console.log(`应用初始化完成! 成功加载 ${routes.length} 个动态路由`)

  } catch (err) {
    console.error('应用初始化过程中出现错误:', err)
    console.log('应用将继续运行，动态路由将在首次访问时延迟加载')
  }
}

initializeApp()

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

app.use(errorHandler)
app.use(performanceMonitor)

import services from './services'

app.config.globalProperties.$services = services

const appInstance = app.mount('#app')
if (window) {
  window.__VUE_APP__ = appInstance;
}

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

app.provide('globalNotification', null) 
app.provide('globalSnackbar', null) 

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