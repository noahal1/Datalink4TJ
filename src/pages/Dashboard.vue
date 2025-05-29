<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import UpcomingEvents from '../components/UpcomingEvents.vue'

const userStore = useUserStore()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const currentMonth = new Date().getMonth() + 1
const isLoadingQualityData = ref(false)
const qualityData = ref([])


// 图表选项
const chartOption = {
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
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '生产',
      type: 'line',
      stack: 'Total',
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '质量',
      type: 'line',
      stack: 'Total',
      data: [220, 182, 191, 234, 290, 330, 310]
    },
    {
      name: 'EHS',
      type: 'line',
      stack: 'Total',
      data: [15, 12, 11, 14, 9, 23, 21]
    }
  ]
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

// 最近活动
const recentActivities = ref([
  { 
    title: '质量部更新了 GP12 数据', 
    time: '10 分钟前',
    icon: 'mdi-clipboard-check',
    color: 'primary' 
  },
  { 
    title: 'EHS 上报了新的 LWD 数据', 
    time: '1 小时前',
    icon: 'mdi-shield-alert',
    color: 'warning' 
  },
  { 
    title: '管理员更新了系统配置', 
    time: '昨天',
    icon: 'mdi-cog',
    color: 'grey' 
  },
])

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
    }
  } catch (error) {
    console.error('获取质量数据错误:', error);
  } finally {
    isLoadingQualityData.value = false;
  }
}

onMounted(async () => {
  console.log('Dashboard loaded')
  // 异步加载质量数据
  fetchQualityData()
})
</script>

<template>
  <v-container fluid>
    <!-- 页面头部 -->
    <page-header
      style="margin-bottom: 0px;"
      :title="`欢迎回来，${userStore.user?.name || '用户'}`"
      :show-breadcrumbs="false"
    >
      <template #actions>
        <v-btn 
          prepend-icon="mdi-refresh"
          variant="text"
          @click="isLoading = !isLoading"
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
    </page-header>
    
    <!-- 加载指示器 -->
    <loading-overlay :loading="isLoading" message="加载数据中..." />
    <v-row class="match-height">
  <v-col cols="12">
    <upcoming-events @update:event-count="handleEventCount" />
  </v-col>
  </v-row>
    <v-row class="match-height">
      <!-- 统计卡片 -->
      <v-col cols="12" md="3" sm="6" v-for="card in statsCards" :key="card.title">
        <stats-card
          :title="card.title"
          :value="card.value"
          :icon="card.icon"
          :color="card.color"
          :change="card.change"
          show-change
          elevation="1"
          class="h-100"
        />
      </v-col>
    </v-row>
    
    <!-- 质量数据总览 -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-areaspline</v-icon>
            质量数据总览
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
          </v-card-title>
          <v-divider></v-divider>
          
          <v-card-text>
            <loading-overlay :loading="isLoadingQualityData" />
            <v-row>
              <v-col cols="12" md="3" sm="6">
                <stats-card
                  title="本月焊接GP12总数"
                  :value="totalWelding"
                  icon="mdi-chart-line"
                  color="primary"
                  subtitle="SWI, RWH, W01"
                />
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <stats-card
                  title="本月冲压GP12总数"
                  :value="totalStamping"
                  icon="mdi-stamper"
                  color="secondary"
                  subtitle="HF, LC"
                />
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <stats-card
                  title="报废率"
                  :value="scrapRate + '%'"
                  icon="mdi-recycle"
                  color="error"
                  subtitle="本月累计"
                />
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <stats-card
                  title="本月GP12总数"
                  :value="totalGP12"
                  icon="mdi-package-variant"
                  color="success"
                  subtitle="所有生产线"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-6">
      <!-- 图表区域 -->
      <v-col cols="12" md="8">
        <v-card class="chart-card h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            数据趋势
            <v-spacer></v-spacer>
            <v-btn-toggle 
              v-model="selectedPeriod" 
              density="comfortable"
              variant="outlined"
              rounded="lg"
              color="primary"
              class="pt-1"
            >
              <v-btn value="day">日</v-btn>
              <v-btn value="week">周</v-btn>
              <v-btn value="month" selected>月</v-btn>
              <v-btn value="year">年</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pt-4">
            <v-chart class="chart" :option="chartOption" />
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- 快速链接区域 -->
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-link</v-icon>
            快速访问
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="px-2 py-0">
            <v-list>
              <v-list-item v-for="link in quickLinks" :key="link.to" :to="link.to" link>
                <template v-slot:prepend>
                  <v-avatar color="grey-lighten-3" size="38">
                    <v-icon :icon="link.icon" color="primary"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ link.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-6">
      <!-- 最近活动 -->
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-history</v-icon>
            最近活动
          </v-card-title>
          <v-divider></v-divider>
          <v-list class="py-0">
            <v-list-item v-for="(activity, index) in recentActivities" :key="index">
              <template v-slot:prepend>
                <v-avatar :color="`${activity.color}-lighten-4`" size="38">
                  <v-icon :icon="activity.icon" :color="activity.color"></v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">{{ activity.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ activity.time }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      
      <!-- 系统公告 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-bullhorn</v-icon>
            系统公告
          </v-card-title>
          <v-divider></v-divider>
          <div class="pa-4">
            <v-alert
              color="info"
              icon="mdi-information"
              title="系统更新"
              text="数据上报系统将不定时进行例行维护，维护时间为上午10点至中午12点。"
              variant="tonal"
              class="mb-4"
            ></v-alert>
            
            <v-alert
              color="success"
              icon="mdi-check-circle"
              title="质量模块更新"
              text="如果在使用过程中遇到任何bug或疑问，请联系管理员noah.yin@magna.com。"
              variant="tonal"
            ></v-alert>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.chart {
  height: 350px;
}

.stats-card {
  transition: transform 0.2s;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.match-height {
  display: flex;
  flex-wrap: wrap;
}

.h-100 {
  height: 100%;
}

.v-card-title {
  font-size: 1.1rem;
}

:deep(.v-card-text) {
  padding: 16px;
}

:deep(.v-list-item) {
  min-height: 60px;
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


