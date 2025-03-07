<template>
  <v-container class="page-container">
    <v-row>
      <v-col cols="12" class="text-center mb-2">
        <h2 class="title">LWD数据</h2>
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
            style="max-width: 500px"
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
            style="max-width: 500px"
          />
          <v-btn 
            color="primary" 
            @click="applyWeekFilter"
            class="ml-2"
            style="height: 40px ;top: -10px;"
          >
            跳转
          </v-btn>
        </div>
      </v-col>
    </v-row>


    <!-- 数据表格 -->
    <v-card flat class="table-card">
      <v-data-table
        :items="filteredData"
        disable-pagination
        hide-default-footer
        fixed-header
        height="70vh"
        class="elevation-1 full-width-table"
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
import { ElMessage } from 'element-plus'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const headers = [
  { text: '周', value: 'week', align: 'center', width: 100, fixed: true },
  { text: '日期范围', value: 'dateRange', align: 'center', width: 200 },
  { text: 'LWD数量', value: 'lwd', align: 'center', width: 150 }
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

const generateWeeks = () => {
  const weeks = []
  const currentYear = new Date().getFullYear()
  
  let startDate = new Date(currentYear, 0, 4) // 确保从第一周开始
  startDate = startOfWeek(startDate, { weekStartsOn: 1 })

  for (let week = 0; week < 52; week++) {
    const weekStart = new Date(startDate)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    
    weeks.push({
      week: getISOWeek(weekStart),
      dateRange: `${format(weekStart, 'MM/dd')} - ${format(weekEnd, 'MM/dd')}`,
      lwd: 0,
    })

    startDate.setDate(startDate.getDate() + 7)
  }
  return weeks
}

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
    ElMessage.success('更新成功')
    await fetchLWDData()
    isDataChanged.value = false
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const applyWeekFilter = () => {
  filteredData.value = allTableData.value.filter(item => 
    item.week >= startWeek.value && item.week <= endWeek.value
  )
}

const fetchLWDData = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/ehs/`)
    if (!response.ok) throw new Error('数据加载失败')
    
    const fetchedData = await response.json()
    const initialData = generateWeeks()
    
    fetchedData.forEach((item) => {
      const week = initialData.find(w => w.week === item.week)
      if (week) week.lwd = item.lwd
    })
    
    allTableData.value = initialData
    originalData.value = initialData.map(item => ({ ...item }))
    applyWeekFilter() // 初始化时应用筛选
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
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

.table-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.v-data-table-header) {
  background-color: #f5f7fa;
  th {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #1a237e !important;
  }
}

:deep(.v-data-table__td) {
  padding: 12px 16px !important;
  font-size: 14px;
}
:deep(.v-text-field--outlined.v-input--is-focused fieldset) {
  border-color: #3f51b5 !important;
  box-shadow: 0 2px 4px rgba(63, 81, 181, 0.2);
}
.floating-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
  transition: transform 0.4s;
}
.v-progress-linear {
  box-shadow: 0 2px 4px rgba(63, 81, 181, 0.2);
  z-index: 1001;
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
    padding: 12px;
    
    .v-text-field {
      flex: 1 1 45%;
      max-width: 45%;
    }
    
    .v-btn {
      flex: 1 1 100%;
      margin-top: 8px;
    }
  }
  
  :deep(.v-data-table__wrapper) {
    overflow-x: auto;
    
    table {
      min-width: 600px;
    }
  }
  
  .floating-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
  transition: transform 0.4s;
}
}

</style>
