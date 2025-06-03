<template>
  <v-container class="page-container">
    <v-row>
      <v-col cols="12" class="text-center mb-4">
        <h2 class="title">LWD数据管理</h2>
        <div class="week-filter d-flex align-center justify-center">
          <v-text-field
            v-model.number="startWeek"
            label="起始周"
            type="number"
            min="1"
            max="52"
            outlined
            dense
            class="mr-2"
            style="max-width: 120px"
          />
          <v-text-field
            v-model.number="endWeek"
            label="结束周"
            type="number"
            min="1"
            max="52"
            outlined
            dense
            class="mr-2"
            style="max-width: 120px"
          />
          <v-btn 
            color="primary" 
            @click="applyWeekFilter"
            class="ml-2"
            variant="elevated"
          >
            应用筛选
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- 统计摘要 -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="stat-card" color="primary" dark>
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-h6 mb-2">总 LWD 数量</div>
            <div class="text-h3 font-weight-bold">{{ totalLWD }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="stat-card" color="success" dark>
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-h6 mb-2">平均每周 LWD</div>
            <div class="text-h3 font-weight-bold">{{ averageLWD.toFixed(2) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="stat-card" color="warning" dark>
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-h6 mb-2">当前周 LWD</div>
            <div class="text-h3 font-weight-bold">{{ currentWeekLWD }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 数据趋势图 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            LWD 数据趋势
          </v-card-title>
          <v-card-text style="height: 300px">
            <v-chart class="chart" :option="chartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 数据表格 -->
    <v-card flat class="table-card">
      <v-data-table
        :headers="headers"
        :items="filteredData"
        disable-pagination
        hide-default-footer
        fixed-header
        height="50vh"
        class="elevation-1 full-width-table"
      >
        <template v-slot:item.dateRange="{ item }">
          {{ item.dateRange }}
        </template>
        <template v-slot:item.lwd="{ item }">
          <v-text-field
            v-model.number="item.lwd"
            type="number"
            min="0"
            single-line
            density="compact"
            hide-details
            variant="outlined"
            @input="handleInput"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-btn
      v-if="isDataChanged"
      fab
      dark
      color="primary"
      class="floating-button"
      @click="confirmChanges"
      :loading="submitting"
    >
      <v-icon dark>mdi-content-save</v-icon>
    </v-btn>
    
    <app-loader v-if="loading" message="加载数据中..." />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format, startOfWeek, endOfWeek, getISOWeek } from 'date-fns'
import { debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { get, put } from '../utils/api'
import AppLoader from '../components/AppLoader.vue'

const headers = [
  { title: '周', key: 'week', align: 'center', width: 100 },
  { title: '日期范围', key: 'dateRange', align: 'center', width: 200 },
  { title: 'LWD数量', key: 'lwd', align: 'center', width: 150 }
]

// 响应式数据
const allTableData = ref([])
const originalData = ref([])
const isDataChanged = ref(false)
const submitting = ref(false)
const loading = ref(false) 
const startWeek = ref(1)
const endWeek = ref(52)
const filteredData = ref([])

// 计算属性
const totalLWD = computed(() => {
  return filteredData.value.reduce((sum, item) => sum + (item.lwd || 0), 0)
})

const averageLWD = computed(() => {
  const validItems = filteredData.value.filter(item => item.lwd !== undefined && item.lwd !== null)
  if (validItems.length === 0) return 0
  return totalLWD.value / validItems.length
})

const currentWeekLWD = computed(() => {
  const currentWeek = getISOWeek(new Date())
  const currentWeekData = allTableData.value.find(item => item.week === currentWeek)
  return currentWeekData ? currentWeekData.lwd : 0
})

// 图表选项
const chartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} LWD'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: filteredData.value.map(item => `第${item.week}周`)
    },
    yAxis: {
      type: 'value',
      name: 'LWD数量'
    },
    series: [
      {
        name: 'LWD',
        type: 'line',
        data: filteredData.value.map(item => item.lwd || 0),
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        },
        itemStyle: {
          color: '#FB8C00'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  }
})

// 生成周数据
const generateWeeks = () => {
  const weeks = []
  const currentYear = new Date().getFullYear()
  
  let startDate = new Date(currentYear, 0, 4) // 确保从第一周开始
  startDate = startOfWeek(startDate, { weekStartsOn: 1 })

  for (let week = 0; week < 52; week++) {
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (week * 7))
    
    const start = startOfWeek(weekStart, { weekStartsOn: 1 })
    const end = endOfWeek(weekStart, { weekStartsOn: 1 })
    
    const weekNumber = getISOWeek(weekStart)
    
    weeks.push({
      week: weekNumber,
      dateRange: `${format(start, 'MM/dd')} - ${format(end, 'MM/dd')}`,
      lwd: 0
    })
  }
  
  return weeks
}

// 应用周筛选
const applyWeekFilter = () => {
  if (startWeek.value > endWeek.value) {
    ElMessage.warning('起始周不能大于结束周')
    return
  }
  
  filteredData.value = allTableData.value.filter(
    item => item.week >= startWeek.value && item.week <= endWeek.value
  )
}

// 处理输入变化
const handleInput = debounce(() => {
  isDataChanged.value = true
}, 300)

// 确认更改
const confirmChanges = async () => {
  if (!isDataChanged.value) return
  
  submitting.value = true
  try {
    const changedData = []
    
    allTableData.value.forEach((item, index) => {
      const original = originalData.value[index]
      if (item.lwd !== original.lwd) {
        changedData.push({
          week: item.week,
          year: new Date().getFullYear(),
          lwd: item.lwd
        })
      }
    })
    
    if (changedData.length === 0) {
      ElMessage.info('没有数据变更')
      isDataChanged.value = false
      return
    }
    
    await put('/ehs', changedData)
    
    ElMessage.success('数据保存成功')
    await fetchLWDData() // 重新加载数据
    isDataChanged.value = false
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    submitting.value = false
  }
}

// 加载LWD数据
const fetchLWDData = async () => {
  loading.value = true
  try {
    const fetchedData = await get('/ehs')
    
    const initialData = generateWeeks()
    
    fetchedData.forEach((item) => {
      const week = initialData.find(w => w.week === item.week)
      if (week) week.lwd = item.lwd
    })
    
    allTableData.value = initialData
    originalData.value = JSON.parse(JSON.stringify(initialData))
    applyWeekFilter() // 初始化时应用筛选
  } catch (error) {
    console.error(error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化当前周
const initializeCurrentWeek = () => {
  const currentWeek = getISOWeek(new Date())
  startWeek.value = Math.max(1, currentWeek - 2)
  endWeek.value = Math.min(52, currentWeek + 2)
}

// 监听
watch([startWeek, endWeek], () => {
  // 限制输入范围
  startWeek.value = Math.max(1, Math.min(52, startWeek.value))
  endWeek.value = Math.max(1, Math.min(52, endWeek.value))
})

// 生命周期钩子
onMounted(() => {
  initializeCurrentWeek()
  fetchLWDData()
})
</script>

<style scoped>
.page-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 2rem;
  font-weight: 500;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

.week-filter {
  gap: 10px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card {
  border-radius: 8px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.table-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.chart {
  height: 300px;
  width: 100%;
}

.floating-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
  transition: transform 0.4s;
}

.floating-button:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .week-filter {
    flex-wrap: wrap;
  }
}
</style>
