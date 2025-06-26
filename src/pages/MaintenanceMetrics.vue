<template>
  <unified-page-template title="维修指标" icon="mdi-chart-line" color="primary">
    <template #header-actions>
      <v-btn 
        color="primary" 
        prepend-icon="mdi-clipboard-text"
        :to="'/records'"
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
              <v-card min-width="300">
                <v-card-text>
                  <!-- 快捷选项 -->
                  <div class="d-flex flex-wrap mb-4">
                    <v-btn 
                      size="small" 
                      variant="text" 
                      class="me-2 mb-2" 
                      @click="setDateRange('today')"
                    >
                      今天
                    </v-btn>
                    <v-btn 
                      size="small" 
                      variant="text" 
                      class="me-2 mb-2" 
                      @click="setDateRange('week')"
                    >
                      本周
                    </v-btn>
                    <v-btn 
                      size="small" 
                      variant="text" 
                      class="me-2 mb-2" 
                      @click="setDateRange('month')"
                    >
                      本月
                    </v-btn>
                    <v-btn 
                      size="small" 
                      variant="text" 
                      class="me-2 mb-2" 
                      @click="setDateRange('quarter')"
                    >
                      本季度
                    </v-btn>
                  </div>
                  
              <v-date-picker
                v-model="dateRange"
                range
                color="primary"
                    show-adjacent-months
              ></v-date-picker>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn 
                    color="primary" 
                    variant="text" 
                    @click="datePickerMenu = false"
                  >
                    确认
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </div>
          
          <v-spacer></v-spacer>
          
          <!-- 视图切换按钮组 -->
          <v-btn-toggle 
            v-model="activeTab" 
            color="primary" 
            density="comfortable"
            class="me-2 mb-2"
          >
            <v-btn value="dashboard" prepend-icon="mdi-view-dashboard">
              仪表盘
          </v-btn>
            <v-btn value="table" prepend-icon="mdi-table">
              数据表
          </v-btn>
          </v-btn-toggle>  
        </div>
      </v-card-text>
    </v-card>

    <!-- 显示仪表盘视图 -->
    <div v-if="activeTab === 'dashboard'">
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
                {{ formatTime(metricsOverview.mttr) }}
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
                {{ formatTime(metricsOverview.mtbf) }}
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
                {{ formatPercentage(metricsOverview.oee) }}
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
                {{ formatPercentage(metricsOverview.availability) }}
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
        <OEETrendChart
          :chart-data="chartData.oeeAvailability"
          :loading="loadingCharts.oee"
        />
      </v-col>
      
      <v-col cols="12" md="6">
        <MTTRMTBFChart
          :chart-data="chartData.mttrMtbf"
          :loading="loadingCharts.mttrMtbf"
        />
      </v-col>
    </v-row>
    
    <!-- 线体对比 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <LineComparisonChart
          :chart-data="chartData.lineComparison"
          :loading="loadingMetrics"
        />
      </v-col>
    </v-row>
    </div>
    
    <!-- 维修数据列表 -->
    <v-row v-if="activeTab === 'table'" class="mt-4">
      <v-col cols="12">
        <metrics-list
          :metrics="metricsList"
          :loading="loadingMetrics"
          :total-items="totalMetricsCount"
          :server-items-per-page="itemsPerPage"
          @add-metric="openMetricDialog"
          @edit-metric="editMetric"
          @delete-metric="deleteMetric"
          @pagination-change="handlePaginationChange"
          @filter-change="handleFilterChange"
        ></metrics-list>
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
import MetricsList from '@/components/maintenance/MetricsList.vue'
import MetricsDialog from '@/components/maintenance/MetricsDialog.vue'
import api from '../utils/api'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import { maintenanceService } from '../services'
// 导入图表组件
import OEETrendChart from '../components/maintenance/charts/OEETrendChart.vue'
import MTTRMTBFChart from '../components/maintenance/charts/MTTRMTBFChart.vue'
import LineComparisonChart from '../components/maintenance/charts/LineComparisonChart.vue'
// 雷达图组件已在main.js中全局引入，不需要单独导入
// 导入工具类中的函数
import { getLineColor } from '../utils/colors'
import { 
  isSameDay, 
  formatDateRange as formatDateRangeUtil, 
  debugDate, 
  getDateRange as getDateRangeUtil, 
  formatTime, 
  formatPercentage 
} from '../utils/maintenance'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const userStore = useUserStore()

// 线体类型列表
const lineTypes = ['SWI-L', 'SWI-R', 'RWH-L', 'RWH-R', 'W01', 'HF', 'LC']
const selectedLineType = ref('all')

// 班次选择
const selectedShift = ref('all')
const shiftCodeMap = {
  'all': null,
  'day': 1, // 白班对应shift_code=1
  'night': 2 // 夜班对应shift_code=2
}

// 日期范围选择
const datePickerMenu = ref(false)
const dateRange = ref([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  new Date()
])

// 图表数据
const chartData = ref({
  oeeAvailability: [],
  mttrMtbf: [],
  lineComparison: {}
})

// 格式化显示的日期范围
const formatDateRange = computed(() => {
  return formatDateRangeUtil(dateRange.value);
});

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
  parts_produced: 0
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

// 页面标签页
const activeTab = ref('dashboard') // 默认显示仪表盘

// 切换标签页
const changeTab = (tab) => {
  activeTab.value = tab
}

// 分页相关参数
const currentPage = ref(1)
const itemsPerPage = ref(20)
const totalMetricsCount = ref(0)

// 处理分页变化
const handlePaginationChange = (params) => {
  console.log('分页变化:', params)
  currentPage.value = params.page
  itemsPerPage.value = params.page_size
  
  // 更新筛选条件
  if (params.line) {
    selectedLineType.value = params.line
  }
  
  if (params.shift_code !== undefined) {
    // 将shift_code转换回selectedShift值
    selectedShift.value = params.shift_code === 1 ? 'day' : 
                          params.shift_code === 2 ? 'night' : 'all'
  }
  
  // 重新加载数据
  loadMetrics()
}

// 处理筛选条件变化
const handleFilterChange = (filters) => {
  console.log('筛选条件变化:', filters)
  
  // 如果有线体筛选
  if (filters.line) {
    selectedLineType.value = filters.line
  }
  
  // 如果有班次筛选
  if (filters.shift_code !== undefined) {
    // 将shift_code转换回selectedShift值
    selectedShift.value = filters.shift_code === 1 ? 'day' : 
                         filters.shift_code === 2 ? 'night' : 'all'
  }
  
  // 重置页码并重新加载数据
  currentPage.value = 1
  loadMetrics()
}

// 加载维修数据指标
const loadMetrics = async () => {
  try {
    loadingMetrics.value = true
    
    // 构建查询参数
    const params = {
      // 使用页码和每页数量作为分页参数
      page: currentPage.value,
      page_size: itemsPerPage.value
    }
    
    // 添加线体筛选
    if (selectedLineType.value !== 'all') {
      params.line = selectedLineType.value
    }
    
    // 添加班次筛选
    if (selectedShift.value !== 'all') {
      params.shift_code = shiftCodeMap[selectedShift.value]
    }
    
    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      // 使用辅助函数调试日期格式
      debugDate('开始日期', dateRange.value[0]);
      debugDate('结束日期', dateRange.value[1]);
      
      // 确保日期是Date对象
      const startDate = dateRange.value[0] instanceof Date 
        ? dateRange.value[0] 
        : new Date(dateRange.value[0]);
      
      const endDate = dateRange.value[1] instanceof Date 
        ? dateRange.value[1] 
        : new Date(dateRange.value[1]);
      
      // 格式化为YYYY-MM-DD格式
      params.start_date = startDate.toISOString().split('T')[0]
      params.end_date = endDate.toISOString().split('T')[0]
      
      console.log(`日期范围参数: ${params.start_date} 至 ${params.end_date}`);
    }
    
    console.log('查询维修指标最终参数:', JSON.stringify(params))
    
    // 使用maintenanceService获取数据
    const response = await maintenanceService.getMaintenanceMetrics(params)
    
    if (response && response.items) {
      // 更新总记录数
      totalMetricsCount.value = response.total || response.items.length
      
      // 处理返回的数据
      metricsList.value = response.items.map(item => {
        // 确保日期格式正确
        let date = null;
        if (item.shift_date) {
          // 将字符串日期转换为日期对象
          date = new Date(item.shift_date);
          // 检查日期是否有效
          if (isNaN(date.getTime())) {
            console.warn(`无效的日期格式: ${item.shift_date}，使用当前日期代替`);
            date = new Date();
          }
        } else {
          console.warn('项目没有shift_date字段，使用当前日期');
          date = new Date();
        }
        
        return {
      id: item.id,
      line: item.line,
          date: date,
          shift_date: date,
      shift_code: item.shift_code,
        shift: item.shift_code === 1 ? '白班' : '夜班',
      plan_down_time: item.plan_down_time || 0,
      out_plan_down_time: item.out_plan_down_time || 0,
      oee: item.oee || 0,
          amount: item.amount || 0,
          // 计算可动率 = (总时间 - 计划停机时间 - 非计划停机时间) / (总时间 - 计划停机时间)
          availability: maintenanceService.calculateAvailability(
            item.plan_down_time || 0,
            item.out_plan_down_time || 0
          )
        }
      });
      
      console.log(`成功加载 ${metricsList.value.length} 条维修指标记录，总记录数: ${totalMetricsCount.value}`)
    
    // 计算统计指标
    calculateMetricsOverview()
    
    // 加载图表数据
    await loadChartData()
    } else {
      console.warn('服务器返回了空响应或格式不正确', response)
      metricsList.value = []
      totalMetricsCount.value = 0
      
      if (Object.keys(params).length > 2) { // 只有page和page_size时不显示
        Message.warning('未找到符合条件的记录')
      }
    }
    
    loadingMetrics.value = false
  } catch (error) {
    console.error('加载指标数据失败:', error)
    Message.error('加载指标数据失败')
    metricsList.value = []
    totalMetricsCount.value = 0
    loadingMetrics.value = false
  }
}

// 加载图表数据
const loadChartData = async () => {
  try {
    // 设置加载状态
    loadingCharts.value.oee = true;
    loadingCharts.value.mttrMtbf = true;
    
    // 构建查询参数
    const params = {
      line: selectedLineType.value !== 'all' ? selectedLineType.value : undefined,
      shift_code: selectedShift.value !== 'all' ? shiftCodeMap[selectedShift.value] : undefined
    }
    
    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      // 确保日期是Date对象
      const startDate = dateRange.value[0] instanceof Date 
        ? dateRange.value[0] 
        : new Date(dateRange.value[0]);
      
      const endDate = dateRange.value[1] instanceof Date 
        ? dateRange.value[1] 
        : new Date(dateRange.value[1]);
      
      // 格式化为YYYY-MM-DD格式
      params.start_date = startDate.toISOString().split('T')[0];
      params.end_date = endDate.toISOString().split('T')[0];
    }
    
    try {
      // 获取OEE和设备可动率趋势
      console.log('开始获取OEE趋势数据');
      const oeeRes = await maintenanceService.getOEETrendData(params);
      if (oeeRes && Array.isArray(oeeRes) && oeeRes.length > 0) {
        console.log(`成功获取 ${oeeRes.length} 条OEE趋势数据`);
        chartData.value.oeeAvailability = oeeRes;
      } else {
        console.warn('获取OEE趋势数据结果为空或不是预期的数组格式');
        // 使用已有数据创建趋势
        chartData.value.oeeAvailability = maintenanceService.generateOEETrend(params, metricsList.value);
      }
    } catch (e) {
      console.error('获取OEE趋势数据失败:', e);
      // 使用已有数据创建趋势
      chartData.value.oeeAvailability = maintenanceService.generateOEETrend(params, metricsList.value);
    } finally {
      loadingCharts.value.oee = false;
    }
    
    // 使用上面改进的loadMTTRMTBFTrend函数获取MTTR/MTBF数据
    await loadMTTRMTBFTrend();
    
    // 使用现有数据生成线体比较图表
    chartData.value.lineComparison = maintenanceService.generateLineComparison(lineTypes, metricsList.value);
    
  } catch (error) {
    console.error('加载图表数据出错:', error);
    // 生成所有模拟数据作为后备方案
    const mockData = maintenanceService.generateMockChartData(params, lineTypes);
    chartData.value = mockData;
  } finally {
    // 确保加载状态重置
    loadingCharts.value.oee = false;
    loadingCharts.value.mttrMtbf = false;
  }
}

// 加载MTTR和MTBF趋势数据
const loadMTTRMTBFTrend = async () => {
  try {
    loadingCharts.value.mttrMtbf = true;
    
    // 准备查询参数
    const queryParams = {
      line: selectedLineType.value !== 'all' ? selectedLineType.value : null,
      shift_code: selectedShift.value !== 'all' ? shiftCodeMap[selectedShift.value] : null
    };
    
    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      // 确保日期是Date对象
      const startDate = dateRange.value[0] instanceof Date 
        ? dateRange.value[0] 
        : new Date(dateRange.value[0]);
      
      const endDate = dateRange.value[1] instanceof Date 
        ? dateRange.value[1] 
        : new Date(dateRange.value[1]);
      
      // 格式化为YYYY-MM-DD格式
      queryParams.start_date = startDate.toISOString().split('T')[0];
      queryParams.end_date = endDate.toISOString().split('T')[0];
    }
    
    try {
      const data = await maintenanceService.getMTTRMTBFTrendData(queryParams);
      
      // maintenanceService已经处理了数据格式，这里直接使用返回的数组
      if (Array.isArray(data) && data.length > 0) {
        console.log(`获取到 ${data.length} 条MTTR/MTBF趋势数据`);
        chartData.value.mttrMtbf = data;
      } else {
        console.warn('获取的MTTR/MTBF数据为空，尝试使用现有数据生成趋势');
        chartData.value.mttrMtbf = maintenanceService.generateMTTRTrend(queryParams, metricsList.value);
      }
    } catch (apiError) {
      console.error('API调用失败:', apiError);
      // 使用生成的数据作为后备
      chartData.value.mttrMtbf = maintenanceService.generateMTTRTrend(queryParams, metricsList.value);
    }
  } catch (error) {
    console.error('加载MTTR/MTBF趋势数据失败:', error);
    // 使用生成的数据作为后备
    chartData.value.mttrMtbf = maintenanceService.generateMTTRTrend(queryParams, metricsList.value);
    Message.warning('加载MTTR/MTBF数据失败，显示本地生成的数据');
  } finally {
    loadingCharts.value.mttrMtbf = false;
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
      line: selectedLineType.value !== 'all' ? selectedLineType.value : '',
      shift_date: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0], // 前端使用的字段
      shift_code: selectedShift.value !== 'all' ? shiftCodeMap[selectedShift.value] : 1,
      plan_down_time: 0, // 计划停机时间(分钟)
      out_plan_down_time: 0, // 非计划停机时间(分钟)
      oee: 1.0, // 默认OEE为100%
      amount: 0
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
    
    // 准备要提交的数据
    const metricData = {
      shift_date: editedMetric.value.shift_date || editedMetric.value.date,
      line: editedMetric.value.line,
      shift_code: editedMetric.value.shift_code,
      plan_down_time: Number(editedMetric.value.plan_down_time) || 0,
      out_plan_down_time: Number(editedMetric.value.out_plan_down_time) || 0,
      oee: Number(editedMetric.value.oee) || 0,
      amount: Number(editedMetric.value.amount) || 0
    }
    
    let response
    
    if (editedMetricIndex.value === -1) {
      // 创建新记录
      response = await maintenanceService.createMaintenanceMetric(metricData)
    } else {
      // 更新现有记录
      response = await maintenanceService.updateMaintenanceMetric(editedMetric.value.id, metricData)
    }
    
    if (response) {
      // 关闭对话框
      metricDialog.value = false
      
      // 重新加载数据
      await loadMetrics()
      
      Message.success(editedMetricIndex.value === -1 ? '指标数据创建成功' : '指标数据更新成功')
    }
  } catch (error) {
    console.error('保存指标数据失败:', error)
    Message.error('保存指标数据失败')
  } finally {
    savingMetric.value = false
  }
}

// 删除维修数据指标
const deleteMetric = async (metric) => {
  try {
    if (!confirm(`确定要删除 ${metric.line} ${metric.date} 的指标数据吗？`)) {
      return
    }
    
    const response = await maintenanceService.deleteMaintenanceMetric(metric.id)
    
    if (response) {
      // 重新加载数据
      await loadMetrics()
      
      Message.success('指标数据删除成功')
    }
  } catch (error) {
    console.error('删除指标数据失败:', error)
    Message.error('删除指标数据失败')
  }
}

// 监听筛选条件变化
watch([selectedLineType, selectedShift], () => {
  console.log('筛选条件变更:', {
    lineType: selectedLineType.value,
    shift: selectedShift.value
  })
  
  loadMetrics()
})

// 监听日期范围变化
watch(dateRange, (newRange, oldRange) => {
  if (newRange && newRange.length === 2 && 
      (oldRange.length !== 2 || 
       !isSameDay(newRange[0], oldRange[0]) || 
       !isSameDay(newRange[1], oldRange[1]))) {
    console.log('日期范围变更:', formatDateRange.value);
    // 强制转换为Date对象并设置正确的时间部分
    const start = new Date(newRange[0]);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(newRange[1]);
    end.setHours(23, 59, 59, 999);
    
    console.log(`规范化日期范围: ${start.toISOString()} 至 ${end.toISOString()}`);
    
    // 更新日期范围，确保时间部分正确
    dateRange.value = [start, end];
    
    // 重新加载数据
    loadMetrics();
  }
}, { deep: true });

// 生命周期钩子
onMounted(() => {
  loadMetrics()
})

// 设置日期范围快捷选项
const setDateRange = (type) => {
  dateRange.value = getDateRangeUtil(type);
  datePickerMenu.value = false;
  loadMetrics();
};

// 图表加载状态
const loadingCharts = ref({
  oee: false,
  mttrMtbf: false
});

// 计算指标概览
const calculateMetricsOverview = () => {
  if (!metricsList.value || metricsList.value.length === 0) {
    return
  }
  
  // 定义常量：每班720分钟(12小时)
  const WORK_MINUTES_PER_SHIFT = 720
  
  // 总计
  let totalPlanDowntime = 0
  let totalOutPlanDowntime = 0
  let totalShifts = metricsList.value.length
  let totalWorkMinutes = totalShifts * WORK_MINUTES_PER_SHIFT
  let totalOEE = 0
  let totalMTTR = 0
  let totalMTBF = 0
  let mttrCount = 0
  let mtbfCount = 0
  
  metricsList.value.forEach(metric => {
    // 计划停机时间
    totalPlanDowntime += Number(metric.plan_down_time) || 0
    // 非计划停机时间
    totalOutPlanDowntime += Number(metric.out_plan_down_time) || 0
    // 累加OEE值 - 确保是数字
    let oee = Number(metric.oee) || 0
    // 如果OEE值大于1，假设是百分比形式，转换为小数
    if (oee > 1) oee = oee / 100
    totalOEE += oee
    
    // 如果数据中有MTTR和MTBF值，直接使用
    if (metric.mttr !== undefined) {
      totalMTTR += Number(metric.mttr) || 0
      mttrCount++
    }
    
    if (metric.mtbf !== undefined) {
      totalMTBF += Number(metric.mtbf) || 0
      mtbfCount++
    }
  })
  
  // 可用时间 = 总时间 - 计划停机时间
  const availableTime = totalWorkMinutes - totalPlanDowntime
  
  // 实际运行时间 = 可用时间 - 非计划停机时间
  const actualRunTime = Math.max(0, availableTime - totalOutPlanDowntime)
  
  // MTTR和MTBF - 优先使用数据中的平均值，如果没有则使用默认值
  const mttr = mttrCount > 0 ? totalMTTR / mttrCount : 30
  const mtbf = mtbfCount > 0 ? totalMTBF / mtbfCount : 720
  
  // 计算设备可动率 = 实际运行时间/可用时间
  const availability = availableTime > 0
    ? actualRunTime / availableTime
    : 1
  
  // 使用数据库中OEE的平均值，如果不可用则计算
  const oee = totalShifts > 0
    ? totalOEE / totalShifts
    : (totalWorkMinutes > 0 ? actualRunTime / totalWorkMinutes : 0.95)
  
  // 更新指标概览
  metricsOverview.value = {
    mttr,
    mtbf,
    oee,
    availability
  }
  
  console.log('指标计算结果:', {
    totalShifts,
    totalWorkMinutes,
    totalPlanDowntime,
    totalOutPlanDowntime,
    availableTime,
    actualRunTime,
    mttr,
    mtbf,
    oee,
    availability
  })
}

// 根据数值计算颜色类
const mttrColor = computed(() => {
  const mttr = metricsOverview.value.mttr;
  if (mttr <= 30) return 'text-success';
  if (mttr <= 60) return 'text-info';
  if (mttr <= 120) return 'text-warning';
  return 'text-error';
});

const mtbfColor = computed(() => {
  const mtbf = metricsOverview.value.mtbf;
  if (mtbf >= 480) return 'text-success';  // 8小时 = 480分钟
  if (mtbf >= 240) return 'text-info';     // 4小时 = 240分钟
  if (mtbf >= 120) return 'text-warning';  // 2小时 = 120分钟
  return 'text-error';
});

const oeeColor = computed(() => {
  const oee = metricsOverview.value.oee;
  if (oee >= 0.9) return 'text-success';
  if (oee >= 0.86) return 'text-info';
  if (oee >= 0.6) return 'text-warning';
  return 'text-error';
});

const availabilityColor = computed(() => {
  const avail = metricsOverview.value.availability;
  if (avail >= 0.9) return 'text-success';
  if (avail >= 0.86) return 'text-info';
  if (avail >= 0.6) return 'text-warning';
  return 'text-error';
});
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

/* 图表加载状态指示器样式 */
.chart-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0 0 12px 12px;
}

.position-relative {
  position: relative;
}
</style>