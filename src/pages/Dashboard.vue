<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useActivityStore } from '../stores/activity'
import DashboardUpcomingEvents from '../components/DashboardUpcomingEvents.vue'
import RecentActivities from '../components/RecentActivities.vue'
import Message from '../utils/notification'
import api from '../utils/api'

const userStore = useUserStore()
const activityStore = useActivityStore()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const currentMonth = new Date().getMonth() + 1
const isLoadingQualityData = ref(false)
const qualityData = ref([])
const isLoadingTrendData = ref(false)
const trendData = ref(null)

// 图表选项
const chartOption = computed(() => {
  if (!trendData.value) {
    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['生产', '质量', 'EHS']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: []
      },
      yAxis: {
        type: 'value'
      },
      series: []
    }
  }

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: trendData.value.legend
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.xAxis
    },
    yAxis: {
      type: 'value'
    },
    series: trendData.value.series
  }
})

// 获取趋势数据
const fetchTrendData = async (period = 'month') => {
  isLoadingTrendData.value = true
  try {
    //const response = await api.get('/dashboard/trend', { period })
    if (response && response.data) {
      trendData.value = response.data
    } else {
      // 如果API不可用，使用模拟数据
      trendData.value = {
        legend: ['生产', '质量', 'EHS'],
        xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
        series: [
          {
            name: '生产',
            type: 'line',
            data: [120, 132, 101, 134, 90, 230, 210]
          },
          {
            name: '质量',
            type: 'line',
            data: [220, 182, 191, 234, 290, 330, 310]
          },
          {
            name: 'EHS',
            type: 'line',
            data: [15, 12, 11, 14, 9, 23, 21]
          }
        ]
      }
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    // 使用模拟数据
    trendData.value = {
      legend: ['生产', '质量', 'EHS'],
      xAxis: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
      series: [
        {
          name: '生产',
          type: 'line',
          data: [120, 132, 101, 134, 90, 230, 210]
        },
        {
          name: '质量',
          type: 'line',
          data: [220, 182, 191, 234, 290, 330, 310]
        },
        {
          name: 'EHS',
          type: 'line',
          data: [15, 12, 11, 14, 9, 23, 21]
        }
      ]
    }
  } finally {
    isLoadingTrendData.value = false
  }
}

// 质量数据统计
const standardFields = ['swi', 'rwh', 'w01', 'hf', 'lc']
const scrapFields = ['scrapswi', 'scraprwh', 'scrapw01', 'scraphf', 'scraplc']

// 统计数据
const totalWelding = computed(() => {
  return qualityData.value.reduce((sum, item) => sum + (item.welding || 0), 0);
});

const totalStamping = computed(() => {
  return qualityData.value.reduce((sum, item) => sum + (item.stamping || 0), 0);
});

const totalGP12 = computed(() => {
  return totalWelding.value + totalStamping.value;
});

const totalScrap = computed(() => {
  return qualityData.value.reduce((sum, item) => {
    return sum + scrapFields.reduce((fieldSum, field) => fieldSum + (parseInt(item[field]) || 0), 0);
  }, 0);
});

const scrapRate = computed(() => {
  if (totalGP12.value === 0) return "0.00";
  
  const rate = (totalScrap.value / (totalGP12.value + totalScrap.value)) * 100;
  return rate.toFixed(2);
});

// 是否正在加载
const isLoading = ref(false)
const selectedPeriod = ref('month')

// 获取质量数据
const fetchQualityData = async () => {
  isLoadingQualityData.value = true;
  try {
    const response = await api.get('/qa/', { params: { month: currentMonth.toString() } });
    
    // 获取响应数据
    const fetchedData = response.data || [];
    
    const daysInMonth = new Date(new Date().getFullYear(), currentMonth, 0).getDate();
    const generatedData = Array.from({ length: daysInMonth }, (_, i) => ({
      date: (i + 1).toString(),
      swi: 0,
      rwh: 0,
      w01: 0,
      hf: 0,
      lc: 0,
      scrapswi: 0,
      scraprwh: 0,
      scrapw01: 0,
      scraphf: 0,
      scraplc: 0,
      welding: 0,
      stamping: 0
    }));

    fetchedData.forEach(item => {
      const day = generatedData.find(d => d.date === item.day);
      if (day) {
        const line = item.line.toLowerCase();
        day[item.scrapflag ? `scrap${line}` : line] = parseInt(item.value, 10);
        // 更新welding和stamping字段
        day.welding = day.swi + day.rwh + day.w01;
        day.stamping = day.hf + day.lc;
      }
    });
    
    qualityData.value = generatedData;
  } catch (error) {
    console.error('获取质量数据错误:', error);
    Message.error('获取质量数据失败: ' + (error.message || '未知错误'));
  } finally {
    isLoadingQualityData.value = false;
  }
}

// 刷新所有数据
const refreshAllData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchQualityData(),
      fetchTrendData(selectedPeriod.value),
      activityStore.fetchActivities()
    ]);
    Message.success('数据刷新成功');
  } catch (error) {
    Message.error('数据刷新失败: ' + (error.message || '未知错误'));
  } finally {
    isLoading.value = false;
  }
}

// 统计卡片数据
const statsCards = [
  {
    title: '生产计划完成率',
    value: '94.5%',
    icon: 'mdi-chart-line',
    color: 'success',
    change: '+2.5%'
  },
  {
    title: '质量合格率',
    value: '99.2%',
    icon: 'mdi-check-circle',
    color: 'primary',
    change: '+0.3%'
  },
  {
    title: '设备稼动率',
    value: '87.8%',
    icon: 'mdi-cog',
    color: 'warning',
    change: '-1.2%'
  },
  {
    title: '安全无事故天数',
    value: '128',
    icon: 'mdi-shield-check',
    color: 'info',
    change: '+1'
  }
]

// 监听周期变化，重新获取数据
const handlePeriodChange = (period) => {
  selectedPeriod.value = period
  fetchTrendData(period)
}

onMounted(async () => {
  console.log('Dashboard loaded')
  // 异步加载质量数据
  fetchQualityData()
  // 获取趋势数据
  fetchTrendData('month')
  // 获取最近活动数据
  activityStore.fetchActivities()
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
            sm="4"
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
              <div class="quality-overview-wrapper">
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
              </div>
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

@keyframes backgroundFloat {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-20px, -10px) rotate(1deg); }
  66% { transform: translate(20px, 10px) rotate(-1deg); }
}

.fill-height {
  flex: 1;
  min-height: 0;
}

.chart {
  height: 400px;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(59, 130, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart:hover {
  transform: translateY(-4px);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(59, 130, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.h-100 {
  height: 100%;
}

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

.match-height .v-col:nth-child(1) {
  animation-delay: 0.1s;
  animation-name: fadeInUpScale;
}
.match-height .v-col:nth-child(2) {
  animation-delay: 0.2s;
  animation-name: fadeInUpScale;
}
.match-height .v-col:nth-child(3) {
  animation-delay: 0.3s;
  animation-name: fadeInUpScale;
}
.match-height .v-col:nth-child(4) {
  animation-delay: 0.4s;
  animation-name: fadeInUpScale;
}

/* 列表项美化 - 增强版 */
:deep(.v-list-item) {
  min-height: 60px;
  border-radius: 16px;
  margin: 8px 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(248, 250, 252, 0.7) 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
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
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.1) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

:deep(.v-list-item:hover) {
  transform: translateX(12px) translateY(-2px);
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.12) 0%,
    rgba(147, 197, 253, 0.08) 100%
  );
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

:deep(.v-list-item:hover)::before {
  left: 100%;
}

.quick-link-item {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.quick-link-item:hover {
  background: linear-gradient(135deg,
    rgba(var(--v-theme-primary), 0.12) 0%,
    rgba(var(--v-theme-primary), 0.06) 100%
  );
}


.quality-overview-wrapper {
  width: 100%;
  overflow: hidden;
  padding: 24px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 50%,
    rgba(236, 254, 255, 0.9) 100%
  );
  border-radius: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
}

.quality-overview-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    var(--primary-500) 0%,
    var(--secondary-500) 50%,
    var(--primary-500) 100%
  );
  border-radius: 20px 20px 0 0;
}

.quality-stats-row {
  margin: 0;
  width: 100%;
}

:deep(.unified-data-table) {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  backdrop-filter: blur(25px);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(59, 130, 246, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

:deep(.unified-data-table:not(.doh-table):not(.master-data-table):not(.quality-kpi-table):not(.production-kpi-table):not(.ehs-kpi-table):not(.logistics-kpi-table):hover) {
  transform: translateY(-4px);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(59, 130, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 只对非表格的统一数据表格应用光泽效果 */
:deep(.unified-data-table:not(.table-container))::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.03) 50%,
    transparent 100%
  );
  transition: left 0.8s ease;
  z-index: 0;
}

:deep(.unified-data-table:not(.table-container):hover)::before {
  left: 100%;
}

:deep(.data-overview .v-card-text) {
  padding: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 按钮组美化 - 增强版 */
:deep(.v-btn-toggle) {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 252, 0.8) 100%
  );
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 6px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

:deep(.v-btn-toggle .v-btn) {
  border-radius: 12px;
  margin: 0 3px;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

:deep(.v-btn-toggle .v-btn)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

:deep(.v-btn-toggle .v-btn:hover)::before {
  left: 100%;
}

:deep(.v-btn-toggle .v-btn--active) {
  background: linear-gradient(135deg,
    var(--primary-500) 0%,
    var(--primary-600) 50%,
    var(--primary-700) 100%
  );
  color: white;
  box-shadow:
    0 4px 16px rgba(59, 130, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* 头部操作按钮美化 - 增强版 */
:deep(.unified-page-header .v-btn) {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

:deep(.unified-page-header .v-btn)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

:deep(.unified-page-header .v-btn:hover) {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(59, 130, 246, 0.2);
}

:deep(.unified-page-header .v-btn:hover)::before {
  left: 100%;
}

/* 芯片美化 - 增强版 */
:deep(.v-chip) {
  font-weight: 600;
  letter-spacing: 0.025em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

:deep(.v-chip)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transition: left 0.5s ease;
}

:deep(.v-chip:hover) {
  transform: scale(1.08) translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.v-chip:hover)::before {
  left: 100%;
}

/* 统计卡片增强 - 增强版 */
:deep(.unified-stats-card) {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.4);
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
  background: linear-gradient(90deg,
    var(--primary-500) 0%,
    var(--secondary-500) 50%,
    var(--primary-500) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.unified-stats-card:hover) {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(59, 130, 246, 0.2);
}

:deep(.unified-stats-card:hover)::before {
  opacity: 1;
}

/* 动画效果 - 增强版 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUpScale {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 新增元素样式 */
.dashboard-template {
  position: relative;
}

.status-chip {
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.refresh-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-width: 2px;
}

.refresh-btn:hover {
  transform: rotate(180deg) scale(1.05);
  border-color: var(--primary-600);
  background: rgba(var(--v-theme-primary), 0.08);
}

.today-btn {
  background: linear-gradient(135deg,
    var(--primary-500) 0%,
    var(--primary-600) 50%,
    var(--primary-700) 100%
  );
  box-shadow:
    0 4px 16px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.today-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 24px rgba(59, 130, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

@media (max-width: 1200px) {
  .match-height {
    gap: 12px;
  }

  .quality-overview-wrapper {
    padding: 20px;
  }

  .quality-stats-row {
    gap: 16px;
  }
}

@media (max-width: 960px) {
  :deep(.unified-page-content)::before {
    animation-duration: 30s;
  }

  .chart {
    height: 320px;
    border-radius: 16px;
  }

  .quality-overview-wrapper {
    padding: 18px;
    border-radius: 16px;
  }

  :deep(.unified-data-table) {
    border-radius: 16px;
  }

  :deep(.unified-stats-card) {
    border-radius: 16px;
  }

  .match-height .v-col {
    animation-duration: 0.6s;
  }
}

@media (max-width: 768px) {
  .match-height {
    gap: 8px;
    margin-bottom: 24px;
  }

  .quality-overview-wrapper {
    padding: 16px;
  }

  .quality-stats-row {
    gap: 12px;
  }

  :deep(.v-list-item) {
    min-height: 52px;
    border-radius: 12px;
  }
}

@media (max-width: 600px) {
  :deep(.unified-page-content) {
    background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.02) 0%,
      rgba(255, 255, 255, 0.98) 50%,
      rgba(248, 250, 252, 0.95) 100%
    );
  }

  .chart {
    height: 280px;
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

  :deep(.unified-data-table) {
    border-radius: 12px;
  }

  :deep(.unified-stats-card) {
    border-radius: 12px;
  }

  :deep(.v-list-item) {
    border-radius: 10px;
    min-height: 48px;
  }

  .match-height .v-col {
    animation-duration: 0.5s;
  }

  :deep(.v-list-item:hover) {
    transform: translateX(8px) translateY(-1px);
  }
}

@media (max-width: 480px) {
  .chart {
    height: 240px;
    border-radius: 8px;
  }

  .quality-overview-wrapper {
    padding: 12px;
    border-radius: 8px;
  }

  .quality-stats-row {
    gap: 8px;
  }

  :deep(.unified-data-table) {
    border-radius: 8px;
  }

  :deep(.unified-stats-card) {
    border-radius: 8px;
  }

  :deep(.v-list-item) {
    border-radius: 8px;
    min-height: 44px;
  }

  :deep(.v-btn-toggle) {
    border-radius: 8px;
  }

  .match-height {
    gap: 6px;
  }
}
</style>


