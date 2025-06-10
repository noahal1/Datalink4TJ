<template>
  <unified-page-template 
    title="LWD数据管理"
    icon="mdi-security"
    color="success"
  >
    <div class="week-filter d-flex align-center justify-center mb-6">
      <v-text-field
        v-model.number="startWeek"
        label="起始周"
        type="number"
        min="1"
        max="52"
        variant="outlined"
        density="comfortable"
        class="mr-2"
        style="max-width: 120px"
      />
      <v-text-field
        v-model.number="endWeek"
        label="结束周"
        type="number"
        min="1"
        max="52"
        variant="outlined"
        density="comfortable"
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

    <!-- 统计摘要 -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <unified-stats-card
          title="总 LWD 数量"
          :value="totalLWD"
          icon="mdi-counter"
          color="primary"
        />
      </v-col>
      <v-col cols="12" md="4">
        <unified-stats-card
          title="平均每周 LWD"
          :value="averageLWD.toFixed(2)"
          icon="mdi-chart-bar"
          color="success"
        />
      </v-col>
      <v-col cols="12" md="4">
        <unified-stats-card
          title="当前周 LWD"
          :value="currentWeekLWD"
          icon="mdi-calendar-week"
          color="warning"
        />
      </v-col>
    </v-row>

    <!-- 数据趋势图 -->
    <unified-data-table
      title="LWD 数据趋势"
      icon="mdi-chart-line"
      :headers="[]"
      :items="[]"
      hide-default-footer
      :loading="false"
      class="mb-6"
    >
      <template #pre-table>
        <div style="height: 300px">
          <v-chart class="chart" :option="chartOption" autoresize />
        </div>
      </template>
    </unified-data-table>

    <!-- 数据表格 -->
    <unified-data-table
      title="LWD 周数据"
      icon="mdi-table"
      :headers="headers"
      :items="filteredData"
      disable-pagination
      hide-default-footer
      fixed-header
      height="50vh"
      :loading="loading"
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
    </unified-data-table>

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
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format, startOfWeek, endOfWeek, getISOWeek } from 'date-fns'
import { debounce } from 'lodash-es'
import Message from '../utils/notification'
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

// 输入处理
const handleInput = debounce(() => {
  isDataChanged.value = true
}, 500)

// 应用周筛选
const applyWeekFilter = () => {
  if (startWeek.value > endWeek.value) {
    Message.warning('起始周不能大于结束周')
    return
  }
  
  filteredData.value = allTableData.value.filter(item => 
    item.week >= startWeek.value && item.week <= endWeek.value
  )
}

// 加载LWD数据
const loadLWDData = async () => {
  loading.value = true
  try {
    const response = await get('/ehs/lwd')
    const currentYear = new Date().getFullYear()
    
    // 根据实际周数生成数据模板
    const weekData = Array.from({ length: 53 }, (_, i) => {
      if (i === 0) return null // 忽略第0周
      
      const weekStart = startOfWeek(new Date(currentYear, 0, i * 7 - 3), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(new Date(currentYear, 0, i * 7 - 3), { weekStartsOn: 1 })
      
      return {
        week: i,
        dateRange: `${format(weekStart, 'MM/dd')} - ${format(weekEnd, 'MM/dd')}`,
        lwd: 0
      }
    }).filter(Boolean) // 移除null值
    
    // 填充API返回的实际数据
    if (response && Array.isArray(response)) {
      response.forEach(item => {
        const targetWeek = weekData.find(w => w.week === parseInt(item.week))
        if (targetWeek) {
          targetWeek.lwd = item.lwd
        }
      })
    }
    
    allTableData.value = weekData
    originalData.value = JSON.parse(JSON.stringify(weekData))
    
    // 应用默认筛选
    applyWeekFilter()
    
  } catch (error) {
    console.error('加载LWD数据失败:', error)
    Message.error('加载LWD数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 确认更改
const confirmChanges = async () => {
  if (!isDataChanged.value) {
    Message.info('没有数据需要保存')
    return
  }
  
  submitting.value = true
  try {
    const changedData = allTableData.value.filter((item, index) => {
      const originalItem = originalData.value[index]
      return item.lwd !== originalItem.lwd
    })
    
    if (changedData.length === 0) {
      Message.info('没有数据变更')
      submitting.value = false
      return
    }
    
    // 格式化为API需要的格式
    const apiData = changedData.map(item => ({
      week: item.week,
      lwd: item.lwd
    }))
    
    await put('/ehs/lwd', apiData)
    
    // 更新原始数据
    originalData.value = JSON.parse(JSON.stringify(allTableData.value))
    isDataChanged.value = false
    
    Message.success('数据保存成功')
  } catch (error) {
    console.error('保存LWD数据失败:', error)
    Message.error('保存失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 初始化
onMounted(() => {
  loadLWDData()
})
</script>

<style scoped>
.week-filter {
  gap: 10px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  .week-filter {
    flex-wrap: wrap;
  }
}
</style>
