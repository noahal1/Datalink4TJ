<template>
  <v-container class="page-container">
    <v-row>
      <v-col cols="12" class="text-center mb-6">
        <h2 class="title">LWD数据</h2>
      </v-col>
    </v-row>
    <v-row class="table-container" dense>
      <v-col
        v-for="(table, index) in tables"
        :key="index"
        cols="12"
        md="4"
        sm="6"
      >
        <v-card flat class="table-card mb-4">
          <v-data-table
            :headers="headers"
            :items="table.data"
            hide-default-footer
            disable-pagination
            class="elevation-1"
          >
            <template #[`item.dateRange`]="{ item }">
              {{ item.dateRange }}
            </template>
            <template #[`item.lwd`]="{ item }">
              <v-text-field
                v-model.number="item.lwd"
                type="number"
                min="0"
                single-line
                dense
                hide-details
                @input="handleInput"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

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
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      height="3"
      class="absolute top-0"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, startOfWeek, endOfWeek, getISOWeek } from 'date-fns'
import { debounce } from 'lodash-es'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const headers = [
  { text: '周', value: 'week', align: 'center', width: 100 },
  { text: '日期范围', value: 'dateRange', align: 'center' },
  { text: 'LWD数量', value: 'lwd', align: 'center', width: 120 }
]

// 响应式数据
const allTableData = ref([])
const originalData = ref([])
const isDataChanged = ref(false)
const submitting = ref(false)
const loading = ref(false) // 添加加载状态

// 生成周数据
const generateWeeks = () => {
  const weeks = []
  const currentYear = new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 1)
  
  while (startDate.getFullYear() === currentYear) {
    const weekNumber = getISOWeek(startDate)
    const start = startOfWeek(startDate, { weekStartsOn: 1 })
    const end = endOfWeek(startDate, { weekStartsOn: 1 })
    
    weeks.push({
      week: weekNumber,
      dateRange: `${format(start, 'MM月dd日')} - ${format(end, 'MM月dd日')}`,
      lwd: 0,
    })
    
    startDate.setDate(startDate.getDate() + 7)
  }
  return weeks
}

// 表格分页
const tables = computed(() => {
  const chunkSize = Math.ceil(allTableData.value.length / 3)
  return [
    { data: allTableData.value.slice(0, chunkSize) },
    { data: allTableData.value.slice(chunkSize, chunkSize * 2) },
    { data: allTableData.value.slice(chunkSize * 2) }
  ]
})

const handleInput = debounce(() => {
  isDataChanged.value = allTableData.value.some((row, index) => 
    row.lwd !== originalData.value[index].lwd
  )
}, 300)

const confirmChanges = async () => {
  submitting.value = true
  try {
    const changedData = allTableData.value
      .map((row, index) => ({ 
        week: row.week, 
        year: new Date().getFullYear(),
        lwd: row.lwd 
      }))
      .filter((row, index) => row.lwd !== originalData.value[index].lwd)

    const response = await fetch(`${API_BASE_URL}/ehs/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changedData)
    })

    if (!response.ok) throw new Error('更新失败')
    
    await fetchLWDData()
    isDataChanged.value = false
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 获取数据
const fetchLWDData = async () => {
  loading.value = true // 开始加载时显示加载条
  try {
    const response = await fetch(`${API_BASE_URL}/ehs/`)
    if (!response.ok) throw new Error('数据加载失败')
    
    const fetchedData = await response.json()
    const initialData = generateWeeks()
    
    fetchedData.forEach ((item) => {
      const week = initialData.find(w => w.week === item.week)
      if (week) week.lwd = item.lwd
    })
    
    allTableData.value = initialData
    originalData.value = initialData.map(item => ({ ...item }))
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false // 加载完成时隐藏加载条
  }
}

onMounted(() => {
  fetchLWDData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  min-height: calc(100vh - 64px); 
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #535353;
  margin-bottom: 0.5px;
}

.table-container {
  margin-top: 10px;
}

.table-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 6px 6px rgba(0, 0, 0, 0.1);
}

.floating-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
  transition: transform 0.4s;
}

.floating-button:hover {
  transform: scale(1.5);
}

.v-data-table :deep(th) {
  background-color: #ffffff59;
  color: #1976D2;
  font-weight: bold;
}

.v-data-table :deep(td) {
  padding: 10px 12px !important;
  border-bottom: 0px solid #e0e0e0;
}

.v-data-table :deep(tr:hover) {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .floating-button {
    bottom: 16px;
    right: 16px;
    transform: scale(0.9);
  }
}
</style>
