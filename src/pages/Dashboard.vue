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
    const response = await api.get('/dashboard/trend', { period })
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

// 快速链接
const quickLinks = computed(() => {
  const links = [
    { title: '仪表盘', to: '/dashboard', icon: 'mdi-view-dashboard' },
    { title: '重要事件', to: '/events', icon: 'mdi-calendar-text' },
  ]
  
  // 根据用户部门添加相关链接
  const department = userStore.department
  
  if (department === 'QA' || department === 'ADMIN') {
    links.push({ title: '质量', to: '/quality', icon: 'mdi-checkbox-multiple-marked-circle-outline' })
  }
  
  if (department === 'ASSY' || department === 'ADMIN') {
    links.push({ title: '生产', to: '/assy', icon: 'mdi-hammer-wrench' })
  }
  
  if (department === 'EHS' || department === 'ADMIN') {
    links.push({ title: 'EHS', to: '/ehs', icon: 'mdi-security' })
  }
  
  if (department === 'ADMIN') {
    links.push({ title: '管理', to: '/admin', icon: 'mdi-shield-account' })
  }
  
  return links
})

// 是否正在加载
const isLoading = ref(false)
const selectedPeriod = ref('month')

// 获取质量数据
const fetchQualityData = async () => {
  isLoadingQualityData.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/qa/?month=${currentMonth}`);
    if (response.ok) {
      const fetchedData = await response.json();
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
    } else {
      console.error('获取质量数据失败');
      Message.error('获取质量数据失败');
    }
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
  >
    <template #header-actions>
      <v-btn 
        prepend-icon="mdi-refresh"
        variant="text"
        @click="refreshAllData"
        :disabled="isLoading"
        class="mr-2"
      >
        刷新数据
      </v-btn>
      <v-btn
        prepend-icon="mdi-calendar"
        color="primary"
        variant="elevated"
      >
        今日数据
      </v-btn>
    </template>
    
    <!-- 加载指示器 -->
    <loading-overlay :loading="isLoading" message="加载数据中..." />
    
    <v-row class="fill-height">
      <!-- 左侧面板 -->
      <v-col cols="12" md="8" order="4" order-md="1" class="d-flex flex-column">
        <!-- 统计卡片 -->
        <v-row class="match-height">
          <v-col cols="12" sm="6" lg="6" v-for="card in statsCards" :key="card.title">
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
                  color="primary"
                  class="pt-1"
                  @update:model-value="handlePeriodChange"
                >
                  <v-btn value="day">日</v-btn>
                  <v-btn value="week">周</v-btn>
                  <v-btn value="month" selected>月</v-btn>
                  <v-btn value="year">年</v-btn>
                </v-btn-toggle>
              </template>
              
              <loading-overlay :loading="isLoadingTrendData" />
              <v-chart class="chart" :option="chartOption" autoresize />
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
                <v-chip class="ml-2" color="primary" size="small">本月</v-chip>
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  size="small"
                  to="/quality"
                  color="primary"
                >
                  查看详情
                  <v-icon end>mdi-chevron-right</v-icon>
                </v-btn>
              </template>
              
              <loading-overlay :loading="isLoadingQualityData" />
              <div class="quality-overview-wrapper">
                <v-row class="quality-stats-row g-1">
                  <v-col cols="12" sm="6" md="3">
                    <unified-stats-card
                      title="本月焊接GP12总数"
                      :value="totalWelding"
                      icon="mdi-chart-line"
                      color="primary"
                      subtitle="SWI, RWH, W01"
                    />
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <unified-stats-card
                      title="本月冲压GP12总数"
                      :value="totalStamping"
                      icon="mdi-stamper"
                      color="secondary"
                      subtitle="HF, LC"
                    />
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <unified-stats-card
                      title="报废率"
                      :value="scrapRate + '%'"
                      icon="mdi-recycle"
                      color="error"
                      subtitle="本月累计"
                    />
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
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
          <v-col cols="12" class="d-flex">
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
      <v-col cols="12" md="4" order="1" order-md="2" class="d-flex flex-column">
        <!-- 即将开始的重要事件 -->
        <div class="flex-grow-1 mb-4">
          <dashboard-upcoming-events :limit="5" />
        </div>
        
        <!-- 快速链接区域 -->
        <unified-data-table
          title="快速访问"
          icon="mdi-link"
          class="mb-4"
          :headers="[]"
          :items="quickLinks"
          hide-default-footer
          :loading="false"
          hide-no-data
        >
          <template #pre-table>
            <v-list v-if="quickLinks.length > 0">
              <v-list-item v-for="link in quickLinks" :key="link.to" :to="link.to" link class="quick-link-item">
                <template v-slot:prepend>
                  <v-avatar color="grey-lighten-3" size="38">
                    <v-icon :icon="link.icon" color="primary"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ link.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </template>
        </unified-data-table>
        
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
              ></v-alert>
              
              <v-alert
                color="success"
                icon="mdi-check-circle"
                title="质量模块更新"
                text="如果在使用过程中遇到任何bug或疑问，请联系管理员noah.yin@magna.com。"
                variant="tonal"
                border="start"
                density="comfortable"
              ></v-alert>
            </div>
          </template>
        </unified-data-table>
      </v-col>
    </v-row>
  </unified-page-template>
</template>

<style scoped>
.fill-height {
  flex: 1;
  min-height: 0;
}

.chart {
  height: 350px;
}

.h-100 {
  height: 100%;
}

.match-height {
  display: flex;
  flex-wrap: wrap;
}

:deep(.v-list-item) {
  min-height: 56px;
  border-radius: 8px;
  margin: 4px 0;
}

.quick-link-item {
  transition: background-color 0.2s;
}

.quick-link-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* 质量数据总览样式 */
.quality-overview-wrapper {
  width: 100%;
  overflow: hidden;
}

.quality-stats-row {
  margin: 0;
  width: 100%;
}

:deep(.data-overview .v-card-text) {
  padding: 0;
  overflow: hidden;
}

@media (max-width: 960px) {
  .chart {
    height: 300px;
  }
}

@media (max-width: 600px) {
  .chart {
    height: 250px;
  }
  
  :deep(.v-btn-toggle) {
    margin-top: 8px;
  }
}
</style>


