<template>
  <unified-page-template 
    title="EHS KPI管理"
    icon="mdi-shield-check"
    color="success"
  >
    <!-- 固定区域：控制栏 + 表格头部 -->
    <div class="sticky-header-container">
      <!-- 顶部控制栏 -->
      <div class="controls-bar">
        <v-row class="align-center">
          <!-- 左侧：月份和年份选择器 -->
          <v-col
            cols="12"
            md="6"
          >
            <v-row>
              <v-col
                cols="6"
                md="4"
              >
                <v-select
                  v-model="selectedMonth"
                  :items="monthOptions"
                  label="选择月份"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="control-select"
                  @update:model-value="loadData"
                />
              </v-col>
              <v-col
                cols="6"
                md="4"
              >
                <v-select
                  v-model="selectedYear"
                  :items="yearOptions"
                  label="选择年份"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="control-select"
                  @update:model-value="loadData"
                />
              </v-col>
            </v-row>
          </v-col>

          <v-spacer />

          <!-- 右侧：操作按钮 -->
          <v-col cols="auto">
            <v-btn
              color="info"
              variant="outlined"
              prepend-icon="mdi-target"
              class="mr-2 action-btn"
              @click="openTargetDialog"
            >
              目标值管理
            </v-btn>

            <v-btn
              color="success"
              prepend-icon="mdi-content-save"
              :loading="submitting"
              :disabled="!isDataChanged"
              class="action-btn"
              variant="elevated"
              @click="saveData"
            >
              保存数据
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- 加载指示器 -->
    <loading-overlay
      :loading="loading"
      message="加载数据中..."
    />

    <!-- 数据变更提醒 -->
    <v-snackbar
      v-model="showChangeAlert"
      :timeout="3000"
      color="warning"
      location="bottom"
      multi-line
      class="change-alert"
    >
      <v-icon
        icon="mdi-alert"
        class="mr-2"
      />
      数据已修改，请记得保存！
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          :loading="submitting"
          @click="saveData"
        >
          保存
        </v-btn>
        <v-btn
          color="white"
          variant="text"
          @click="showChangeAlert = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>

    <!-- 可滚动的数据表格容器 -->
    <div class="scrollable-table-container">
      <unified-data-table
        :headers="headers"
        :items="kpiData"
        :loading="loading"
        density="comfortable"
        class="ehs-kpi-table ehs-data-table frozen-header-table"
        :hover="false"
        hide-default-footer=""
        :items-per-page="-1"
        :fixed-header="true"
        :height="'calc(100vh - 280px)'"
      >
        <!-- KPI描述列 -->
        <template #item.description="{ item }">
          <div class="font-weight-medium">
            {{ item.description }}
          </div>
        </template>

        <!-- 区域列 -->
        <template #item.area="{ item }">
          <v-chip
            :color="getAreaColor(item.area)"
            size="small"
            variant="flat"
          >
            {{ item.area }}
          </v-chip>
        </template>

        <!-- 实际值输入 -->
        <template #item.actual_value="{ item }">
          <!-- Environmental Performance 使用选择框 -->
          <v-select
            v-if="item.description === 'Environmental Performance'"
            v-model="item.actual_value"
            :items="environmentalOptions"
            variant="outlined"
            density="compact"
            hide-details
            class="text-field-small"
            @update:model-value="handleInput"
          />
          <!-- 其他KPI使用数值输入 -->
          <v-text-field
            v-else
            v-model.number="item.actual_value"
            type="number"
            min="0"
            step="0.01"
            variant="outlined"
            density="compact"
            hide-details
            class="text-field-small"
            @input="handleInput"
          />
        </template>

        <!-- 目标值显示 -->
        <template #item.target_value="{ item }">
          <div class="text-center">
            <v-chip
              :color="item.target_value > 0 ? 'primary' : 'grey'"
              size="small"
              variant="flat"
            >
              {{ item.description === 'Environmental Performance'
                ? (environmentalValueToText[item.target_value] || 'Green')
                : (item.target_value || 0) }}
            </v-chip>
          </div>
        </template>

        <!-- YTD值输入 -->
        <template #item.ytd_value="{ item }">
          <!-- Environmental Performance YTD 使用选择框 -->
          <v-select
            v-if="item.description === 'Environmental Performance'"
            v-model="item.ytd_value"
            :items="environmentalOptions"
            variant="outlined"
            density="compact"
            hide-details
            class="text-field-small"
            @update:model-value="handleInput"
          />
          <!-- 其他KPI使用数值输入 -->
          <v-text-field
            v-else
            v-model.number="item.ytd_value"
            type="number"
            min="0"
            step="0.01"
            variant="outlined"
            density="compact"
            hide-details
            class="text-field-small"
            @input="handleInput"
          />
        </template>

        <!-- 原因分析与行动计划 -->
        <template #item.remark="{ item }">
          <div
            v-if="shouldShowRemark(item)"
            class="d-flex align-center"
          >
            <v-btn
              size="small"
              variant="outlined"
              color="warning"
              prepend-icon="mdi-clipboard-edit"
              @click="openRemarkDialog(item)"
            >
              {{ getRemarkButtonText(item) }}
            </v-btn>
            <v-icon
              v-if="hasRemarkContent(item)"
              color="success"
              class="ml-2"
            >
              mdi-check-circle
            </v-icon>
          </div>
          <span
            v-else
            class="text-grey"
          >-</span>
        </template>
      </unified-data-table>
    </div>

    <!-- 目标值管理对话框 -->
    <v-dialog
      v-model="targetDialog"
      max-width="1200px"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">
            mdi-target
          </v-icon>
          {{ selectedYear }}年 EHS KPI 目标值设置
        </v-card-title>
        
        <v-card-text>
          <unified-data-table
            :headers="targetHeaders"
            :items="targetData"
            :loading="false"
            density="compact"
            :items-per-page="50"
            hide-default-footer
          >
            <!-- 区域列 -->
            <template #item.area="{ item }">
              <v-chip
                :color="getAreaColor(item.area)"
                size="small"
                variant="flat"
              >
                {{ item.area }}
              </v-chip>
            </template>

            <!-- 目标值输入 -->
            <template #item.target_value="{ item }">
              <!-- Environmental Performance 使用选择框 -->
              <v-select
                v-if="item.description === 'Environmental Performance'"
                v-model="item.target_value"
                :items="environmentalOptions"
                variant="outlined"
                density="compact"
                hide-details
                class="text-field-small environmental-select"
              />
              <!-- 其他KPI使用数值输入 -->
              <v-text-field
                v-else
                v-model.number="item.target_value"
                type="number"
                min="0"
                step="0.01"
                variant="outlined"
                density="compact"
                hide-details
                class="text-field-small"
              />
            </template>
          </unified-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="targetDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingTargets"
            @click="saveTargets"
          >
            保存目标值
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 原因分析与行动计划弹窗 -->
    <kpi-remark-dialog
      v-model="remarkDialog"
      :item="selectedItem"
      title="原因分析与行动计划"
      @save="saveRemarkData"
    />
  </unified-page-template>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { get, post, put } from '@/utils/api'
import Message from '@/utils/notification'
import UnifiedPageTemplate from '@/components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '@/components/UnifiedDataTable.vue'
import KpiRemarkDialog from '@/components/KpiRemarkDialog.vue'
import { hasRemarkContent } from '@/utils/kpiUtils'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

// 获取上一个月的月份和年份
const getPreviousMonth = () => {
  const now = new Date()
  const prevMonth = now.getMonth() // getMonth() 返回 0-11，所以当前月减1就是上个月
  const prevYear = now.getFullYear()

  if (prevMonth === 0) {
    // 如果当前是1月，上个月是去年12月
    return { month: 12, year: prevYear - 1 }
  } else {
    return { month: prevMonth, year: prevYear }
  }
}

const { month: defaultMonth, year: defaultYear } = getPreviousMonth()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const selectedMonth = ref(defaultMonth)
const selectedYear = ref(defaultYear)
const showChangeAlert = ref(false)
const isDataChanged = ref(false)

// 目标值管理相关
const targetDialog = ref(false)
const savingTargets = ref(false)
const targetData = ref([])

// 备注弹窗相关
const remarkDialog = ref(false)
const selectedItem = ref(null)

// 月份和年份选项
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  title: `${i + 1}月`,
  value: i + 1
}))

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  title: `${new Date().getFullYear() - 2 + i}年`,
  value: new Date().getFullYear() - 2 + i
}))

// Environmental Performance 选项 - 使用数字值
const environmentalOptions = [
  { title: 'Green', value: 4 },
  { title: 'Yellow/Green', value: 3 },
  { title: 'Yellow', value: 2 },
  { title: 'Red', value: 1 }
]

// Environmental Performance 数字到文本的映射
const environmentalValueToText = {
  4: 'Green',
  3: 'Yellow/Green',
  2: 'Yellow',
  1: 'Red'
}

// Environmental Performance 文本到数字的映射
const environmentalTextToValue = {
  'Green': 4,
  'Yellow/Green': 3,
  'Yellow': 2,
  'Red': 1
}

// KPI数据
const kpiData = ref([])
const originalKpiData = ref([])

// 表格头部配置
const headers = [
  { title: 'KPI指标', key: 'description', width: '30%', sortable: false },
  { title: '区域', key: 'area', width: '15%', sortable: false },
  { title: '实际值', key: 'actual_value', width: '15%', sortable: false },
  { title: '目标值', key: 'target_value', width: '15%', sortable: false },
  { title: 'YTD', key: 'ytd_value', width: '15%', sortable: false },
  { title: '原因分析', key: 'remark', width: '10%', sortable: false }
]

// 目标值表格头部
const targetHeaders = [
  { title: 'KPI指标', key: 'description', width: '60%', sortable: false },
  { title: '区域', key: 'area', width: '20%', sortable: false },
  { title: '目标值', key: 'target_value', width: '20%', sortable: false }
]

// 初始化KPI数据结构
const initializeKpiData = () => {
  const kpiList = [
    'H&S Numeric Score',
    'Environmental Performance',
    'Severity incident',
    'Number of H&S audit/inspection action plans open >9 months'
  ]

  const areaList = ['TJC', 'TJM', '汇总']
  const data = []

  kpiList.forEach(description => {
    areaList.forEach(area => {
      data.push({
        area,
        description,
        actual_value: description === 'Environmental Performance' ? 4 : 0, // Green = 4
        target_value: description === 'Environmental Performance' ? 4 : 0, // Green = 4
        ytd_value: description === 'Environmental Performance' ? 4 : 0, // Green = 4
        remark: null,
        action_plan_content: null,
        expected_close_date: null,
        actual_close_date: null,
        root_cause_analysis: null
      })
    })
  })

  return data
}

// 区域颜色映射
const getAreaColor = (area) => {
  const colorMap = {
    'TJC': 'primary',
    'TJM': 'secondary',
    '汇总': 'success'
  }
  return colorMap[area] || 'grey'
}

// 获取状态颜色
const getStatusColor = (item) => {
  // Environmental Performance 特殊处理
  if (item.description === 'Environmental Performance') {
    const colorMap = {
      4: 'success',    // Green
      3: 'warning',    // Yellow/Green
      2: 'warning',    // Yellow
      1: 'error'       // Red
    }
    return colorMap[item.actual_value] || 'grey'
  }

  if (!item.target_value || item.target_value === 0) return 'grey'

  // H&S Numeric Score: 值越高越好
  if (item.description === 'H&S Numeric Score') {
    const ratio = item.actual_value / item.target_value
    if (ratio >= 1) return 'success'
    if (ratio >= 0.8) return 'warning'
    return 'error'
  }

  // Severity incident 和 Number of H&S audit/inspection action plans: 值越低越好
  if (item.description === 'Severity incident' ||
      item.description === 'Number of H&S audit/inspection action plans open >9 months') {
    if (item.actual_value <= item.target_value) return 'success'
    if (item.actual_value <= item.target_value * 1.2) return 'warning'
    return 'error'
  }

  return 'grey'
}

// 获取状态文本
const getStatusText = (item) => {
  // Environmental Performance 特殊处理
  if (item.description === 'Environmental Performance') {
    return environmentalValueToText[item.actual_value] || 'Green'
  }

  if (!item.target_value || item.target_value === 0) return '无目标'

  // H&S Numeric Score: 值越高越好
  if (item.description === 'H&S Numeric Score') {
    const ratio = item.actual_value / item.target_value
    if (ratio >= 1) return '达成'
    if (ratio >= 0.8) return '接近'
    return '未达成'
  }

  // Severity incident 和 Number of H&S audit/inspection action plans: 值越低越好
  if (item.description === 'Severity incident' ||
      item.description === 'Number of H&S audit/inspection action plans open >9 months') {
    if (item.actual_value <= item.target_value) return '达成'
    if (item.actual_value <= item.target_value * 1.2) return '接近'
    return '超标'
  }

  return '无目标'
}

// 判断是否需要显示备注字段
const shouldShowRemark = (item) => {
  if (!item.target_value || item.target_value === 0) return false

  // H&S Numeric Score: 小于目标值时显示备注
  if (item.description === 'H&S Numeric Score') {
    return item.actual_value < item.target_value
  }

  // Severity incident 和 Number of H&S audit/inspection action plans open >9 months: 大于目标值时显示备注
  if (item.description === 'Severity incident' ||
      item.description === 'Number of H&S audit/inspection action plans open >9 months') {
    return item.actual_value > item.target_value
  }

  // Environmental Performance: 不显示备注（因为是选择框）
  if (item.description === 'Environmental Performance') {
    return false
  }

  return false
}

// 处理输入变化
const handleInput = () => {
  isDataChanged.value = true
  showChangeAlert.value = true
}

// 加载数据
const loadData = async () => {
  loading.value = true

  try {
    // 初始化数据
    kpiData.value = initializeKpiData()

    // 获取KPI数据
    const response = await get('/ehs/kpi/', {
      params: {
        month: selectedMonth.value,
        year: selectedYear.value
      }
    })

    if (response.data && response.data.length > 0) {
      // 将API返回的数据映射到表格数据
      response.data.forEach(item => {
        const existingItem = kpiData.value.find(
          k => k.area === item.area && k.description === item.description
        )

        if (existingItem) {
          // Environmental Performance 特殊处理
          if (existingItem.description === 'Environmental Performance') {
            // 如果API返回的是字符串，转换为数字；如果已经是数字，直接使用
            existingItem.actual_value = typeof item.actual_value === 'string'
              ? (environmentalTextToValue[item.actual_value] || 4)
              : (item.actual_value || 4)
            existingItem.target_value = typeof item.target_value === 'string'
              ? (environmentalTextToValue[item.target_value] || 4)
              : (item.target_value || 4)
            existingItem.ytd_value = typeof item.ytd_value === 'string'
              ? (environmentalTextToValue[item.ytd_value] || 4)
              : (item.ytd_value || 4)
          } else {
            existingItem.actual_value = item.actual_value || 0
            existingItem.target_value = item.target_value || 0
            existingItem.ytd_value = item.ytd_value || 0
          }
          existingItem.remark = item.remark || null
          existingItem.action_plan_content = item.action_plan_content || null
          existingItem.expected_close_date = item.expected_close_date || null
          existingItem.actual_close_date = item.actual_close_date || null
          existingItem.root_cause_analysis = item.root_cause_analysis || null
        }
      })
    }

    // 保存原始数据用于比较
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value))
    isDataChanged.value = false
    showChangeAlert.value = false

  } catch (error) {
    console.error('加载数据失败:', error)
    Message.error(`加载数据失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 保存数据
const saveData = async () => {
  submitting.value = true

  try {
    const payload = {
      month: selectedMonth.value,
      year: selectedYear.value,
      items: kpiData.value.map(item => ({
        area: item.area,
        description: item.description,
        actual_value: item.actual_value,
        ytd_value: item.ytd_value,
        remark: item.remark,
        action_plan_content: item.action_plan_content,
        expected_close_date: item.expected_close_date,
        actual_close_date: item.actual_close_date,
        root_cause_analysis: item.root_cause_analysis
      }))
    }

    const result = await put('/ehs/kpi/', payload)

    Message.success('数据保存成功')
    isDataChanged.value = false
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value))

  } catch (error) {
    console.error('保存数据失败:', error)
    Message.error(`保存失败: ${error.message || '未知错误'}`)
  } finally {
    submitting.value = false
  }
}

// 打开目标值对话框
const openTargetDialog = async () => {
  try {
    // 获取目标值数据
    const response = await get('/ehs/kpi/targets/', {
      params: {
        year: selectedYear.value
      }
    })

    if (response.data && response.data.length > 0) {
      // 转换API返回的数据，将Environmental Performance的字符串值转换为数字
      targetData.value = response.data.map(item => ({
        ...item,
        target_value: item.description === 'Environmental Performance' && typeof item.target_value === 'string'
          ? (environmentalTextToValue[item.target_value] || 4)
          : item.target_value
      }))
    } else {
      // 如果没有目标值，创建默认结构
      targetData.value = []

      // KPI指标列表
      const kpiList = [
        'H&S Numeric Score',
        'Environmental Performance',
        'Severity incident',
        'Number of H&S audit/inspection action plans open >9 months'
      ]

      // 区域列表
      const areaList = ['TJC', 'TJM', '汇总']

      kpiList.forEach(description => {
        areaList.forEach(area => {
          targetData.value.push({
            area,
            description,
            target_value: description === 'Environmental Performance' ? 4 : 0 // Green = 4
          })
        })
      })
    }

    targetDialog.value = true
  } catch (error) {
    console.error('获取目标值失败:', error)
    Message.error('获取目标值失败')
  }
}

// 保存目标值
const saveTargets = async () => {
  savingTargets.value = true

  try {
    const payload = {
      year: selectedYear.value,
      items: targetData.value.map(item => ({
        area: item.area,
        description: item.description,
        target_value: item.description === 'Environmental Performance'
          ? (item.target_value || 4) // 确保发送数字值，默认为4 (Green)
          : (item.target_value || 0)
      }))
    }

    await put('/ehs/kpi/targets/', payload)

    Message.success('目标值保存成功')
    targetDialog.value = false

    // 重新加载数据以更新目标值显示
    loadData()

  } catch (error) {
    console.error('保存目标值失败:', error)
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || '未知错误'
    Message.error(`保存目标值失败: ${errorMessage}`)
  } finally {
    savingTargets.value = false
  }
}

// 弹窗相关方法
const openRemarkDialog = (item) => {
  selectedItem.value = item
  remarkDialog.value = true
}

const getRemarkButtonText = (item) => {
  if (hasRemarkContent(item)) {
    return '查看/编辑'
  }
  return '填写分析'
}

// hasRemarkContent 函数现在从工具模块导入

const saveRemarkData = (data) => {
  if (selectedItem.value) {
    selectedItem.value.root_cause_analysis = data.root_cause_analysis
    selectedItem.value.action_plan_content = data.action_plan_content
    selectedItem.value.expected_close_date = data.expected_close_date
    selectedItem.value.actual_close_date = data.actual_close_date
    handleInput()
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 固定头部容器 - 类似冻结窗格 */
.sticky-header-container {
  position: sticky;
  top: 64px; /* 导航栏高度 */
  z-index: 1000;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 控制栏样式 */
.controls-bar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  padding: 20px;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

/* 可滚动表格容器 */
.scrollable-table-container {
  background: white;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* 冻结头部表格样式 */
.frozen-header-table {
  background: transparent;
}

.frozen-header-table :deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}

.frozen-header-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 999;
}

.frozen-header-table :deep(thead tr th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  padding: 16px 12px;
  position: sticky;
  top: 0;
  z-index: 999;
}

/* 控制组件美化 */
.control-select :deep(.v-field) {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.control-select :deep(.v-field:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 操作按钮美化 */
.action-btn {
  transition: all 0.3s ease;
  font-weight: 500;
  border-radius: 8px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* EHS KPI特殊样式 */
/* EHS KPI表格专用悬停样式 - 避免闪烁 */
.ehs-data-table :deep(.v-data-table__tr:hover) {
  background: rgba(239, 68, 68, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

.ehs-data-table :deep(.v-data-table tbody tr:hover) {
  background: rgba(239, 68, 68, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

/* 禁用其他可能的悬停效果 */
.ehs-data-table:hover {
  transform: none !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
}

.ehs-kpi-table .text-field-small :deep(.v-field) {
  background: rgba(239, 68, 68, 0.02);
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.ehs-kpi-table .text-field-small :deep(.v-field:hover) {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.ehs-kpi-table .text-field-small :deep(.v-field--focused) {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Environmental Performance 选择框特殊样式 */
.environmental-select :deep(.v-field) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.02) 0%, rgba(134, 239, 172, 0.02) 100%);
  border: 1px solid rgba(34, 197, 94, 0.1);
}

.environmental-select :deep(.v-field:hover) {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.environmental-select :deep(.v-field--focused) {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* 字体样式 */
.text-field-small {
  max-width: 120px;
}

.font-weight-medium {
  font-weight: 500;
}

/* 芯片美化 */
:deep(.v-chip) {
  font-weight: 500;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
  border-radius: 8px;
}

:deep(.v-chip:hover) {
  transform: scale(1.05);
}

/* 对话框美化 */
:deep(.v-dialog .v-card) {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

:deep(.v-dialog .v-card-title) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
  font-weight: 600;
}

/* 响应式优化 */
@media (max-width: 1264px) {
  .sticky-header-container {
    top: 56px; /* 移动端导航栏高度 */
  }
}

@media (max-width: 960px) {
  .controls-bar {
    padding: 16px;
  }

  .scrollable-table-container {
    border-radius: 0 0 12px 12px;
  }

  .frozen-header-table :deep(.v-data-table__wrapper) {
    max-height: calc(100vh - 240px);
  }

  .frozen-header-table :deep(thead tr th) {
    padding: 12px 8px;
    font-size: 0.875rem;
  }

  .ehs-kpi-table :deep(tbody tr td) {
    padding: 8px;
  }
}

@media (max-width: 600px) {
  .controls-bar {
    padding: 12px;
  }

  .frozen-header-table :deep(.v-data-table__wrapper) {
    max-height: calc(100vh - 220px);
  }

  .text-field-small {
    max-width: 100px;
  }
}

/* 加载动画美化 */
:deep(.v-progress-circular) {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Snackbar美化 */
:deep(.v-snackbar) {
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
</style>
