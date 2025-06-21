<template>
  <unified-page-template title="维修指标" icon="mdi-chart-line" color="primary">
    <template #header-actions>
      <v-btn 
        color="primary" 
        prepend-icon="mdi-clipboard-text"
        :to="'/maintenance/downtime-records'"
      >
        停机单管理
      </v-btn>
    </template>

    <!-- 筛选条件 -->
    <v-card class="mb-4">
      <v-card-text>
        <div class="d-flex align-center flex-wrap">
          <!-- 线体选择 -->
          <div class="d-flex align-center me-4 mb-2">
            <div class="text-subtitle-1 me-2">线体:</div>
            <v-btn-toggle
              v-model="selectedLineType"
              color="primary"
              mandatory
              density="comfortable"
              class="mx-2"
            >
              <v-btn value="all">全部</v-btn>
              <v-btn 
                v-for="line in lineTypes" 
                :key="line" 
                :value="line"
                :color="getLineColor(line)"
              >
                {{ line }}
              </v-btn>
            </v-btn-toggle>
          </div>
          
          <!-- 班次选择 -->
          <div class="d-flex align-center me-4 mb-2">
            <div class="text-subtitle-1 me-2">班次:</div>
            <v-btn-toggle
              v-model="selectedShift"
              color="secondary"
              mandatory
              density="comfortable"
              class="mx-2"
            >
              <v-btn value="all">全部</v-btn>
              <v-btn value="day">白班</v-btn>
              <v-btn value="night">夜班</v-btn>
            </v-btn-toggle>
          </div>
          
          <!-- 日期范围 -->
          <div class="d-flex align-center mb-2">
            <div class="text-subtitle-1 me-2">日期范围:</div>
            <v-menu
              v-model="datePickerMenu"
              :close-on-content-click="false"
            >
              <template v-slot:activator="{ props }">
                <v-btn 
                  variant="outlined" 
                  color="primary" 
                  v-bind="props"
                  class="date-range-btn"
                  prepend-icon="mdi-calendar"
                >
                  {{ formatDateRange }}
                </v-btn>
              </template>
              <v-date-picker
                v-model="dateRange"
                range
                color="primary"
                @update:model-value="datePickerMenu = false"
              ></v-date-picker>
            </v-menu>
          </div>
          
          <v-spacer></v-spacer>
          
          <!-- 刷新按钮 -->
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="loadMetrics"
            :loading="loadingMetrics"
            class="mb-2"
          >
            刷新数据
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 筛选标签展示 -->
    <v-row class="mt-2 mb-4">
      <v-col cols="12">
        <div class="filter-tags d-flex align-center flex-wrap">
          <div class="text-subtitle-2 me-2">当前筛选:</div>
          <v-chip
            class="me-2 mb-1"
            :color="getLineColor(selectedLineType)"
            size="small"
            label
          >
            {{ selectedLineType === 'all' ? '全部线体' : selectedLineType }}
          </v-chip>
          
          <v-chip
            class="me-2 mb-1"
            color="secondary"
            size="small"
            label
          >
            {{ selectedShift === 'all' ? '全部班次' : (selectedShift === 'day' ? '白班' : '夜班') }}
          </v-chip>
          
          <v-chip
            class="me-2 mb-1"
            color="primary"
            size="small"
            label
          >
            {{ formatDateRange }}
          </v-chip>
        </div>
      </v-col>
    </v-row>
    
    <!-- 统计概览 -->
    <v-row>
      <v-col cols="12" md="3" sm="6">
        <v-card class="mx-auto" height="100%">
          <v-card-text>
            <div class="text-overline">MTTR (平均修复时间)</div>
            <div class="text-h4 text-center my-3" :class="mttrColor">
              {{ formatTime(filteredMetricsOverview.mttr) }}
            </div>
            <div class="text-caption text-center">
              相比上月 
              <span v-if="mttrTrend < 0" class="text-success">
                <v-icon small>mdi-arrow-down</v-icon> {{ Math.abs(mttrTrend).toFixed(1) }}%
              </span>
              <span v-else-if="mttrTrend > 0" class="text-error">
                <v-icon small>mdi-arrow-up</v-icon> {{ mttrTrend.toFixed(1) }}%
              </span>
              <span v-else class="text-grey">
                <v-icon small>mdi-minus</v-icon> 0%
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3" sm="6">
        <v-card class="mx-auto" height="100%">
          <v-card-text>
            <div class="text-overline">MTBF (平均故障间隔)</div>
            <div class="text-h4 text-center my-3" :class="mtbfColor">
              {{ formatTime(filteredMetricsOverview.mtbf) }}
            </div>
            <div class="text-caption text-center">
              相比上月
              <span v-if="mtbfTrend > 0" class="text-success">
                <v-icon small>mdi-arrow-up</v-icon> {{ mtbfTrend.toFixed(1) }}%
              </span>
              <span v-else-if="mtbfTrend < 0" class="text-error">
                <v-icon small>mdi-arrow-down</v-icon> {{ Math.abs(mtbfTrend).toFixed(1) }}%
              </span>
              <span v-else class="text-grey">
                <v-icon small>mdi-minus</v-icon> 0%
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3" sm="6">
        <v-card class="mx-auto" height="100%">
          <v-card-text>
            <div class="text-overline">OEE (设备综合效率)</div>
            <div class="text-h4 text-center my-3" :class="oeeColor">
              {{ formatPercentage(filteredMetricsOverview.oee) }}
            </div>
            <div class="text-caption text-center">
              相比上月
              <span v-if="oeeTrend > 0" class="text-success">
                <v-icon small>mdi-arrow-up</v-icon> {{ oeeTrend.toFixed(1) }}%
              </span>
              <span v-else-if="oeeTrend < 0" class="text-error">
                <v-icon small>mdi-arrow-down</v-icon> {{ Math.abs(oeeTrend).toFixed(1) }}%
              </span>
              <span v-else class="text-grey">
                <v-icon small>mdi-minus</v-icon> 0%
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3" sm="6">
        <v-card class="mx-auto" height="100%">
          <v-card-text>
            <div class="text-overline">设备可动率</div>
            <div class="text-h4 text-center my-3" :class="availabilityColor">
              {{ formatPercentage(filteredMetricsOverview.availability) }}
            </div>
            <div class="text-caption text-center">
              相比上月
              <span v-if="availabilityTrend > 0" class="text-success">
                <v-icon small>mdi-arrow-up</v-icon> {{ availabilityTrend.toFixed(1) }}%
              </span>
              <span v-else-if="availabilityTrend < 0" class="text-error">
                <v-icon small>mdi-arrow-down</v-icon> {{ Math.abs(availabilityTrend).toFixed(1) }}%
              </span>
              <span v-else class="text-grey">
                <v-icon small>mdi-minus</v-icon> 0%
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 趋势图表区域 -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>OEE和设备可动率趋势</span>
          </v-card-title>
          <v-card-text>
            <div id="oee-chart" style="height: 300px;">
              <v-skeleton-loader v-if="loadingMetrics" type="image" height="300"></v-skeleton-loader>
              <v-chart 
                v-else 
                class="chart" 
                :option="oeeChartOption" 
                autoresize
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>MTTR和MTBF趋势</span>
          </v-card-title>
          <v-card-text>
            <div id="mttr-mtbf-chart" style="height: 300px;">
              <v-skeleton-loader v-if="loadingMetrics" type="image" height="300"></v-skeleton-loader>
              <v-chart 
                v-else 
                class="chart" 
                :option="mttrMtbfChartOption" 
                autoresize
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 线体对比 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>线体性能对比</v-card-title>
          <v-card-text>
            <div id="equipment-comparison" style="height: 300px;">
              <v-skeleton-loader v-if="loadingMetrics" type="image" height="300"></v-skeleton-loader>
              <v-chart 
                v-else 
                class="chart" 
                :option="lineComparisonChartOption" 
                autoresize
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 维修数据列表 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <metrics-list
          :metrics="filteredMetrics"
          :loading="loadingMetrics"
          @add-metric="openMetricDialog()"
          @edit-metric="editMetric"
          @delete-metric="deleteMetric"
        />
      </v-col>
    </v-row>
    
    <!-- 维修数据指标对话框 -->
    <metrics-dialog
      v-model="metricDialog"
      v-model:metric="editedMetric"
      :is-new="editedMetricIndex === -1"
      :loading="savingMetric"
      @save="saveMetric"
      @close="closeMetricDialog"
    />
  </unified-page-template>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useUserStore } from '../stores/user.js'
import Message from '../utils/notification'
import MetricsList from '../components/maintenance/MetricsList.vue'
import MetricsDialog from '../components/maintenance/MetricsDialog.vue'
import api from '../utils/api'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const userStore = useUserStore()

// 线体类型列表
const lineTypes = ['SWI-L', 'SWI-R', 'RWH-L', 'RWH-R', 'W01', 'HF', 'LC']
const selectedLineType = ref('all')

// 班次选择
const selectedShift = ref('all')

// 日期范围选择
const datePickerMenu = ref(false)
const dateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().substr(0, 10),
  new Date().toISOString().substr(0, 10)
])

// 图表数据
const chartData = ref({
  oeeAvailability: [],
  mttrMtbf: [],
  lineComparison: {}
})

// OEE和设备可动率趋势图配置
const oeeChartOption = computed(() => {
  const dates = chartData.value.oeeAvailability.map(item => item.date);
  const oeeValues = chartData.value.oeeAvailability.map(item => (item.oee * 100).toFixed(1));
  const availabilityValues = chartData.value.oeeAvailability.map(item => (item.availability * 100).toFixed(1));
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value}%<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['OEE', '设备可动率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: 'OEE',
        type: 'line',
        data: oeeValues,
        itemStyle: {
          color: '#1976D2'
        }
      },
      {
        name: '设备可动率',
        type: 'line',
        data: availabilityValues,
        itemStyle: {
          color: '#4CAF50'
        }
      }
    ]
  };
});

// MTTR和MTBF趋势图配置
const mttrMtbfChartOption = computed(() => {
  const dates = chartData.value.mttrMtbf.map(item => item.date);
  const mttrValues = chartData.value.mttrMtbf.map(item => item.mttr);
  const mtbfValues = chartData.value.mttrMtbf.map(item => item.mtbf);
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          let unit = param.seriesName === 'MTTR' ? '分钟' : '小时';
          let value = param.seriesName === 'MTBF' ? (param.value/60).toFixed(1) : param.value;
          result += `${param.seriesName}: ${value}${unit}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['MTTR', 'MTBF']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'MTTR (分钟)',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: 'MTBF (小时)',
        position: 'right',
        axisLabel: {
          formatter: '{value}'
        },
        axisLine: {
          lineStyle: {
            color: '#E53935'
          }
        },
        axisLabel: {
          formatter: function(value) {
            return (value/60).toFixed(1);
          }
        }
      }
    ],
    series: [
      {
        name: 'MTTR',
        type: 'bar',
        data: mttrValues,
        itemStyle: {
          color: '#FFA726'
        }
      },
      {
        name: 'MTBF',
        type: 'line',
        yAxisIndex: 1,
        data: mtbfValues,
        itemStyle: {
          color: '#E53935'
        },
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  };
});

// 线体对比图配置
const lineComparisonChartOption = computed(() => {
  const data = chartData.value.lineComparison;
  if (!data.lines || !data.metrics) {
    return {
      tooltip: {},
      legend: { data: [] },
      radar: { indicator: [] },
      series: []
    };
  }
  
  return {
    tooltip: {},
    legend: {
      data: data.lines
    },
    radar: {
      indicator: data.metrics.map(metric => ({
        name: metric,
        max: 100
      }))
    },
    series: [
      {
        type: 'radar',
        data: data.lines.map((line, index) => ({
          value: data.values[index],
          name: line
        })),
        areaStyle: {
          opacity: 0.1
        }
      }
    ]
  };
});

// 格式化显示的日期范围
const formatDateRange = computed(() => {
  if (dateRange.value && dateRange.value.length === 2) {
    return `${dateRange.value[0]} 至 ${dateRange.value[1]}`
  }
  return '选择日期范围'
})

// 维修数据指标相关数据
const metricsList = ref([])
const loadingMetrics = ref(false)
const savingMetric = ref(false)
const metricDialog = ref(false)
const editedMetricIndex = ref(-1)
const editedMetric = ref({
  id: null,
  equipment_type: '',
  date: new Date().toISOString().split('T')[0],
  shift: 'day', // 默认白班
  downtime_count: 0,
  downtime_minutes: 0,
  parts_produced: 0,
  user_id: userStore.userId
})

// 指标概览数据
const metricsOverview = ref({
  mttr: 0,     // 平均修复时间（分钟）
  mtbf: 1440,  // 平均故障间隔时间（分钟）
  oee: 0.95,   // 设备综合效率（百分比）
  availability: 0.95 // 设备可动率（百分比）
})

// 假设的趋势数据（相对于上月的变化百分比）
const mttrTrend = ref(-5)
const mtbfTrend = ref(2)
const oeeTrend = ref(1.5)
const availabilityTrend = ref(1.2)

// 获取线体颜色
const getLineColor = (type) => {
  const colors = {
    'all': 'primary',
    'SWI-L': 'indigo',
    'SWI-R': 'deep-purple',
    'RWH-L': 'teal',
    'RWH-R': 'cyan',
    'W01': 'blue',
    'HF': 'deep-orange',
    'LC': 'green'
  }
  return colors[type] || 'grey'
}

// 根据选中的线体、班次和日期范围筛选数据
const filteredMetrics = computed(() => {
  let filtered = [...metricsList.value]
  
  // 筛选线体
  if (selectedLineType.value !== 'all') {
    filtered = filtered.filter(metric => metric.equipment_type === selectedLineType.value)
  }
  
  // 筛选班次
  if (selectedShift.value !== 'all') {
    filtered = filtered.filter(metric => metric.shift === selectedShift.value)
  }
  
  // 筛选日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = dateRange.value[0]
    const endDate = dateRange.value[1]
    filtered = filtered.filter(metric => {
      const metricDate = metric.date
      return metricDate >= startDate && metricDate <= endDate
    })
  }
  
  return filtered
})

// 根据筛选的数据计算指标概览
const filteredMetricsOverview = computed(() => {
  if (filteredMetrics.value.length === 0) {
    return {
      mttr: 0,
      mtbf: 1440,
      oee: 0.95,
      availability: 0.95
    }
  }
  
  // 总计
  let totalDowntimeMinutes = 0
  let totalDowntimeCount = 0
  let totalWorkMinutes = filteredMetrics.value.length * 1440 // 假设每天1440分钟
  
  filteredMetrics.value.forEach(metric => {
    totalDowntimeMinutes += Number(metric.downtime_minutes) || 0
    totalDowntimeCount += Number(metric.downtime_count) || 0
  })
  
  // 计算MTTR（平均修复时间）
  const mttr = totalDowntimeCount > 0 
    ? totalDowntimeMinutes / totalDowntimeCount 
    : 0
  
  // 计算MTBF（平均故障间隔时间）
  const mtbf = totalDowntimeCount > 0
    ? (totalWorkMinutes - totalDowntimeMinutes) / totalDowntimeCount
    : totalWorkMinutes
  
  // 计算设备可动率
  const availability = totalWorkMinutes > 0
    ? (totalWorkMinutes - totalDowntimeMinutes) / totalWorkMinutes
    : 1
  
  return {
    mttr,
    mtbf,
    oee: availability, // 简化的OEE计算（仅考虑可用性）
    availability
  }
})

// 根据数值计算颜色类
const mttrColor = computed(() => mttrTrend.value < 0 ? 'text-success' : 'text-error')
const mtbfColor = computed(() => mtbfTrend.value > 0 ? 'text-success' : 'text-error')
const oeeColor = computed(() => {
  const oee = filteredMetricsOverview.value.oee
  if (oee >= 0.9) return 'text-success'
  if (oee >= 0.8) return 'text-info'
  if (oee >= 0.6) return 'text-warning'
  return 'text-error'
})
const availabilityColor = computed(() => {
  const avail = filteredMetricsOverview.value.availability
  if (avail >= 0.9) return 'text-success'
  if (avail >= 0.8) return 'text-info'
  if (avail >= 0.6) return 'text-warning'
  return 'text-error'
})

// 格式化时间（分钟）
const formatTime = (minutes) => {
  if (!minutes) return '0分钟'
  if (minutes < 60) return `${minutes.toFixed(1)}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = (minutes % 60).toFixed(1)
  return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`
}

// 格式化百分比
const formatPercentage = (value) => {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(1)}%`
}

// 加载维修数据指标
const loadMetrics = async () => {
  try {
    loadingMetrics.value = true
    
    // 构建查询参数
    const params = {
      user_id: userStore.userId
    }
    
    // 添加筛选条件
    if (selectedLineType.value !== 'all') {
      params.line_type = selectedLineType.value
    }
    
    if (selectedShift.value !== 'all') {
      params.shift = selectedShift.value
    }
    
    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    // 加载基本指标数据
    const response = await api.get('/maint/metrics', params)
    
    if (response && response.data) {
      // 如果后端返回的数据中没有班次信息，随机分配一个班次（仅用于演示）
      metricsList.value = response.data.map(metric => {
        if (!metric.shift) {
          metric.shift = Math.random() > 0.5 ? 'day' : 'night'
        }
        return metric
      })
      
      // 计算指标概览
      calculateMetricsOverview(response.data)
    }
    
    // 加载趋势图表数据
    await loadChartData()
    
  } catch (error) {
    console.error('加载维修数据指标出错:', error)
    Message.error('加载维修数据指标失败')
    
    // 生成模拟数据用于演示
    generateMockChartData()
  } finally {
    loadingMetrics.value = false
  }
}

// 加载图表数据
const loadChartData = async () => {
  try {
    // 构建查询参数
    const params = {
      user_id: userStore.userId,
      line_type: selectedLineType.value !== 'all' ? selectedLineType.value : undefined,
      shift: selectedShift.value !== 'all' ? selectedShift.value : undefined,
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    
    // 获取OEE和设备可动率趋势
    const oeeRes = await api.get('/maint/charts/oee-trend', params)
    if (oeeRes && oeeRes.data) {
      chartData.value.oeeAvailability = oeeRes.data
    }
    
    // 获取MTTR和MTBF趋势
    const mttrRes = await api.get('/maint/charts/mttr-mtbf-trend', params)
    if (mttrRes && mttrRes.data) {
      chartData.value.mttrMtbf = mttrRes.data
    }
    
    // 获取线体对比数据
    const comparisonRes = await api.get('/maint/charts/line-comparison')
    if (comparisonRes && comparisonRes.data) {
      chartData.value.lineComparison = comparisonRes.data
    }
    
  } catch (error) {
    console.error('加载图表数据出错:', error)
    // 生成模拟数据
    generateMockChartData()
  }
}

// 生成模拟图表数据
const generateMockChartData = () => {
  // 生成日期数组
  const generateDateRange = () => {
    const dates = []
    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])
    
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }
  
  const dates = generateDateRange()
  
  // 生成OEE和设备可动率数据
  chartData.value.oeeAvailability = dates.map(date => {
    const oeeBase = 0.85 + Math.random() * 0.1
    return {
      date,
      oee: oeeBase,
      availability: oeeBase + Math.random() * 0.05
    }
  })
  
  // 生成MTTR和MTBF数据
  chartData.value.mttrMtbf = dates.map(date => {
    return {
      date,
      mttr: Math.floor(30 + Math.random() * 40), // 分钟
      mtbf: Math.floor(1200 + Math.random() * 800) // 分钟
    }
  })
  
  // 生成线体对比数据
  chartData.value.lineComparison = {
    lines: lineTypes,
    metrics: ['可动率', '故障频率', '修复速度', 'OEE', '稳定性'],
    values: lineTypes.map(() => {
      return [
        Math.floor(80 + Math.random() * 20),
        Math.floor(70 + Math.random() * 30),
        Math.floor(75 + Math.random() * 25),
        Math.floor(85 + Math.random() * 15),
        Math.floor(75 + Math.random() * 25)
      ]
    })
  }
}

// 计算指标概览
const calculateMetricsOverview = (metrics) => {
  if (!metrics || metrics.length === 0) {
    return
  }
  
  // 总计
  let totalDowntimeMinutes = 0
  let totalDowntimeCount = 0
  let totalWorkMinutes = metrics.length * 1440 // 假设每天1440分钟
  
  metrics.forEach(metric => {
    totalDowntimeMinutes += Number(metric.downtime_minutes) || 0
    totalDowntimeCount += Number(metric.downtime_count) || 0
  })
  
  // 计算MTTR（平均修复时间）
  const mttr = totalDowntimeCount > 0 
    ? totalDowntimeMinutes / totalDowntimeCount 
    : 0
  
  // 计算MTBF（平均故障间隔时间）
  const mtbf = totalDowntimeCount > 0
    ? (totalWorkMinutes - totalDowntimeMinutes) / totalDowntimeCount
    : totalWorkMinutes
  
  // 计算设备可动率
  const availability = totalWorkMinutes > 0
    ? (totalWorkMinutes - totalDowntimeMinutes) / totalWorkMinutes
    : 1
  
  // 更新指标概览
  metricsOverview.value = {
    mttr,
    mtbf,
    oee: availability, // 简化的OEE计算（仅考虑可用性）
    availability
  }
}

// 打开维修数据指标对话框
const openMetricDialog = (metric = null) => {
  if (metric) {
    // 编辑现有指标
    editedMetricIndex.value = metricsList.value.indexOf(metric)
    editedMetric.value = { ...metric }
  } else {
    // 创建新指标
    editedMetricIndex.value = -1
    editedMetric.value = {
      id: null,
      equipment_type: selectedLineType.value !== 'all' ? selectedLineType.value : '',
      date: new Date().toISOString().split('T')[0],
      shift: selectedShift.value !== 'all' ? selectedShift.value : 'day',
      downtime_count: 0,
      downtime_minutes: 0,
      parts_produced: 0,
      user_id: userStore.userId
    }
  }
  metricDialog.value = true
}

// 关闭维修数据指标对话框
const closeMetricDialog = () => {
  metricDialog.value = false
}

// 编辑维修数据指标
const editMetric = (metric) => {
  openMetricDialog(metric)
}

// 保存维修数据指标
const saveMetric = async () => {
  try {
    savingMetric.value = true
    
    // 验证表单
    if (!editedMetric.value.equipment_type) {
      Message.warning('请选择设备类型')
      return
    }
    
    // 准备请求数据
    const metricData = {
      equipment_type: editedMetric.value.equipment_type,
      date: editedMetric.value.date,
      shift: editedMetric.value.shift || 'day',
      downtime_count: parseInt(editedMetric.value.downtime_count),
      downtime_minutes: parseFloat(editedMetric.value.downtime_minutes),
      parts_produced: parseInt(editedMetric.value.parts_produced),
      user_id: userStore.userId
    }
    
    let response
    
    if (editedMetricIndex.value === -1) {
      // 创建新指标
      response = await api.post('/maint/metrics', metricData)
    } else {
      // 更新现有指标
      response = await api.put(`/maint/metrics/${editedMetric.value.id}`, metricData)
    }
    
    // 关闭对话框
    metricDialog.value = false
    
    // 重新加载数据
    await loadMetrics()
    
    // 提示成功
    Message.success(editedMetricIndex.value === -1 ? '指标创建成功' : '指标更新成功')
    
  } catch (error) {
    console.error('保存维修数据指标出错:', error)
    Message.error('保存维修数据指标失败')
  } finally {
    savingMetric.value = false
  }
}

// 删除维修数据指标
const deleteMetric = async (metric) => {
  try {
    // 发送请求
    await api.del(`/maint/metrics/${metric.id}`)
    
    // 重新加载数据
    await loadMetrics()
    
    // 提示成功
    Message.success('维修数据指标删除成功')
    
  } catch (error) {
    console.error('删除维修数据指标出错:', error)
    Message.error('删除维修数据指标失败')
  }
}

// 监听筛选条件变化
watch([selectedLineType, selectedShift, dateRange], () => {
  console.log('筛选条件变更:', {
    lineType: selectedLineType.value,
    shift: selectedShift.value,
    dateRange: dateRange.value
  })
  
  loadMetrics()
})

// 生命周期钩子
onMounted(() => {
  loadMetrics()
})
</script>

<style scoped>
.text-h4 {
  font-weight: 700;
}

.v-card {
  border-radius: 12px;
}

.date-range-btn {
  min-width: 220px;
}

.filter-tags {
  flex-wrap: wrap;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>