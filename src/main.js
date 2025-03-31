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

// 正确注册组件的方式
app.component('v-chart', ECharts);
// 注册 RiIcon 组件
app.component('ri-icon')                                                         ;

// 插件注册
app.use(router)
app.use(vuetify)
app.use(ElementPlus)
app.use(pinia)

app.mount('#app')    