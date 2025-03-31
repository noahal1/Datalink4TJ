<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

// 统计卡片数据
const statsCards = ref([
  {
    title: 'GP12数量',
    color: 'primary',
    icon: 'mdi-package-variant-closed',
    stats: '1,280',
    change: 12,
  },
  {
    title: 'LWD数量',
    color: 'success',
    icon: 'mdi-shield-check',
    stats: '21',
    change: -5,
  },
  {
    title: '重要事件',
    color: 'warning',
    icon: 'mdi-calendar-alert',
    stats: '8',
    change: 15,
  },
  {
    title: '维修调用',
    color: 'error',
    icon: 'mdi-wrench',
    stats: '45',
    change: 8,
  },
])

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
    title: '生产部提交了生产报告', 
    time: '3 小时前',
    icon: 'mdi-factory',
    color: 'success' 
  },
  { 
    title: '管理员更新了系统配置', 
    time: '昨天',
    icon: 'mdi-cog',
    color: 'grey' 
  },
])
onMounted(() => {
  console.log('Dashboard loaded')
})
</script>

<template>
  <v-container fluid>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">欢迎回来，{{ userStore.user?.name || '用户' }}</h1>
      </v-col>
    
    <v-row class="match-height">
      <!-- 统计卡片 -->
      <v-col cols="12" md="3" sm="6" v-for="card in statsCards" :key="card.title">
        <v-card :color="card.color" dark class="stats-card">
          <v-card-item>
            <v-card-title>{{ card.title }}</v-card-title>
            <template v-slot:prepend>
              <v-icon size="large">{{ card.icon }}</v-icon>
            </template>
          </v-card-item>
          <v-card-text>
            <div class="text-h4 font-weight-bold">{{ card.stats }}</div>
            <div class="d-flex align-center mt-1">
              <v-icon size="small" :color="card.change >= 0 ? 'success' : 'error'" class="mr-1">
                {{ card.change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span>{{ Math.abs(card.change) }}% {{ card.change >= 0 ? '增长' : '下降' }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-6">
      <!-- 图表区域 -->
      <v-col cols="12" md="8">
        <v-card class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            数据概览
          </v-card-title>
          <v-card-text>
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
          <v-card-text>
            <v-list>
              <v-list-item v-for="link in quickLinks" :key="link.to" :to="link.to" link>
                <template v-slot:prepend>
                  <v-avatar color="grey-lighten-1" size="32">
                    <v-icon :icon="link.icon"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ link.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 最近活动区域 -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-history</v-icon>
            最近活动
          </v-card-title>
          <v-card-text>
            <v-list lines="two">
              <v-list-item v-for="(activity, index) in recentActivities" :key="index">
                <template v-slot:prepend>
                  <v-avatar :color="activity.color" size="36">
                    <v-icon :icon="activity.icon" color="white"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ activity.time }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.stats-card {
  transition: transform 0.3s, box-shadow 0.3s;
}
.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}
.chart {
  height: 350px;
  width: 100%;
}
.chart-card {
  height: 100%;
}
</style>


