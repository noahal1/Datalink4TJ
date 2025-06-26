<template>
  <v-card class="h-100">
    <v-card-title class="d-flex align-center">
      <span>维修数据指标</span>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="搜索"
        single-line
        hide-details
        class="mx-4"
      ></v-text-field>
      <v-btn 
        color="primary" 
        @click="$emit('add-metric')"
        v-permission="'MAINT:WRITE'"
      >
        <v-icon left>mdi-plus</v-icon>
        添加指标
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="selectedLine"
            :items="lineTypes"
            label="线体"
            variant="outlined"
            density="compact"
            clearable
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="selectedShift"
            :items="shiftTypes"
            label="班次"
            variant="outlined"
            density="compact"
            clearable
          ></v-select>
        </v-col>
      </v-row>
      
      <v-data-table
        :headers="headers"
        :items="filteredMetrics"
        :search="search"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :footer-props="{
          'items-per-page-text': '每页行数',
          'items-per-page-options': [10, 20, 50]
        }"
        class="elevation-1"
        :server-items-length="totalItems"
      >
        <template v-slot:item.line="{ item }">
          <v-chip
            :color="getLineColor(item.line)"
            size="small"
            class="text-white"
          >
            {{ item.line }}
          </v-chip>
        </template>
        
        <template v-slot:item.shift="{ item }">
          <v-chip
            :color="item.shift_code === 1 ? 'amber-darken-1' : 'blue-darken-3'"
            size="small"
            class="text-white"
          >
            {{ item.shift_code === 1 ? '白班' : '夜班' }}
          </v-chip>
        </template>
        
        <template v-slot:item.shift_date="{ item }">
          {{ formatDate(item.shift_date) }}
        </template>
        
        <template v-slot:item.plan_down_time="{ item }">
          <span :class="getTimeColor(item.plan_down_time, 60, 120, false)">
            {{ item.plan_down_time || 0 }}
          </span>
          <v-tooltip activator="parent">
            计划停机时间(分钟)
          </v-tooltip>
        </template>
        
        <template v-slot:item.out_plan_down_time="{ item }">
          <span :class="getTimeColor(item.out_plan_down_time, 30, 60)">
            {{ item.out_plan_down_time || 0 }}
          </span>
          <v-tooltip activator="parent">
            非计划停机时间(分钟)
          </v-tooltip>
        </template>
        
        <template v-slot:item.availability="{ item }">
          {{ formatPercentage(calculateAvailability(item)) }}
          <v-tooltip activator="parent">
            可用率 = 实际运行时间/可用时间<br>
            可用时间 = 720分钟 - 计划停机时间
          </v-tooltip>
        </template>
        
        <template v-slot:item.oee="{ item }">
          <span :class="getOEEColor(item.oee)">
            {{ formatPercentage(item.oee) }}
          </span>
          <v-tooltip activator="parent">
            OEE = 设备综合效率，数据库中存储的实际值
          </v-tooltip>
        </template>
        
        <template v-slot:item.mttr="{ item }">
          <span :class="getMTTRColor(calculateMTTR(item))">
            {{ formatTime(calculateMTTR(item)) }}
          </span>
          <v-tooltip activator="parent">
            平均修复时间(MTTR) = 非计划停机时间 / 故障次数
          </v-tooltip>
        </template>
        
        <template v-slot:item.mtbf="{ item }">
          <span :class="getMTBFColor(calculateMTBF(item))">
            {{ formatTime(calculateMTBF(item)) }}
          </span>
          <v-tooltip activator="parent">
            平均故障间隔时间(MTBF) = 实际运行时间 / 故障次数<br>
            单位：分钟
          </v-tooltip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="$emit('edit-metric', item)"
            v-permission="'MAINT:WRITE'"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            @click="confirmDelete(item)"
            v-permission="'MAINT:ADMIN'"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        
        <template v-slot:no-data>
          <div class="text-center py-4">
            <v-icon icon="mdi-alert-circle-outline" size="large" class="mb-2"></v-icon>
            <div>暂无数据</div>
          </div>
        </template>
        
        <template v-slot:bottom>
          <div class="d-flex align-center">
            <div class="flex-grow-1 text-caption me-2">
              每班总工作时间: 720分钟 (12小时)
            </div>
            
            <!-- 分页组件 -->
            <v-pagination
              v-model="currentPage"
              :length="pageCount"
              :total-visible="7"
              @update:model-value="changePage"
              rounded
            ></v-pagination>
            
            <!-- 显示分页信息 -->
            <div class="text-caption ms-2">
              共 {{ totalItems || 0 }} 条数据
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
    
    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">确认删除</v-card-title>
        <v-card-text>
          您确定要删除这条维修数据指标吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="red darken-1" text @click="deleteItem">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePermissionStore } from '../../stores/permission'

const props = defineProps({
  metrics: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  totalItems: {
    type: Number,
    default: 0
  },
  serverItemsPerPage: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['add-metric', 'edit-metric', 'delete-metric', 'pagination-change', 'filter-change'])

const permissionStore = usePermissionStore()

// 每班总工作时间常量(12小时=720分钟)
const TOTAL_WORK_MINUTES = 720

// 表格表头
const headers = [
  { title: '线体', key: 'line', sortable: true },
  { title: '班次', key: 'shift', sortable: true },
  { title: '日期', key: 'shift_date', sortable: true },
  { title: '计划停机', key: 'plan_down_time', sortable: true, align: 'end' },
  { title: '非计划停机', key: 'out_plan_down_time', sortable: true, align: 'end' },
  { title: 'MTTR', key: 'mttr', sortable: true, align: 'end' },
  { title: 'MTBF', key: 'mtbf', sortable: true, align: 'end' },
  { title: '可动率', key: 'availability', sortable: false, align: 'end' },
  { title: 'OEE', key: 'oee', sortable: true, align: 'end' },
  { title: '生产数量', key: 'amount', sortable: true, align: 'end' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' }
]

const lineTypes = [
  'SWI-L',
  'SWI-R',
  'RWH-L',
  'RWH-R',
  'W01',
  'HF',
  'LC'
]
const shiftTypes = [
  { title: '白班', value: 1 },
  { title: '夜班', value: 2 }
]

// 分页相关
const currentPage = ref(1)
const itemsPerPage = ref(props.serverItemsPerPage)

// 计算总页数
const pageCount = computed(() => {
  if (!props.totalItems) return 1
  return Math.ceil(props.totalItems / itemsPerPage.value)
})

// 筛选和搜索
const selectedLine = ref('')
const selectedShift = ref('')
const search = ref('')

const deleteDialog = ref(false)
const itemToDelete = ref(null)

// 监听筛选条件变化，通知父组件
watch([selectedLine, selectedShift], () => {
  // 重置页码
  currentPage.value = 1
  
  // 通知父组件筛选条件变化
  emit('filter-change', {
    line: selectedLine.value,
    shift_code: selectedShift.value ? Number(selectedShift.value) : undefined
  })
}, { immediate: false })

// 分页变化处理函数
const changePage = (page) => {
  emit('pagination-change', {
    page: page,
    page_size: itemsPerPage.value,
    line: selectedLine.value,
    shift_code: selectedShift.value ? Number(selectedShift.value) : undefined
  })
}

const filteredMetrics = computed(() => {
  // 由于使用服务器分页，这里只处理本地搜索，筛选已经通过API处理
  return props.metrics
})

// 计算设备可动率
const calculateAvailability = (item) => {
  const planDownTime = Number(item.plan_down_time) || 0
  const outPlanDownTime = Number(item.out_plan_down_time) || 0
  
  // 计算可用时间 = 总时间 - 计划停机时间
  const availableTime = TOTAL_WORK_MINUTES - planDownTime
  if (availableTime <= 0) return 0
  
  // 计算实际运行时间 = 可用时间 - 非计划停机时间
  const actualRunTime = Math.max(0, availableTime - outPlanDownTime)
  
  // 可动率 = 实际运行时间 / 可用时间
  return actualRunTime / availableTime * 100
}

// 计算MTTR(平均修复时间)
const calculateMTTR = (item) => {
  const outPlanDownTime = Number(item.out_plan_down_time) || 0
  
  const faultCount = Math.max(1, Math.round(outPlanDownTime / 10))
  return outPlanDownTime / faultCount
}

// 计算MTBF(平均故障间隔时间)
const calculateMTBF = (item) => {
  const planDownTime = Number(item.plan_down_time) || 0
  const outPlanDownTime = Number(item.out_plan_down_time) || 0
  
  // 计算可用时间 = 总时间 - 计划停机时间
  const availableTime = TOTAL_WORK_MINUTES - planDownTime
  if (availableTime <= 0) return 0
  
  // 计算实际运行时间 = 可用时间 - 非计划停机时间
  const actualRunTime = Math.max(0, availableTime - outPlanDownTime)
  
  // 估算故障次数（每30分钟算一次故障，至少1次）
  const faultCount = Math.max(1, Math.round(outPlanDownTime / 30))

  return actualRunTime / faultCount
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 格式化百分比
const formatPercentage = (value) => {
  if (value === null || value === undefined) return '-'
  const percentage = (value).toFixed(2)
  return `${percentage}%`
}

// 获取OEE对应的颜色类名
const getOEEColor = (oee) => {
  const percentage = oee * 100
  if (percentage >= 85) return 'text-success'
  if (percentage >= 75) return 'text-info'
  if (percentage >= 60) return 'text-warning'
  return 'text-error'
}

// 获取时间对应的颜色类名
const getTimeColor = (time, warning, error, isHighBad = true) => {
  time = Number(time) || 0
  
  if (isHighBad) {
    // 高值为差（如非计划停机时间）
    if (time >= error) return 'text-error'
    if (time >= warning) return 'text-warning'
    return 'text-success'
  } else {
    // 高值为好（如计划停机时间）
    if (time >= error) return 'text-info'
    if (time >= warning) return 'text-success'
    return ''
  }
}

// 获取线体对应的颜色
const getLineColor = (line) => {
  const colors = {
    'SWI-L': 'indigo',
    'SWI-R': 'deep-purple',
    'RWH-L': 'teal',
    'RWH-R': 'cyan',
    'W01': 'blue',
    'HF': 'deep-orange',
    'LC': 'green'
  }
  
  return colors[line] || 'grey'
}

// 确认删除
const confirmDelete = (item) => {
  itemToDelete.value = item
  deleteDialog.value = true
}

// 删除项目
const deleteItem = () => {
  emit('delete-metric', itemToDelete.value)
  deleteDialog.value = false
  itemToDelete.value = null
}

// 格式分钟
const formatTime = (minutes) => {
  if (!minutes) return '0'
  return minutes.toFixed(1)
}

// 格式小时 - 改为显示分钟
const formatHours = (minutes) => {
  if (!minutes) return '0'
  return minutes.toFixed(1)
}

// 获取MTTR对应的颜色类名
const getMTTRColor = (mttr) => {
  if (mttr <= 30) return 'text-success'
  if (mttr <= 60) return 'text-info'
  if (mttr <= 120) return 'text-warning'
  return 'text-error'
}

// 获取MTBF对应的颜色类名
const getMTBFColor = (mtbf) => {
  if (mtbf >= 480) return 'text-success'  // 8小时 = 480分钟
  if (mtbf >= 240) return 'text-info'     // 4小时 = 240分钟
  if (mtbf >= 120) return 'text-warning'  // 2小时 = 120分钟
  return 'text-error'
}
</script>

<style scoped>
.text-success {
  color: #4caf50 !important;
}
.text-info {
  color: #2196f3 !important;
}
.text-warning {
  color: #ff9800 !important;
}
.text-error {
  color: #f44336 !important;
}
</style> 