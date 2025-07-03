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
      <v-btn
        color="success"
        prepend-icon="mdi-file-export"
        class="ml-2"
        @click="exportToCSV"
        :loading="exporting"
        :disabled="!downtimeRecords.length"
      >
        导出CSV
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
                :key="line.value" 
                :value="line.value"
                :color="getLineColor(line.value)"
              >
                {{ line.title }}
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
              <v-btn value="白班">白班</v-btn>
              <v-btn value="夜班">夜班</v-btn>
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
              @click="applyFilters"
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
            {{ filters.line ? (lineTypes.find(l => l.value === filters.line)?.title || filters.line) : '全部线体' }}
          </v-chip>
          
          <v-chip
            v-if="filters.shift"
            class="me-2 mb-1"
            :color="filters.shift === '白班' ? 'amber-darken-1' : 'blue-darken-3'"
            size="small"
            label
          >
            {{ filters.shift }}
          </v-chip>
          <v-chip
            v-else
            class="me-2 mb-1"
            color="grey"
            size="small"
            label
          >
            全部班次
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
          
          <v-spacer></v-spacer>
          
          <v-btn
            icon
            variant="text"
            color="primary"
            @click="applyFilters"
            :loading="loading"
            class="me-2"
          >
            <v-icon>mdi-refresh</v-icon>
            <v-tooltip activator="parent">刷新数据</v-tooltip>
          </v-btn>
          
          <v-chip
            color="info"
            size="small"
            class="me-2"
            v-if="downtimeRecords.length > 0"
          >
            共 {{ downtimeRecords.length }} 条记录
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- 数据统计信息 -->
    <v-card class="mb-4" v-if="downtimeRecords.length > 0">
      <v-card-text class="py-2">
        <v-row>
          <v-col cols="12" md="4">
            <div class="d-flex align-center">
              <v-icon color="primary" class="me-2">mdi-clock-outline</v-icon>
              <div>
                <div class="text-subtitle-2">总停机时间</div>
                <div class="text-h6">{{ calculateTotalDowntime() }}</div>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" md="4">
            <div class="d-flex align-center">
              <v-icon color="warning" class="me-2">mdi-counter</v-icon>
              <div>
                <div class="text-subtitle-2">停机次数</div>
                <div class="text-h6">{{ downtimeRecords.length }} 次</div>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" md="4">
            <div class="d-flex align-center">
              <v-icon color="success" class="me-2">mdi-chart-timeline-variant</v-icon>
              <div>
                <div class="text-subtitle-2">平均每次停机时间</div>
                <div class="text-h6">{{ calculateAverageDowntime() }}</div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 数据表格 -->
    <unified-data-table
      :headers="headers"
      :items="downtimeRecords"
      :loading="loading"
      :search="search"
      :items-per-page="10"
      v-model:selected="selectedItems"
      show-select
    >
      <template v-slot:top>
        <div class="d-flex align-center mb-3" v-if="selectedItems.length > 0">
          <v-chip
            color="primary"
            class="mr-2"
          >
            已选择 {{ selectedItems.length }} 项
          </v-chip>
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            prepend-icon="mdi-delete-sweep"
            @click="confirmBatchDelete"
            v-permission="'MAINT:ADMIN'"
          >
            批量删除
          </v-btn>
        </div>
      </template>

      <template v-slot:item.line="{ item }">
        <v-chip
          :color="getLineColor(item.line)"
          size="small"
          class="text-white"
        >
          {{ item.line }}
        </v-chip>
      </template>

      <template v-slot:item.type_name="{ item }">
        {{ item.type_name || '-' }}
      </template>

      <template v-slot:item.reason_name="{ item }">
        {{ item.reason_name || '-' }}
      </template>

      <template v-slot:item.start_time="{ item }">
        {{ formatDateTime(item.start_time) }}
      </template>

      <template v-slot:item.end_time="{ item }">
        {{ formatDateTime(item.end_time) }}
      </template>

      <template v-slot:item.duration="{ item }">
        {{ calculateDuration(item.start_time, item.end_time) }}
      </template>

      <template v-slot:item.shift="{ item }">
        <v-chip
          :color="item.shift === '白班' ? 'amber-darken-1' : 'blue-darken-3'"
          size="small"
          class="text-white"
        >
          {{ item.shift }}
        </v-chip>
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
          <div v-if="viewMode" class="mb-4 text-body-2">
            <v-alert
              type="info"
              text
              density="compact"
              variant="tonal"
              class="mb-2"
            >
              此功能主要用于数据浏览，仅在需要添加备注时才使用编辑功能。
            </v-alert>
          </div>
          
          <v-form ref="recordForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedRecord.line"
                  :items="lineTypes"
                  label="线体"
                  variant="outlined"
                  :rules="viewMode ? [] : [v => !!v || '请选择线体']"
                  :readonly="viewMode"
                  item-value="value"
                  item-title="title"
                  :return-object="false"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedRecord.type_code"
                  :items="typeOptions"
                  item-title="name"
                  item-value="code"
                  label="停机类型"
                  variant="outlined"
                  :rules="viewMode ? [] : [v => !!v || '请选择停机类型']"
                  :readonly="viewMode"
                  @update:model-value="onTypeChange"
                  :return-object="false"
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedRecord.reason_code"
                  :items="reasonOptions"
                  item-title="name"
                  item-value="code"
                  label="停机原因"
                  variant="outlined"
                  :rules="viewMode ? [] : [v => !!v || '请选择停机原因']"
                  :readonly="viewMode"
                  @update:model-value="onReasonChange"
                  :return-object="false"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.remark"
                  label="备注"
                  variant="outlined"
                  :readonly="viewMode"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.start_time"
                  label="开始时间"
                  type="datetime-local"
                  variant="outlined"
                  :rules="viewMode ? [] : [v => !!v || '请选择开始时间']"
                  :readonly="viewMode"
                  @update:model-value="onStartTimeChange"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRecord.end_time"
                  label="结束时间"
                  type="datetime-local"
                  variant="outlined"
                  :rules="viewMode ? [] : [
                    v => !!v || '请选择结束时间',
                    v => !v || !editedRecord.start_time || new Date(v) > new Date(editedRecord.start_time) || '结束时间必须晚于开始时间'
                  ]"
                  :readonly="viewMode"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row v-if="viewMode">
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3">
                  <div class="text-subtitle-2 mb-1">持续时间</div>
                  <div class="text-h6">
                    {{ calculateDuration(editedRecord.start_time, editedRecord.end_time) }}
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-chip
                  class="mt-2"
                  :color="editedRecord.shift === '白班' ? 'amber-darken-1' : 'blue-darken-3'"
                  size="large"
                  label
                >
                  班次: {{ editedRecord.shift }}
                  <v-tooltip activator="parent" location="end">
                    班次根据开始时间自动判断：7:30-19:30为白班，其余为夜班
                  </v-tooltip>
                </v-chip>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="recordDialog = false">{{ viewMode ? '关闭' : '取消' }}</v-btn>
          <v-btn 
            v-if="viewMode" 
            color="primary" 
            @click="viewMode = false"
            v-permission="'MAINT:WRITE'"
          >
            编辑备注
          </v-btn>
          <v-btn 
            v-else
            color="primary" 
            @click="saveDowntimeRecord" 
            :loading="saving"
            :disabled="saving"
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

    <!-- 批量删除确认对话框 -->
    <v-dialog v-model="batchDeleteDialog" max-width="450">
      <v-card>
        <v-card-title class="headline">批量删除确认</v-card-title>
        <v-card-text>
          您确定要删除选中的 {{ selectedItems.length }} 条停机记录吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="batchDeleteDialog = false">取消</v-btn>
          <v-btn 
            color="error" 
            text 
            @click="batchDeleteDowntimeRecords"
            :loading="batchDeleting"
            :disabled="batchDeleting"
          >
            删除
          </v-btn>
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
import { downtimeService } from '../services'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 数据表格头
const headers = [
  { title: '线体', key: 'line', sortable: true },
  { title: '停机类型', key: 'type_name', sortable: true },
  { title: '停机原因', key: 'reason_name', sortable: true },
  { title: '开始时间', key: 'start_time', sortable: true },
  { title: '结束时间', key: 'end_time', sortable: true },
  { title: '持续时间', key: 'duration', sortable: false },
  { title: '班次', key: 'shift', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'center' }
]

// 线体类型
const lineTypes = [
  { value: 'SWI-L', title: 'SWI-L' },
  { value: 'SWI-R', title: 'SWI-R' },
  { value: 'RWH-L', title: 'RWH-L' },
  { value: 'RWH-R', title: 'RWH-R' },
  { value: 'W01', title: 'W01' },
  { value: 'HF', title: 'HF' },
  { value: 'LC', title: 'LC' }
]

// 停机类型和原因选项
const typeOptions = ref([])
const reasonOptions = ref([])

// 筛选和搜索
const search = ref('')

// 筛选条件
const filters = ref({
  line: '',
  dateRange: [],
  shift: ''
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
const recordToDelete = ref(null)

// 对话框标题
const dialogTitle = computed(() => {
  if (viewMode.value) {
    return '停机单详情查看'
  }
  return editedIndex.value === -1 ? '新建停机单' : '编辑停机单'
})

// 格式化日期时间（用于输入框）- 提前定义此函数
const formatDateTimeForInput = (date) => {
  if (!date) return ''
  
  // 如果已经是字符串格式，尝试解析再格式化
  if (typeof date === 'string') {
    try {
      date = new Date(date)
    } catch (e) {
      console.error('日期格式化错误:', e)
      return date // 如果解析失败，返回原字符串
    }
  }
  
  if (!(date instanceof Date) || isNaN(date)) {
    console.error('无效的日期对象:', date)
    return ''
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 判断班次
const determineShift = (dateTimeStr) => {
  if (!dateTimeStr) return '白班'
  
  const date = new Date(dateTimeStr)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  
  // 7:30-19:30 是白班，其余时间是夜班
  if ((hours > 7 || (hours === 7 && minutes >= 30)) && 
      (hours < 19 || (hours === 19 && minutes <= 30))) {
    return '白班'
  } else {
    return '夜班'
  }
}

// 默认停机记录
function defaultDowntimeRecord() {
  const now = new Date()
  const startTimeStr = formatDateTimeForInput(now)
  const shift = determineShift(startTimeStr)
  const shift_code = shift === "白班" ? 1 : 2
  
  return {
    down_id: null,
    line: '',
    type_code: 'PLANNED',  // 设置默认值，避免验证错误
    type_name: '计划停机',  // 设置默认值
    reason_code: '',
    reason_name: '',
    start_time: startTimeStr,
    end_time: formatDateTimeForInput(now),
    remark: '',
    shift: shift,
    shift_code: shift_code
  }
}

const editedRecord = ref(defaultDowntimeRecord())

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    line: '',
    dateRange: [],
    shift: ''
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
      skip: 0,
      limit: 100 // 增加默认限制，确保返回足够数据
    }
    
    // 添加线体筛选条件
    if (filters.value.line) {
      params.line = filters.value.line
      console.log('应用线体筛选:', filters.value.line)
    }
    
    // 添加班次筛选 - 使用shift字段而不是shift_code，因为后端会处理转换
    if (filters.value.shift) {
      params.shift = filters.value.shift
      console.log('应用班次筛选:', filters.value.shift)
    }
    
    // 添加日期范围
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      try {
        // 确保日期格式正确，并且转换为后端期望的格式
        // 开始时间设为当天00:00:00
        const startDate = new Date(filters.value.dateRange[0]);
        startDate.setHours(0, 0, 0, 0);
        
        // 结束时间设为当天23:59:59
        const endDate = new Date(filters.value.dateRange[1]);
        endDate.setHours(23, 59, 59, 999);
        
        // 使用ISO格式字符串，后端会自动解析
        params.start_from = startDate.toISOString();
        params.start_to = endDate.toISOString();
        
        console.log('应用日期范围筛选:', params.start_from, '至', params.start_to);
      } catch (e) {
        console.error('日期格式化失败:', e);
      }
    }
    
    // 直接展开对象，避免嵌套params
    console.log('查询停机记录最终参数:', JSON.stringify(params));
    
    // 确保请求正确发送
    try {
      // 在请求前清空旧数据，避免界面闪烁
      downtimeRecords.value = [];
      
      const startTime = Date.now();
      const response = await downtimeService.getDowntimeRecords(params);
      const endTime = Date.now();
      
      console.log(`查询停机记录结果(耗时: ${(endTime - startTime).toFixed(2)}ms):`, response);
      
      if (response && response.items) {
        // 处理返回的数据，确保有shift和shift_code值
        const items = response.items || [];
        console.log(`后端返回 ${items.length} 条记录, 总数: ${response.total || 'unknown'}`);
        
        downtimeRecords.value = items.map(item => {
          // 如果没有shift值，根据shift_code或start_time计算
          let shift = item.shift;
          if (!shift) {
            if (item.shift_code) {
              shift = item.shift_code === 1 ? "白班" : "夜班";
            } else {
              shift = determineShift(item.start_time);
            }
          }

          // 如果没有shift_code值，根据shift计算
          let shift_code = item.shift_code;
          if (!shift_code) {
            shift_code = shift === "白班" ? 1 : 2;
          }

          return {
            ...item,
            shift: shift,
            shift_code: shift_code
          };
        });
        
        console.log(`成功加载 ${downtimeRecords.value.length} 条记录`);
        
        // 如果过滤后没有记录，显示提示
        if (downtimeRecords.value.length === 0 && Object.keys(params).length > 2) { // 只有skip和limit时不显示
          Message.info('未找到符合筛选条件的记录');
        }
      } else {
        console.warn('服务器返回了空响应或格式不正确:', response);
        downtimeRecords.value = [];
        
        // 判断是否有筛选条件
        if (Object.keys(params).length > 2) { // 只有skip和limit时不显示
          Message.warning('未找到符合条件的记录');
        }
      }
    } catch (apiError) {
      console.error('API调用失败:', apiError);
      throw apiError;
    }
    
  } catch (error) {
    console.error('加载停机记录出错:', error);
    Message.error('加载停机记录失败: ' + (error.message || '未知错误'));
    downtimeRecords.value = []; // 清空记录，不使用模拟数据
  } finally {
    loading.value = false;
  }
}

// 加载停机类型
const loadDowntimeTypes = async () => {
  try {
    const response = await downtimeService.getDowntimeTypes()
    if (response) {
      typeOptions.value = response || []
      console.log('加载停机类型成功:', typeOptions.value)
    }
  } catch (error) {
    console.error('加载停机类型出错:', error)
    // 设置默认选项，防止加载失败
    typeOptions.value = [
      { code: 'PLANNED', name: '计划停机' },
      { code: 'UNPLANNED', name: '非计划停机' },
      { code: 'MAINTENANCE', name: '维护停机' }
    ]
  }
}

// 加载停机原因
const loadDowntimeReasons = async (typeCode) => {
  if (!typeCode) {
    // 如果没有类型代码，使用默认的PLANNED
    typeCode = 'PLANNED';
    console.log('未提供停机类型代码，使用默认值:', typeCode);
  }
  
  try {
    const response = await downtimeService.getDowntimeReasons(typeCode)
    if (response) {
      reasonOptions.value = response || []
      console.log('加载停机原因成功:', reasonOptions.value)
    }
  } catch (error) {
    console.error('加载停机原因出错:', error)
    // 设置默认选项，防止加载失败
    const defaultReasons = {
      'PLANNED': [
        { code: 'MAINTENANCE', name: '定期维护' },
        { code: 'ADJUSTMENT', name: '设备调整' },
        { code: 'CHANGEOVER', name: '产品切换' }
      ],
      'UNPLANNED': [
        { code: 'EQUIPMENT', name: '设备故障' },
        { code: 'MATERIAL', name: '材料问题' },
        { code: 'QUALITY', name: '质量问题' },
        { code: 'UTILITY', name: '公共设施故障' }
      ],
      'MAINTENANCE': [
        { code: 'BREAKDOWN', name: '设备损坏' },
        { code: 'INSPECTION', name: '安全检查' },
        { code: 'REPAIR', name: '修复工作' }
      ]
    }
    
    reasonOptions.value = defaultReasons[typeCode] || defaultReasons['PLANNED']
  }
}

// 类型改变时加载相应的原因
const onTypeChange = async (typeCode) => {
  console.log('停机类型变更为:', typeCode);
  
  // 设置类型名称
  const selectedType = typeOptions.value.find(t => t.code === typeCode);
  
  if (selectedType) {
    console.log('找到对应的类型名称:', selectedType.name);
    editedRecord.value.type_name = selectedType.name;
  } else {
    console.warn('未找到类型代码对应的名称:', typeCode);
    // 设置一个默认值
    if (typeCode === 'PLANNED') {
      editedRecord.value.type_name = '计划停机';
    } else if (typeCode === 'UNPLANNED') {
      editedRecord.value.type_name = '非计划停机';
    } else if (typeCode === 'MAINTENANCE') {
      editedRecord.value.type_name = '维护停机';
    } else {
      editedRecord.value.type_name = typeCode; // 没有匹配项时直接使用代码作为名称
    }
  }
  
  // 清空原因
  editedRecord.value.reason_code = '';
  editedRecord.value.reason_name = '';
  
  // 加载对应类型的原因
  try {
    console.log('准备加载停机原因，类型代码:', typeCode);
    await loadDowntimeReasons(typeCode);
  } catch (error) {
    console.error('加载停机原因失败:', error);
    Message.error('加载停机原因失败，请刷新页面重试');
  }
}

// 原因改变时设置原因名称
const onReasonChange = () => {
  const selectedReason = reasonOptions.value.find(r => r.code === editedRecord.value.reason_code)
  if (selectedReason) {
    editedRecord.value.reason_name = selectedReason.name
  }
}

// 开始时间改变时更新班次
const onStartTimeChange = () => {
  // 根据开始时间计算班次
  editedRecord.value.shift = determineShift(editedRecord.value.start_time)
  // 更新shift_code
  editedRecord.value.shift_code = editedRecord.value.shift === "白班" ? 1 : 2
  console.log('根据时间自动计算班次:', editedRecord.value.shift, '班次代码:', editedRecord.value.shift_code)
}

// 查看停机记录
const viewDowntimeRecord = (record) => {
  editedIndex.value = downtimeRecords.value.indexOf(record)
  editedRecord.value = { 
    ...record,
    start_time: formatDateTimeForInput(new Date(record.start_time)),
    end_time: formatDateTimeForInput(new Date(record.end_time)),
    // 确保有shift和shift_code
    shift: record.shift || (record.shift_code === 1 ? "白班" : "夜班"),
    shift_code: record.shift_code || (record.shift === "白班" ? 1 : 2),
    // 确保type_code有值，避免查看时的参数验证错误
    type_code: record.type_code || 'PLANNED',
    type_name: record.type_name || '计划停机'
  }
  viewMode.value = true
  recordDialog.value = true
}

// 编辑停机记录
const editDowntimeRecord = (record) => {
  editedIndex.value = downtimeRecords.value.indexOf(record)
  editedRecord.value = { 
    ...record,
    start_time: formatDateTimeForInput(new Date(record.start_time)),
    end_time: formatDateTimeForInput(new Date(record.end_time)),
    // 确保有shift和shift_code
    shift: record.shift || (record.shift_code === 1 ? "白班" : "夜班"),
    shift_code: record.shift_code || (record.shift === "白班" ? 1 : 2),
    // 确保type_code有值，避免参数验证错误
    type_code: record.type_code || 'PLANNED',
    type_name: record.type_name || '计划停机'
  }
  
  // 加载停机原因
  loadDowntimeReasons(editedRecord.value.type_code)
  
  viewMode.value = false
  recordDialog.value = true
}

// 打开新建停机单对话框
const openNewDowntimeRecord = () => {
  editedIndex.value = -1
  editedRecord.value = defaultDowntimeRecord()
  
  // 加载停机类型和原因
  loadDowntimeTypes()
  if (editedRecord.value.type_code) {
    loadDowntimeReasons(editedRecord.value.type_code)
  }
  
  viewMode.value = false
  recordDialog.value = true
}

// 保存停机记录
const saveDowntimeRecord = async () => {
  // 表单验证
  const isValid = validateForm()
  if (!isValid) {
    Message.error('请填写所有必填字段')
    return
  }
  
  try {
    saving.value = true
    
    // 确保班次正确设置
    if (!editedRecord.value.shift) {
      editedRecord.value.shift = determineShift(editedRecord.value.start_time)
    }
    
    // 计算shift_code
    const shift_code = editedRecord.value.shift === "白班" ? 1 : 2
    
    // 确保所有必填字段都有值
    if (!editedRecord.value.line) {
      editedRecord.value.line = 'SWI-L' // 设置默认值
    }
    
    if (!editedRecord.value.type_code) {
      editedRecord.value.type_code = 'PLANNED'
      editedRecord.value.type_name = '计划停机'
    }
    
    if (!editedRecord.value.reason_code && editedRecord.value.type_code) {
      // 根据类型设置默认原因
      if (editedRecord.value.type_code === 'PLANNED') {
        editedRecord.value.reason_code = 'MAINTENANCE'
        editedRecord.value.reason_name = '定期维护'
      } else if (editedRecord.value.type_code === 'UNPLANNED') {
        editedRecord.value.reason_code = 'EQUIPMENT'
        editedRecord.value.reason_name = '设备故障'
      } else if (editedRecord.value.type_code === 'MAINTENANCE') {
        editedRecord.value.reason_code = 'REPAIR'
        editedRecord.value.reason_name = '修复工作'
      }
    }
    
    // 准备请求数据
    const recordData = {
      line: editedRecord.value.line,
      type_code: editedRecord.value.type_code || 'PLANNED',
      type_name: editedRecord.value.type_name || '计划停机',
      reason_code: editedRecord.value.reason_code || 'MAINTENANCE',
      reason_name: editedRecord.value.reason_name || '定期维护',
      start_time: new Date(editedRecord.value.start_time || new Date()).toISOString(),
      end_time: new Date(editedRecord.value.end_time || new Date()).toISOString(),
      remark: editedRecord.value.remark || '',
      shift: editedRecord.value.shift, // 班次名称
      shift_code: shift_code // 班次代码：1=白班，2=夜班
    }
    
    console.log('保存停机记录数据:', recordData)
    
    if (editedIndex.value === -1) {
      // 创建新停机单
      await downtimeService.createDowntime(recordData)
    } else {
      // 更新现有停机单
      await downtimeService.updateDowntime(editedRecord.value.down_id, recordData)
    }
    
    // 关闭对话框
    recordDialog.value = false
    
    // 重新加载数据
    await loadDowntimeRecords()
    
    // 提示成功
    Message.success(editedIndex.value === -1 ? '停机单创建成功' : '停机单更新成功')
    
  } catch (error) {
    console.error('保存停机记录出错:', error)
    Message.error('保存停机记录失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 表单验证
const validateForm = () => {
  // 检查必填字段
  if (!editedRecord.value.line) {
    return false
  }
  
  // 检查停机类型是否选择
  if (!editedRecord.value.type_code) {
    console.error('停机类型未选择')
    editedRecord.value.type_code = 'PLANNED'
    editedRecord.value.type_name = '计划停机'
  }
  
  if (!editedRecord.value.start_time || !editedRecord.value.end_time) {
    return false
  }
  
  return true
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
    await downtimeService.deleteDowntime(recordToDelete.value.down_id)
    
    // 重新加载数据
    await loadDowntimeRecords()
    
    // 提示成功
    Message.success('停机单删除成功')
    
  } catch (error) {
    console.error('删除停机记录出错:', error)
    Message.error('删除停机记录失败')
  } finally {
    deleteDialog.value = false
    recordToDelete.value = null
  }
}

// 格式化日期时间（用于显示）
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-'
  const date = new Date(dateTimeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-')
}

// 计算持续时间
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '-'

  try {
    // 处理不同的时间格式
    let start, end

    if (typeof startTime === 'string') {
      start = new Date(startTime)
    } else {
      start = new Date(startTime)
    }

    if (typeof endTime === 'string') {
      end = new Date(endTime)
    } else {
      end = new Date(endTime)
    }

    // 检查日期对象是否有效
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('时间格式无效:', { startTime, endTime, start, end })
      return '-'
    }

    const diffMs = end - start
    if (diffMs < 0) return '-'

    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins}分钟`
    }

    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`
  } catch (error) {
    console.error('时间计算错误:', error, { startTime, endTime })
    return '-'
  }
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

// 批量操作相关
const selectedItems = ref([])
const batchDeleteDialog = ref(false)
const batchDeleting = ref(false)
const exporting = ref(false)

// 导出CSV
const exportToCSV = () => {
  if (downtimeRecords.value.length === 0) {
    Message.warning('没有数据可导出')
    return
  }
  
  try {
    exporting.value = true
    
    // 构建CSV内容
    const headers = [
      '线体',
      '停机类型',
      '停机原因',
      '开始时间',
      '结束时间',
      '持续时间',
      '班次',
      '备注'
    ]
    
    // CSV头部
    let csvContent = headers.join(',') + '\n'
    
    // 添加数据行
    downtimeRecords.value.forEach(record => {
      const row = [
        record.line,
        record.type_name || '-',
        record.reason_name || '-',
        formatDateTime(record.start_time),
        formatDateTime(record.end_time),
        calculateDuration(record.start_time, record.end_time),
        record.shift,
        (record.remark || '').replace(/,/g, '，').replace(/\n/g, ' ') // 替换逗号和换行符
      ]
      
      csvContent += row.join(',') + '\n'
    })
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // 创建下载链接
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // 设置下载属性
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `停机单记录_${dateStr}.csv`)
    link.style.visibility = 'hidden'
    
    // 添加到DOM，触发下载，然后移除
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    Message.success('导出CSV成功')
    
  } catch (error) {
    console.error('导出CSV失败:', error)
    Message.error('导出CSV失败')
  } finally {
    exporting.value = false
  }
}

// 确认批量删除
const confirmBatchDelete = () => {
  if (selectedItems.value.length === 0) {
    Message.warning('请先选择要删除的记录')
    return
  }
  
  batchDeleteDialog.value = true
}

// 批量删除停机记录
const batchDeleteDowntimeRecords = async () => {
  if (selectedItems.value.length === 0) {
    batchDeleteDialog.value = false
    return
  }
  
  try {
    batchDeleting.value = true
    
    // 依次删除选中的项
    const deletePromises = selectedItems.value.map(item => 
      downtimeService.deleteDowntime(item.down_id)
    )
    
    await Promise.all(deletePromises)
    
    // 重新加载数据
    await loadDowntimeRecords()
    
    // 提示成功
    Message.success(`成功删除 ${selectedItems.value.length} 条停机记录`)
    
    // 清空选择
    selectedItems.value = []
    
  } catch (error) {
    console.error('批量删除停机记录失败:', error)
    Message.error('批量删除失败: ' + (error.message || ''))
  } finally {
    batchDeleting.value = false
    batchDeleteDialog.value = false
  }
}

// 计算总停机时间
const calculateTotalDowntime = () => {
  if (downtimeRecords.value.length === 0) return '0分钟'

  let totalMinutes = 0

  downtimeRecords.value.forEach((record, index) => {
    if (!record.start_time || !record.end_time) {
      console.warn(`记录 ${index + 1} 缺少时间信息:`, record)
      return
    }

    // 处理不同的时间格式
    let start, end

    try {
      // 如果是字符串，直接解析
      if (typeof record.start_time === 'string') {
        start = new Date(record.start_time)
      } else {
        start = new Date(record.start_time)
      }

      if (typeof record.end_time === 'string') {
        end = new Date(record.end_time)
      } else {
        end = new Date(record.end_time)
      }

      // 检查日期对象是否有效
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn(`记录 ${index + 1} 时间格式无效:`, {
          start_time: record.start_time,
          end_time: record.end_time,
          start_parsed: start,
          end_parsed: end
        })
        return
      }

      const diffMs = end - start
      if (diffMs > 0) {
        const minutes = Math.floor(diffMs / 60000)
        totalMinutes += minutes
      } else {
        console.warn(`记录 ${index + 1} 时间差异无效: ${diffMs}ms，开始时间: ${start}，结束时间: ${end}`)
      }
    } catch (error) {
      console.error(`记录 ${index + 1} 时间解析错误:`, error, record)
    }
  })

  if (totalMinutes < 60) {
    return `${totalMinutes}分钟`
  }

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`
}

// 计算平均停机时间
const calculateAverageDowntime = () => {
  if (downtimeRecords.value.length === 0) return '0分钟'

  let totalMinutes = 0
  let validRecords = 0

  downtimeRecords.value.forEach(record => {
    if (!record.start_time || !record.end_time) return

    try {
      // 处理不同的时间格式
      let start, end

      if (typeof record.start_time === 'string') {
        start = new Date(record.start_time)
      } else {
        start = new Date(record.start_time)
      }

      if (typeof record.end_time === 'string') {
        end = new Date(record.end_time)
      } else {
        end = new Date(record.end_time)
      }

      // 检查日期对象是否有效
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return
      }

      const diffMs = end - start
      if (diffMs > 0) {
        totalMinutes += Math.floor(diffMs / 60000)
        validRecords++
      }
    } catch (error) {
      console.error('平均时间计算错误:', error, record)
    }
  })

  if (validRecords === 0) return '0分钟'

  const avgMinutes = Math.round(totalMinutes / validRecords)

  if (avgMinutes < 60) {
    return `${avgMinutes}分钟`
  }

  const hours = Math.floor(avgMinutes / 60)
  const mins = avgMinutes % 60
  return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`
}

// 应用筛选按钮事件处理
const applyFilters = () => {
  console.log('应用筛选条件:', filters.value);
  loadDowntimeRecords();
}

// 生命周期钩子
onMounted(() => {
  loadDowntimeRecords()
  loadDowntimeTypes()
})
</script> 