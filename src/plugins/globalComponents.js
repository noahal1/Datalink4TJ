import GlobalNotification from '@/components/GlobalNotification.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import PageHeader from '@/components/PageHeader.vue'
import GlobalSnackbar from '@/components/GlobalSnackbar.vue'
import UnifiedPageTemplate from '@/components/UnifiedPageTemplate.vue'
import UnifiedStatsCard from '@/components/UnifiedStatsCard.vue'
import UnifiedDataTable from '@/components/UnifiedDataTable.vue'
import UnifiedForm from '@/components/UnifiedForm.vue'
import PermissionControl from '@/components/PermissionControl.vue'
import VChart, { THEME_KEY } from 'vue-echarts'

export function registerGlobalComponents(app) {
  // 注册全局组件
  // 确保ECharts在生产环境中正确初始化
  app.provide(THEME_KEY, 'light')
  app.component('VChart', VChart)
  app.component('GlobalNotification', GlobalNotification)
  app.component('LoadingOverlay', LoadingOverlay)
  app.component('PageHeader', PageHeader)
  app.component('GlobalSnackbar', GlobalSnackbar)
  app.component('UnifiedPageTemplate', UnifiedPageTemplate)
  app.component('UnifiedStatsCard', UnifiedStatsCard)
  app.component('UnifiedDataTable', UnifiedDataTable)
  app.component('UnifiedForm', UnifiedForm)
  app.component('PermissionControl', PermissionControl)
  
  // RemixIcon组件
  app.component('RiIcon', {
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
  })
}