<script setup>
// 核心导入
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useActivityStore } from '../stores/activity'
import DashboardUpcomingEvents from '../components/DashboardUpcomingEvents.vue'
import RecentActivities from '../components/RecentActivities.vue'
import Message from '../utils/notification'
import api from '../utils/api'

// Store和基础配置
const userStore = useUserStore()
const activityStore = useActivityStore()
const currentMonth = new Date().getMonth() + 1

// 响应式数据
const isLoading = ref(false)
const selectedPeriod = ref('month')
const qualityData = ref([])
const trendData = ref(null)

// 加载状态
const loadingStates = ref({
   quality: false,
   trend: false
})

// 统计字段配置
const FIELD_CONFIGS = {
   standard: ['swi', 'rwh', 'w01', 'hf', 'lc'],
   scrap: ['scrapswi', 'scraprwh', 'scrapw01', 'scraphf', 'scraplc']
}

// 模拟数据生成器
const createMockTrendData = () => ({
   legend: ['生产', '质量', 'EHS'],
   xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
   series: [
     { name: '生产', type: 'line', data: [120, 132, 101, 134, 90, 230, 210] },
     { name: '质量', type: 'line', data: [220, 182, 191, 234, 290, 330, 310] },
     { name: 'EHS', type: 'line', data: [15, 12, 11, 14, 9, 23, 21] }
   ]
})

// 通用API调用包装器
const handleApiCall = async (apiCall, errorMsg, mockData = null) => {
   try {
     const response = await apiCall()
     return response?.data || mockData
   } catch (error) {
     console.error(errorMsg, error)
     Message.error(`${errorMsg}: ${error.message || '未知错误'}`)
     return mockData
   }
}

// 获取趋势数据
const fetchTrendData = async (period = 'month') => {
   loadingStates.value.trend = true
   try {
     const response = await api.get('/dashboard/trend', { period })
     trendData.value = response?.data || createMockTrendData()
   } catch (error) {
     console.error('获取趋势数据失败:', error)
     trendData.value = createMockTrendData()
   } finally {
     loadingStates.value.trend = false
   }
}

// 获取质量数据
const fetchQualityData = async () => {
   loadingStates.value.quality = true

   const response = await handleApiCall(
     () => api.get('/qa/', { params: { month: currentMonth.toString() } }),
     '获取质量数据失败'
   )

   if (response) {
     const daysInMonth = new Date(new Date().getFullYear(), currentMonth, 0).getDate()
     const generatedData = Array.from({ length: daysInMonth }, (_, i) => ({
       date: (i + 1).toString(),
       ...Object.fromEntries([...FIELD_CONFIGS.standard, ...FIELD_CONFIGS.scrap].map(field => [field, 0])),
       welding: 0,
       stamping: 0
     }))

     response.forEach(item => {
       const day = generatedData.find(d => d.date === item.day)
       if (day) {
         const line = item.line.toLowerCase()
         const field = item.scrapflag ? `scrap${line}` : line
         day[field] = parseInt(item.value, 10)
         day.welding = day.swi + day.rwh + day.w01
         day.stamping = day.hf + day.lc
       }
     })

     qualityData.value = generatedData
   }

   loadingStates.value.quality = false
}

// 统计计算函数
const calculateTotal = (field) => computed(() =>
   qualityData.value.reduce((sum, item) => sum + (item[field] || 0), 0)
)

const calculateScrapTotal = () => computed(() =>
   qualityData.value.reduce((sum, item) =>
     sum + FIELD_CONFIGS.scrap.reduce((fieldSum, field) =>
       fieldSum + (parseInt(item[field]) || 0), 0), 0)
)

// 计算属性
const totalWelding = calculateTotal('welding')
const totalStamping = calculateTotal('stamping')
const totalGP12 = computed(() => totalWelding.value + totalStamping.value)
const totalScrap = calculateScrapTotal()

const scrapRate = computed(() => {
   if (totalGP12.value === 0) return "0.00"
   const rate = (totalScrap.value / (totalGP12.value + totalScrap.value)) * 100
   return rate.toFixed(2)
})

// 图表配置
const chartOption = computed(() => ({
   tooltip: { trigger: 'axis' },
   legend: { data: trendData.value?.legend || ['生产', '质量', 'EHS'] },
   grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
   xAxis: {
     type: 'category',
     boundaryGap: false,
     data: trendData.value?.xAxis || []
   },
   yAxis: { type: 'value' },
   series: trendData.value?.series || []
}))

// 统计卡片数据
const statsCards = [
   { title: '生产计划完成率', value: '94.5%', icon: 'mdi-chart-line', color: 'success', change: '+2.5%' },
   { title: '质量合格率', value: '99.2%', icon: 'mdi-check-circle', color: 'primary', change: '+0.3%' },
   { title: '设备稼动率', value: '87.8%', icon: 'mdi-cog', color: 'warning', change: '-1.2%' },
   { title: '安全无事故天数', value: '128', icon: 'mdi-shield-check', color: 'info', change: '+1' }
]

// 事件处理
const handlePeriodChange = (period) => {
   selectedPeriod.value = period
   fetchTrendData(period)
}

const refreshAllData = async () => {
   isLoading.value = true
   try {
     await Promise.all([
       fetchQualityData(),
       fetchTrendData(selectedPeriod.value),
       activityStore.fetchActivities()
     ])
     Message.success('数据刷新成功')
   } catch (error) {
     Message.error('数据刷新失败: ' + (error.message || '未知错误'))
   } finally {
     isLoading.value = false
   }
}

// 生命周期
onMounted(async () => {
   console.log('Dashboard loaded')
   await Promise.all([
     fetchQualityData(),
     fetchTrendData('month'),
     activityStore.fetchActivities()
   ])
})
</script>

<template>
  <unified-page-template
    title="仪表盘"
    icon="mdi-view-dashboard"
    color="primary"
    :show-breadcrumbs="false"
    class="dashboard-template"
  >
    <template #header-actions>
      <!-- 刷新按钮 -->
      <v-btn
        prepend-icon="mdi-refresh"
        variant="outlined"
        :disabled="isLoading"
        :loading="isLoading"
        class="mr-2 refresh-btn"
        color="primary"
        @click="refreshAllData"
      >
        刷新数据
      </v-btn>

      <!-- 今日数据按钮 -->
      <v-btn
        prepend-icon="mdi-calendar-today"
        color="primary"
        variant="elevated"
        class="today-btn"
      >
        今日数据
      </v-btn>
    </template>
    
    <!-- 加载指示器 -->
    <loading-overlay
      :loading="isLoading"
      message="加载数据中..."
    />
    
    <v-row class="fill-height">
      <!-- 左侧面板 -->
      <v-col
        cols="12"
        md="8"
        order="4"
        order-md="1"
        class="d-flex flex-column"
      >
        <!-- 统计卡片 -->
        <v-row class="match-height">
          <v-col
            v-for="card in statsCards"
            :key="card.title"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <unified-stats-card
              :title="card.title"
              :value="card.value"
              :icon="card.icon"
              :color="card.color"
              :change="card.change"
              show-change
              show-progress
              elevation="1"
              class="h-100"
            />
          </v-col>
        </v-row>
        
        <!-- 图表区域 -->
        <v-row class="mt-4">
          <v-col cols="12">
            <unified-data-table
              title="数据趋势"
              hide-default-footer
              icon="mdi-chart-line"
              no-padding
            >
              <template #actions>
                <v-btn-toggle 
                  v-model="selectedPeriod" 
                  density="comfortable"
                  variant="outlined"
                  rounded="lg"
                  class="pt-1"
                  @update:model-value="handlePeriodChange"
                >
                  <v-btn value="day">
                    日
                  </v-btn>
                  <v-btn value="week">
                    周
                  </v-btn>
                  <v-btn
                    value="month"
                    selected
                  >
                    月
                  </v-btn>
                  <v-btn value="year">
                    年
                  </v-btn>
                </v-btn-toggle>
              </template>
              
              <loading-overlay :loading="isLoadingTrendData" />
              <v-chart
                class="chart"
                :option="chartOption"
                autoresize
              />
            </unified-data-table>
          </v-col>
        </v-row>
        
        <!-- 质量数据总览 -->
        <v-row class="mt-4">
          <v-col cols="12">
            <unified-data-table
              title="质量数据总览"
              icon="mdi-chart-areaspline"
              hide-default-footer
              content-class="data-overview"
            >
              <template #actions>
                <v-spacer />
                <v-btn
                  variant="text"
                  size="small"
                  to="/quality"
                  color="primary"
                >
                  查看详情
                  <v-icon end>
                    mdi-chevron-right
                  </v-icon>
                </v-btn>
              </template>
              
              <loading-overlay :loading="isLoadingQualityData" />
              
                <v-row class="quality-stats-row g-1">
                  <v-col
                    cols="12"
                    sm="6"
                    md="3"
                  >
                    <unified-stats-card
                      title="本月焊接GP12总数"
                      :value="totalWelding"
                      icon="mdi-chart-line"
                      color="primary"
                      subtitle="SWI, RWH, W01"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="3"
                  >
                    <unified-stats-card
                      title="本月冲压GP12总数"
                      :value="totalStamping"
                      icon="mdi-stamper"
                      color="secondary"
                      subtitle="HF, LC"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="3"
                  >
                    <unified-stats-card
                      title="报废率"
                      :value="scrapRate + '%'"
                      icon="mdi-recycle"
                      color="error"
                      subtitle="本月累计"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="3"
                  >
                    <unified-stats-card
                      title="本月GP12总数"
                      :value="totalGP12"
                      icon="mdi-package-variant"
                      color="success"
                      subtitle="所有生产线"
                    />
                  </v-col>
                </v-row>
            </unified-data-table>
          </v-col>
        </v-row>
        
        <!-- 最近活动 -->
        <v-row class="mt-4 flex-grow-1">
          <v-col
            cols="12"
            class="d-flex"
          >
            <recent-activities 
              title="最近活动"
              :limit="5"
              auto-refresh
              :refresh-interval="120000"
              class="flex-grow-1"
            />
          </v-col>
        </v-row>
      </v-col>
      
      <!-- 右侧面板 -->
      <v-col
        cols="12"
        md="4"
        lg="4"
        order="1"
        order-md="2"
        class="d-flex flex-column"
      >
        <!-- 即将开始的重要事件 -->
        <div class="mb-4">
          <dashboard-upcoming-events :limit="5" />
        </div>
        
        <!-- 系统公告 -->
        <unified-data-table
          title="系统公告"
          icon="mdi-bullhorn"
          :headers="[]"
          :items="[1, 2]"
          hide-default-footer
          :loading="false"
          hide-no-data
        >
          <template #pre-table>
            <div class="pa-4">
              <v-alert
                color="info"
                icon="mdi-information"
                title="系统更新"
                text="数据上报系统将不定时进行例行维护，维护时间为上午10点至中午12点。"
                variant="tonal"
                class="mb-4"
                border="start"
                density="comfortable"
              />
              
              <v-alert
                color="success"
                icon="mdi-check-circle"
                title="质量模块更新"
                text="如果在使用过程中遇到任何bug或疑问，请联系管理员noah.yin@magna.com。"
                variant="tonal"
                border="start"
                density="comfortable"
              />
            </div>
          </template>
        </unified-data-table>
      </v-col>
    </v-row>
  </unified-page-template>
</template>

<style scoped>
/* CSS变量定义 */
:root {
   --primary-gradient: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
   --primary-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(59, 130, 246, 0.1);
   --primary-shadow-hover: 0 16px 48px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(59, 130, 246, 0.15);
   --dark-gradient: linear-gradient(135deg, rgba(44, 44, 44, 0.95) 0%, rgba(30, 30, 30, 0.9) 100%);
   --dark-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(33, 150, 243, 0.1);
   --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
   --border-radius: 16px;
   --glass-bg: rgba(255, 255, 255, 0.8);
   --glass-border: rgba(255, 255, 255, 0.3);
   --shimmer-bg: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
}

/* 动画定义 */
@keyframes fadeInUp {
   from { opacity: 0; transform: translateY(30px); }
   to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUpScale {
   from { opacity: 0; transform: translateY(30px) scale(0.95); }
   to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes shimmer {
   0% { transform: translateX(-100%); }
   100% { transform: translateX(100%); }
}

/* 工具类 */
.fill-height { flex: 1; min-height: 0; }
.h-100 { height: 100%; }

/* 玻璃态容器 */
.glass-card {
   background: var(--primary-gradient);
   backdrop-filter: blur(20px);
   border: 1px solid var(--glass-border);
   border-radius: var(--border-radius);
   transition: var(--transition);
}

.glass-card:hover {
   transform: translateY(-4px);
   box-shadow: var(--primary-shadow-hover), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 图表样式 */
.chart {
   height: clamp(260px, 42vh, 460px);
   width: 100%;
   border-radius: var(--border-radius);
   overflow: hidden;
   @extend .glass-card;
   box-shadow: var(--primary-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.6);
   position: relative;
}

/* 统计卡片布局 */
.match-height {
   display: flex;
   flex-wrap: wrap;
   margin-bottom: 12px;
}

.match-height .v-col {
   display: flex;
   animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
   transform-origin: bottom;
}

.match-height .v-col:nth-child(1) { animation-delay: 0.1s; animation-name: fadeInUpScale; }
.match-height .v-col:nth-child(2) { animation-delay: 0.2s; animation-name: fadeInUpScale; }
.match-height .v-col:nth-child(3) { animation-delay: 0.3s; animation-name: fadeInUpScale; }
.match-height .v-col:nth-child(4) { animation-delay: 0.4s; animation-name: fadeInUpScale; }

/* 列表项样式 */
:deep(.v-list-item) {
   min-height: 60px;
   border-radius: var(--border-radius);
   margin: 8px 0;
   transition: var(--transition);
   background: var(--primary-gradient);
   backdrop-filter: blur(20px);
   border: 1px solid var(--glass-border);
   position: relative;
   overflow: hidden;
}

:deep(.v-list-item)::before {
   content: '';
   position: absolute;
   top: 0;
   left: -100%;
   width: 100%;
   height: 100%;
   background: var(--shimmer-bg);
   transition: left 0.6s ease;
}

:deep(.v-list-item:hover) {
   transform: translateX(12px) translateY(-2px);
   box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(59, 130, 246, 0.2);
   border-color: rgba(59, 130, 246, 0.3);
}

:deep(.v-list-item:hover)::before {
   left: 100%;
}

/* 简化的工具类 */
.quick-link-item {
   transition: var(--transition);
   position: relative;
}

.quick-link-item:hover {
   background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.12) 0%, rgba(var(--v-theme-primary), 0.06) 100%);
}

/* 质量总览容器 */
.quality-overview-wrapper {
   width: 100%;
   padding: 24px;
   @extend .glass-card;
   box-shadow: var(--primary-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.6);
   position: relative;
}

.quality-overview-wrapper::before {
   content: '';
   position: absolute;
   top: 0;
   left: 0;
   right: 0;
   height: 2px;
   background: linear-gradient(90deg, var(--primary-500, #3b82f6) 0%, var(--secondary-500, #6366f1) 50%, var(--primary-500, #3b82f6) 100%);
   border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.quality-stats-row {
   margin: 0;
   width: 100%;
}

/* 数据表格样式 */
:deep(.unified-data-table) {
   @extend .glass-card;
   box-shadow: var(--primary-shadow), 0 4px 16px rgba(59, 130, 246, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6);
   transition: var(--transition);
   position: relative;
   overflow: hidden;
}

:deep(.unified-data-table:not(.doh-table):not(.master-data-table):not(.quality-kpi-table):not(.production-kpi-table):not(.ehs-kpi-table):not(.logistics-kpi-table):hover) {
   transform: translateY(-4px);
   box-shadow: var(--primary-shadow-hover), 0 8px 24px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 按钮组样式 */
:deep(.v-btn-toggle) {
   @extend .glass-card;
   padding: 6px;
   box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

:deep(.v-btn-toggle .v-btn) {
   border-radius: 12px;
   margin: 0 3px;
   font-weight: 600;
   transition: var(--transition);
   position: relative;
   overflow: hidden;
}

:deep(.v-btn-toggle .v-btn--active) {
   background: linear-gradient(135deg, var(--primary-500, #3b82f6) 0%, var(--primary-600, #2563eb) 50%, var(--primary-700, #1d4ed8) 100%);
   color: white;
   box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
   transform: scale(1.05);
}

/* 页面头部按钮 */
:deep(.unified-page-header .v-btn) {
   transition: var(--transition);
   font-weight: 600;
   border-radius: 12px;
   position: relative;
   overflow: hidden;
   backdrop-filter: blur(10px);
}

:deep(.unified-page-header .v-btn:hover) {
   transform: translateY(-3px) scale(1.02);
   box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(59, 130, 246, 0.2);
}

/* 芯片样式 */
:deep(.v-chip) {
   font-weight: 600;
   letter-spacing: 0.025em;
   transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   border-radius: 12px;
   backdrop-filter: blur(15px);
   border: 1px solid var(--glass-border);
   position: relative;
   overflow: hidden;
}

:deep(.v-chip:hover) {
   transform: scale(1.08) translateY(-1px);
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 统计卡片 */
:deep(.unified-stats-card) {
   transition: var(--transition);
   @extend .glass-card;
   position: relative;
   overflow: hidden;
}

:deep(.unified-stats-card)::before {
   content: '';
   position: absolute;
   top: 0;
   left: 0;
   right: 0;
   height: 3px;
   background: linear-gradient(90deg, var(--primary-500, #3b82f6) 0%, var(--secondary-500, #6366f1) 50%, var(--primary-500, #3b82f6) 100%);
   opacity: 0;
   transition: opacity 0.3s ease;
}

:deep(.unified-stats-card:hover) {
   transform: translateY(-8px) scale(1.02);
   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(59, 130, 246, 0.2);
}

:deep(.unified-stats-card:hover)::before {
   opacity: 1;
}

/* 深色主题适配 */
:deep(.v-theme--dark) {
   --primary-gradient: var(--dark-gradient);
   --primary-shadow: var(--dark-shadow);
}

/* 自定义元素样式 */
.dashboard-template { position: relative; }

.refresh-btn {
   transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   border-width: 2px;
}

.refresh-btn:hover {
   transform: rotate(180deg) scale(1.05);
   border-color: var(--primary-600, #2563eb);
   background: rgba(var(--v-theme-primary), 0.08);
}

.today-btn {
   background: linear-gradient(135deg, var(--primary-500, #3b82f6) 0%, var(--primary-600, #2563eb) 50%, var(--primary-700, #1d4ed8) 100%);
   box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
   transition: var(--transition);
}

.today-btn:hover {
   transform: translateY(-2px) scale(1.02);
   box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
   .match-height { gap: 12px; }
   .quality-overview-wrapper { padding: 20px; }
   .quality-stats-row { gap: 16px; }
}

@media (max-width: 960px) {
   .chart {
     height: clamp(240px, 36vh, 380px);
     border-radius: var(--border-radius);
   }

   .quality-overview-wrapper {
     padding: 18px;
     border-radius: var(--border-radius);
   }

   :deep(.unified-data-table, .unified-stats-card) {
     border-radius: var(--border-radius);
   }

   .match-height .v-col { animation-duration: 0.6s; }
}

@media (max-width: 768px) {
   .match-height {
     gap: 8px;
     margin-bottom: 24px;
   }

   .quality-overview-wrapper { padding: 16px; }
   .quality-stats-row { gap: 12px; }

   :deep(.v-list-item) {
     min-height: 52px;
     border-radius: 12px;
   }
}

@media (max-width: 600px) {
   .chart {
     height: clamp(220px, 32vh, 320px);
     border-radius: 12px;
   }

   .quality-overview-wrapper {
     padding: 14px;
     border-radius: 12px;
   }

   :deep(.v-btn-toggle) {
     margin-top: 8px;
     border-radius: 12px;
     padding: 4px;
   }

   :deep(.unified-data-table, .unified-stats-card) {
     border-radius: 12px;
   }

   :deep(.v-list-item) {
     border-radius: 10px;
     min-height: 48px;
   }

   .match-height .v-col { animation-duration: 0.5s; }

   :deep(.v-list-item:hover) {
     transform: translateX(8px) translateY(-1px);
   }
}

@media (max-width: 480px) {
   .chart {
     height: clamp(200px, 28vh, 280px);
     border-radius: 8px;
   }

   .quality-overview-wrapper {
     padding: 12px;
     border-radius: 8px;
   }

   .quality-stats-row { gap: 8px; }

   :deep(.unified-data-table, .unified-stats-card, .v-btn-toggle, .v-list-item) {
     border-radius: 8px;
   }

   :deep(.v-list-item) { min-height: 44px; }
   .match-height { gap: 6px; }
}
</style>


