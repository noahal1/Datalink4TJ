<template>
  <unified-page-template title="停机单管理" icon="mdi-clipboard-text" color="primary">
    <template #header-actions>
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus"
        @click="openNewDowntimeRecord"
        v-permission="'MAINT:WRITE'"
      >
        新建停机单
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
              v-model="filters.line"
              color="primary"
              density="comfortable"
              class="mx-2"
            >
              <v-btn value="">全部</v-btn>
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
              v-model="filters.shift"
              color="secondary"
              density="comfortable"
              class="mx-2"
            >
              <v-btn value="">全部</v-btn>
              <v-btn value="day">白班</v-btn>
              <v-btn value="night">夜班</v-btn>
            </v-btn-toggle>
          </div>
          
          <!-- 日期范围 -->
          <div class="d-flex align-center mb-2">
            <div class="text-subtitle-1 me-2">日期范围:</div>
            <v-menu
              v-model="dateMenu"
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
                  {{ dateRangeText }}
                </v-btn>
              </template>
              <v-date-picker
                v-model="filters.dateRange"
                range
                color="primary"
                @update:model-value="dateMenu = false"
              ></v-date-picker>
            </v-menu>
          </div>
          
          <v-spacer></v-spacer>
          
          <div class="d-flex mb-2">
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="搜索"
              hide-details
              density="compact"
              class="me-2"
              style="max-width: 200px;"
            ></v-text-field>
            
            <v-btn 
              color="primary" 
              variant="outlined"
              class="me-2"
              prepend-icon="mdi-filter"
              @click="loadDowntimeRecords"
              :loading="loading"
            >
              应用筛选
            </v-btn>
            
            <v-btn 
              color="secondary" 
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="resetFilters"
            >
              重置
            </v-btn>
          </div>
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
            :color="filters.line ? getLineColor(filters.line) : 'grey'"
            size="small"
            label
          >
            {{ filters.line || '全部线体' }}
          </v-chip>
          
          <v-chip
            class="me-2 mb-1"
            color="secondary"
            size="small"
            label
          >
            {{ filters.shift ? (filters.shift === 'day' ? '白班' : '夜班') : '全部班次' }}
          </v-chip>
          
          <v-chip
            class="me-2 mb-1"
            color="primary"
            size="small"
            label
            v-if="filters.dateRange && filters.dateRange.length === 2"
          >
            {{ dateRangeText }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- 数据表格 -->
    <unified-data-table
      :headers="headers"
      :items="downtimeRecords"
      :loading="loading"
      :search="search"
      :items-per-page="10"
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
          :color="item.shift === 'day' ? 'amber-darken-1' : 'blue-darken-3'"
          size="small"
          class="text-white"
        >
          {{ item.shift === 'day' ? '白班' : '夜班' }}
        </v-chip>
      </template>

      <template v-slot:item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
          class="text-white"
        >
          {{ getStatusText(item.status) }}
        </v-chip>
      </template>

      <template v-slot:item.downtime_minutes="{ item }">
        {{ formatDuration(item.downtime_minutes) }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          variant="text"
          size="small"
          color="primary"
          @click="viewDowntimeRecord(item)"
        >
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="small"
          color="primary"
          @click="editDowntimeRecord(item)"
          v-permission="'MAINT:WRITE'"
          :disabled="item.status === 'closed'"
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
    </unified-data-table>

    <!-- 停机单详情对话框 -->
    <v-dialog v-model="recordDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>{{ dialogTitle }}</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="recordDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form ref="recordForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedRecord.line"
                  :items="lineTypes"
                  label="线体"
                  variant="outlined"
                  :rules="[v => !!v || '请选择线体']"
                  :readonly="viewMode || editedRecord.status === 'closed'"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-radio-group
                  v-model="editedRecord.shift"
                  label="班次"
                  :rules="[v => !!v || '请选择班次']"
                  :readonly="viewMode || editedRecord.status === 'closed'"
                  inline
                >
                  <v-radio value="day" label="白班"></v-radio>
                  <v-radio value="night" label="夜班"></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.date"
                  label="日期"
                  type="date"
                  variant="outlined"
                  :rules="[v => !!v || '请选择日期']"
                  :readonly="viewMode || editedRecord.status === 'closed'"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedRecord.status"
                  :items="statusTypes"
                  label="状态"
                  variant="outlined"
                  :rules="[v => !!v || '请选择状态']"
                  :readonly="viewMode"
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.downtime_minutes"
                  label="停机时间(分钟)"
                  type="number"
                  min="0"
                  step="1"
                  variant="outlined"
                  :rules="[v => v >= 0 || '停机时间不能为负数']"
                  :readonly="viewMode || editedRecord.status === 'closed'"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.equipment_name"
                  label="设备名称"
                  variant="outlined"
                  :rules="[v => !!v || '请输入设备名称']"
                  :readonly="viewMode || editedRecord.status === 'closed'"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editedRecord.fault_description"
                  label="故障描述"
                  variant="outlined"
                  rows="3"
                  :rules="[v => !!v || '请输入故障描述']"
                  :readonly="viewMode || editedRecord.status === 'closed'"
                ></v-textarea>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editedRecord.resolution"
                  label="解决方案"
                  variant="outlined"
                  rows="3"
                  :readonly="viewMode"
                ></v-textarea>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.reporter_name"
                  label="报告人"
                  variant="outlined"
                  :readonly="viewMode || editedRecord.status === 'closed'"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.maintainer_name"
                  label="维修人员"
                  variant="outlined"
                  :readonly="viewMode"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions v-if="!viewMode">
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="recordDialog = false">取消</v-btn>
          <v-btn 
            color="primary" 
            @click="saveDowntimeRecord" 
            :loading="saving"
            :disabled="saving || (editedRecord.status === 'closed' && editedIndex !== -1)"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">确认删除</v-card-title>
        <v-card-text>
          您确定要删除这条停机记录吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" text @click="deleteDowntimeRecord">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user.js'
import { usePermissionStore } from '../stores/permission'
import Message from '../utils/notification'
import api from '../utils/api'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '../components/UnifiedDataTable.vue'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 数据表格头
const headers = [
  { title: '线体', key: 'line', sortable: true },
  { title: '班次', key: 'shift', sortable: true },
  { title: '日期', key: 'date', sortable: true },
  { title: '设备名称', key: 'equipment_name', sortable: true },
  { title: '停机时间', key: 'downtime_minutes', sortable: true, align: 'end' },
  { title: '状态', key: 'status', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'center' }
]

// 线体类型
const lineTypes = ['SWI-L', 'SWI-R', 'RWH-L', 'RWH-R', 'W01', 'HF', 'LC']

// 班次类型
const shiftTypes = [
  { title: '白班', value: 'day' },
  { title: '夜班', value: 'night' }
]

// 状态类型
const statusTypes = [
  { title: '待处理', value: 'pending' },
  { title: '处理中', value: 'in_progress' },
  { title: '已关闭', value: 'closed' }
]

// 筛选和搜索
const search = ref('')

// 筛选条件
const filters = ref({
  line: '',
  shift: '',
  dateRange: []
})

// 日期选择
const dateMenu = ref(false)
const dateRangeText = computed(() => {
  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    return `${filters.value.dateRange[0]} 至 ${filters.value.dateRange[1]}`
  }
  return '选择日期范围'
})

// 停机记录数据
const downtimeRecords = ref([])
const loading = ref(false)
const saving = ref(false)

// 对话框控制
const recordDialog = ref(false)
const deleteDialog = ref(false)
const viewMode = ref(false)
const editedIndex = ref(-1)
const editedRecord = ref(defaultDowntimeRecord())
const recordToDelete = ref(null)

// 对话框标题
const dialogTitle = computed(() => {
  if (viewMode.value) {
    return '停机单详情'
  }
  return editedIndex.value === -1 ? '新建停机单' : '编辑停机单'
})

// 默认停机记录
function defaultDowntimeRecord() {
  return {
    id: null,
    line: '',
    shift: 'day',
    date: new Date().toISOString().substr(0, 10),
    status: 'pending',
    downtime_minutes: 0,
    equipment_name: '',
    fault_description: '',
    resolution: '',
    reporter_name: userStore.userName || '',
    maintainer_name: '',
    user_id: userStore.userId
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    line: '',
    shift: '',
    dateRange: []
  }
  search.value = ''
  loadDowntimeRecords()
}

// 加载停机记录
const loadDowntimeRecords = async () => {
  try {
    loading.value = true
    
    // 构建查询参数
    const params = {
      user_id: userStore.userId
    }
    
    // 添加筛选条件
    if (filters.value.line) {
      params.line = filters.value.line
    }
    
    if (filters.value.shift) {
      params.shift = filters.value.shift
    }
    
    // 添加日期范围
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      params.start_date = filters.value.dateRange[0]
      params.end_date = filters.value.dateRange[1]
    }
    
    const response = await api.get('/maint/downtime-records', params)
    
    if (response && response.data) {
      // 模拟数据 - 实际应该从API返回
      downtimeRecords.value = response.data.length > 0 ? response.data : generateMockData()
    }
    
  } catch (error) {
    console.error('加载停机记录出错:', error)
    Message.error('加载停机记录失败')
    // 模拟数据 - 实际环境应删除
    downtimeRecords.value = generateMockData()
  } finally {
    loading.value = false
  }
}

// 临时模拟数据 - 实际环境应删除
const generateMockData = () => {
  const records = []
  const statuses = ['pending', 'in_progress', 'closed']
  
  for (let i = 0; i < 15; i++) {
    const line = lineTypes[Math.floor(Math.random() * lineTypes.length)]
    const shift = Math.random() > 0.5 ? 'day' : 'night'
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    
    records.push({
      id: i + 1,
      line,
      shift,
      date: date.toISOString().substr(0, 10),
      status,
      downtime_minutes: Math.floor(Math.random() * 180) + 10,
      equipment_name: `${line}-设备${Math.floor(Math.random() * 10) + 1}`,
      fault_description: `${line}线体设备故障，需要维修。`,
      resolution: status === 'closed' ? '已完成维修并恢复生产' : '',
      reporter_name: '张三',
      maintainer_name: status !== 'pending' ? '李四' : '',
      user_id: userStore.userId
    })
  }
  
  return records
}

// 查看停机记录
const viewDowntimeRecord = (record) => {
  editedIndex.value = downtimeRecords.value.indexOf(record)
  editedRecord.value = { ...record }
  viewMode.value = true
  recordDialog.value = true
}

// 编辑停机记录
const editDowntimeRecord = (record) => {
  editedIndex.value = downtimeRecords.value.indexOf(record)
  editedRecord.value = { ...record }
  viewMode.value = false
  recordDialog.value = true
}

// 打开新建停机单对话框
const openNewDowntimeRecord = () => {
  editedIndex.value = -1
  editedRecord.value = defaultDowntimeRecord()
  viewMode.value = false
  recordDialog.value = true
}

// 保存停机记录
const saveDowntimeRecord = async () => {
  // TODO: 添加表单验证
  
  try {
    saving.value = true
    
    // 准备请求数据
    const recordData = { ...editedRecord.value }
    
    let response
    
    if (editedIndex.value === -1) {
      // 创建新停机单
      response = await api.post('/maint/downtime-records', recordData)
    } else {
      // 更新现有停机单
      response = await api.put(`/maint/downtime-records/${recordData.id}`, recordData)
    }
    
    // 关闭对话框
    recordDialog.value = false
    
    // 重新加载数据
    await loadDowntimeRecords()
    
    // 提示成功
    Message.success(editedIndex.value === -1 ? '停机单创建成功' : '停机单更新成功')
    
  } catch (error) {
    console.error('保存停机记录出错:', error)
    Message.error('保存停机记录失败')
    
    // 模拟数据保存成功 - 实际环境应删除
    if (editedIndex.value === -1) {
      // 创建新停机单
      editedRecord.value.id = downtimeRecords.value.length + 1
      downtimeRecords.value.push(editedRecord.value)
    } else {
      // 更新现有停机单
      Object.assign(downtimeRecords.value[editedIndex.value], editedRecord.value)
    }
    
    // 关闭对话框
    recordDialog.value = false
    
    // 提示成功
    Message.success(editedIndex.value === -1 ? '停机单创建成功' : '停机单更新成功')
  } finally {
    saving.value = false
  }
}

// 确认删除
const confirmDelete = (record) => {
  recordToDelete.value = record
  deleteDialog.value = true
}

// 删除停机记录
const deleteDowntimeRecord = async () => {
  try {
    // 发送请求
    await api.del(`/maint/downtime-records/${recordToDelete.value.id}`)
    
    // 重新加载数据
    await loadDowntimeRecords()
    
    // 提示成功
    Message.success('停机单删除成功')
    
  } catch (error) {
    console.error('删除停机记录出错:', error)
    Message.error('删除停机记录失败')
    
    // 模拟删除成功 - 实际环境应删除
    const index = downtimeRecords.value.findIndex(r => r.id === recordToDelete.value.id)
    if (index !== -1) {
      downtimeRecords.value.splice(index, 1)
    }
    
    // 提示成功
    Message.success('停机单删除成功')
  } finally {
    deleteDialog.value = false
    recordToDelete.value = null
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 格式化时间（分钟）
const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '-'
  
  minutes = Number(minutes)
  if (minutes < 60) return `${minutes}分钟`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`
}

// 获取线体颜色
const getLineColor = (type) => {
  const colors = {
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

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'in_progress': '处理中',
    'closed': '已关闭'
  }
  return statusMap[status] || status
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'in_progress': 'info',
    'closed': 'success'
  }
  return colorMap[status] || 'grey'
}

// 生命周期钩子
onMounted(() => {
  loadDowntimeRecords()
})
</script> 