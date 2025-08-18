<template>
  <unified-page-template
    title="物流KPI管理"
    icon="mdi-truck"
    color="info"
  >
    <!-- 固定区域：控制栏 + 表格头部 -->
    <div class="sticky-header-container">
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
            prepend-icon="mdi-target"
            variant="outlined"
            class="mr-2 action-btn"
            @click="openTargetDialog"
          >
            设置目标值
          </v-btn>
          <v-btn
            color="secondary"
            :disabled="!isDataChanged"
            prepend-icon="mdi-refresh"
            variant="outlined"
            class="mr-2 action-btn"
            @click="resetData"
          >
            重置
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="submitting"
            :disabled="!isDataChanged"
            variant="elevated"
            class="action-btn"
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

    <!-- 可滚动的数据表格容器 -->
    <div class="scrollable-table-container">
      <unified-data-table
        :headers="headers"
        :items="kpiData"
        :loading="loading"
        density="comfortable"
        class="logistics-kpi-table logistics-data-table frozen-header-table"
        hide-default-footer=""
        :items-per-page="-1"
        hover
        :fixed-header="true"
        :height="'calc(100vh - 280px)'"
      >
        <template #item.description="{ item }">
          <div class="font-weight-medium">
            {{ item.description }}
          </div>
        </template>
        <template #item.area="{ item }">
          <v-chip
            :color="getAreaColor(item.area)"
            size="small"
            variant="flat"
          >
            {{ item.area }}
          </v-chip>
        </template>

        <template #item.actual_value="{ item }">
          <v-text-field
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

        <template #item.target_value="{ item }">
          <div class="text-center">
            <v-chip
              :color="getTargetColor(item.actual_value, item.target_value, item.description)"
              size="small"
              variant="flat"
            >
              {{ item.target_value || 0 }}
            </v-chip>
          </div>
        </template>

        <template #item.ytd_value="{ item }">
          <v-text-field
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

    <!-- 数据变更提示 -->
    <v-snackbar
      v-model="showChangeAlert"
      :timeout="3000"
      color="warning"
      location="bottom"
      multi-line
      class="change-alert"
    >
      <v-icon
        start
        class="mr-2"
      >
        mdi-alert
      </v-icon>
      数据已修改，请记得保存
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
          {{ selectedYear }}年 物流KPI 目标值设置
        </v-card-title>
        <v-card-text>
          <unified-data-table
            :headers="targetHeaders"
            :items="targetData"
            :loading="savingTargets"
            density="compact"
            hide-default-footer=""
            :items-per-page="-1"
          >
            <template #item.area="{ item }">
              <v-chip
                :color="getAreaColor(item.area)"
                size="small"
                variant="flat"
              >
                {{ item.area }}
              </v-chip>
            </template>
            <template #item.target_value="{ item }">
              <v-text-field
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
            :disabled="savingTargets"
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

    <!-- 备注对话框 -->
    <kpi-remark-dialog
      v-model="remarkDialog"
      :item="selectedItem"
      @save="saveRemark"
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
const isDataChanged = ref(false)

// 目标值管理相关
const targetDialog = ref(false)
const savingTargets = ref(false)
const targetData = ref([])

// 备注对话框相关
const remarkDialog = ref(false)
const selectedItem = ref(null)

// 月份和年份选项
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  title: `${i + 1}月`,
  value: i + 1
}))

const yearOptions = Array.from({ length: 10 }, (_, i) => ({
  title: `${new Date().getFullYear() - 5 + i}年`,
  value: new Date().getFullYear() - 5 + i
}))

// 表格头部定义
const headers = [
  { title: 'KPI指标', key: 'description', width: '200px', sortable: false },
  { title: '区域', key: 'area', width: '100px', sortable: false },
  { title: '实际值', key: 'actual_value', width: '120px', sortable: false },
  { title: '目标值', key: 'target_value', width: '120px', sortable: false },
  { title: 'YTD', key: 'ytd_value', width: '120px', sortable: false },
  { title: '原因分析与行动计划', key: 'remark', width: '200px', sortable: false }
]

// 目标值表格头部
const targetHeaders = [
  { title: 'KPI指标', key: 'description', sortable: false },
  { title: '区域', key: 'area', width: '100px', sortable: false },
  { title: '目标值', key: 'target_value', width: '150px', sortable: false }
]

// KPI指标列表
const kpiDescriptions = [
  'Premium Freight',
  'On time delivery to customers',
  'DTime due to Logistics',
  'Inv Accuracy- Absolute Value',
  'Inv Accuracy - Absolute Count Difference',
  'DOH'
]

// 区域列表
const areas = ['TJM', 'TJC', '汇总']

// KPI数据
const kpiData = ref([])
const originalKpiData = ref([])

// 初始化KPI数据
const initializeKpiData = () => {
  const data = []
  let id = 1

  kpiDescriptions.forEach(description => {
    areas.forEach(area => {
      data.push({
        id: id++,
        description,
        area,
        actual_value: 0,
        target_value: 0,
        ytd_value: 0,
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
    'TJM': 'primary',
    'TJC': 'secondary',
    '汇总': 'success'
  }
  return colorMap[area] || 'grey'
}

// 获取目标值颜色
const getTargetColor = (actual, target, description) => {
  if (!target || target === 0) return 'grey'

  // Premium Freight、DTime due to Logistics、DOH 是大于目标值时显示警告
  const higherIsBetter = ['Premium Freight', 'DTime due to Logistics', 'DOH']

  if (higherIsBetter.includes(description)) {
    return actual > target ? 'error' : 'success'
  } else {
    // 其他指标是小于目标值时显示警告
    return actual < target ? 'error' : 'success'
  }
}

// 判断是否应该显示备注按钮
const shouldShowRemark = (item) => {
  if (!item.target_value || item.target_value === 0) return false

  // Premium Freight、DTime due to Logistics、DOH 是大于目标值时需要备注
  const higherIsBetter = ['Premium Freight', 'DTime due to Logistics', 'DOH']

  if (higherIsBetter.includes(item.description)) {
    return item.actual_value > item.target_value
  } else {
    // 其他指标是小于目标值时需要备注
    return item.actual_value < item.target_value
  }
}

// 获取备注按钮文本
const getRemarkButtonText = (item) => {
  return hasRemarkContent(item) ? '查看/编辑' : '添加备注'
}

// hasRemarkContent 函数现在从工具模块导入

// 打开备注对话框
const openRemarkDialog = (item) => {
  selectedItem.value = item
  remarkDialog.value = true
}

// 保存备注
const saveRemark = (remarkData) => {
  if (selectedItem.value) {
    selectedItem.value.action_plan_content = remarkData.action_plan_content
    selectedItem.value.expected_close_date = remarkData.expected_close_date
    selectedItem.value.actual_close_date = remarkData.actual_close_date
    selectedItem.value.root_cause_analysis = remarkData.root_cause_analysis
    handleInput()
  }
  remarkDialog.value = false
}

// 处理输入变化
const handleInput = () => {
  isDataChanged.value = true
}

// 加载数据
const loadData = async () => {
  loading.value = true

  try {
    // 初始化数据
    kpiData.value = initializeKpiData()

    // 获取KPI数据
    const response = await get('/logistics/kpi/', {
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
          existingItem.actual_value = item.actual_value || 0
          existingItem.target_value = item.target_value || 0
          existingItem.ytd_value = item.ytd_value || 0
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
  } catch (error) {
    console.error('加载物流KPI数据失败:', error)
    Message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 保存数据
const saveData = async () => {
  if (!isDataChanged.value) {
    Message.info('没有数据变更')
    return
  }

  submitting.value = true

  try {
    const updateData = {
      month: selectedMonth.value,
      year: selectedYear.value,
      items: kpiData.value.map(item => ({
        area: item.area,
        description: item.description,
        actual_value: item.actual_value || 0,
        ytd_value: item.ytd_value || 0,
        remark: item.remark,
        action_plan_content: item.action_plan_content,
        expected_close_date: item.expected_close_date,
        actual_close_date: item.actual_close_date,
        root_cause_analysis: item.root_cause_analysis
      }))
    }

    await put('/logistics/kpi/', updateData)

    Message.success('物流KPI数据保存成功')
    isDataChanged.value = false

    // 重新加载数据
    await loadData()
  } catch (error) {
    console.error('保存物流KPI数据失败:', error)
    Message.error('保存数据失败')
  } finally {
    submitting.value = false
  }
}

// 重置数据
const resetData = () => {
  kpiData.value = JSON.parse(JSON.stringify(originalKpiData.value))
  isDataChanged.value = false
  Message.info('数据已重置')
}

// 打开目标值对话框
const openTargetDialog = async () => {
  try {
    // 获取目标值数据
    const response = await get('/logistics/kpi/targets/', {
      params: {
        year: selectedYear.value
      }
    })

    if (response.data && response.data.length > 0) {
      targetData.value = response.data
    } else {
      // 如果没有目标值，创建默认结构
      targetData.value = []

      kpiDescriptions.forEach(description => {
        areas.forEach(area => {
          targetData.value.push({
            area,
            description,
            target_value: 0
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
    const updateData = {
      year: selectedYear.value,
      targets: targetData.value.map(target => ({
        year: selectedYear.value,
        area: target.area,
        description: target.description,
        target_value: target.target_value || 0
      }))
    }

    await put('/logistics/kpi/targets/', updateData)

    Message.success('目标值保存成功')
    targetDialog.value = false

    // 重新加载数据以更新目标值显示
    await loadData()
  } catch (error) {
    console.error('保存目标值失败:', error)
    Message.error('保存目标值失败')
  } finally {
    savingTargets.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})

// 监听月份和年份变化
watch([selectedMonth, selectedYear], () => {
  if (isDataChanged.value) {
    // 如果有未保存的更改，提示用户
    if (confirm('有未保存的更改，是否要放弃更改并切换？')) {
      loadData()
    } else {
      // 恢复之前的选择
      return
    }
  } else {
    loadData()
  }
})
</script>

<style scoped>
/* 导入通用KPI样式 */
@import '@/styles/kpi-page-enhancement.css';

/* 物流KPI特殊样式 - 紫色主题 */
/* 物流KPI表格专用悬停样式 - 避免闪烁 */
.logistics-data-table :deep(.v-data-table__tr:hover) {
  background: rgba(168, 85, 247, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

.logistics-data-table :deep(.v-data-table tbody tr:hover) {
  background: rgba(168, 85, 247, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

/* 禁用其他可能的悬停效果 */
.logistics-data-table:hover {
  transform: none !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
}

.logistics-kpi-table .text-field-small :deep(.v-field) {
  background: rgba(168, 85, 247, 0.02);
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.logistics-kpi-table .text-field-small :deep(.v-field:hover) {
  border-color: rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.05);
}

.logistics-kpi-table .text-field-small :deep(.v-field--focused) {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.08);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

/* 字体样式 */
.text-field-small {
  max-width: 120px;
}

.v-chip {
  font-weight: 500;
}

/* 固定头部容器 - 类似冻结窗格 */
.sticky-header-container {
  position: sticky;
  top: 64px; /* 导航栏高度 */
  z-index: 1000;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sticky-header-container .controls-bar {
  margin-bottom: 0 !important;
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

/* 可滚动表格容器 + 冻结表头 */
.scrollable-table-container {
  background: white;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

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
}

/* 响应式优化 */
@media (max-width: 1264px) {
  .sticky-header-container { top: 56px; }
}
@media (max-width: 960px) {
  .controls-bar { padding: 16px; }
  .scrollable-table-container { border-radius: 0 0 12px 12px; }
  .frozen-header-table :deep(.v-data-table__wrapper) { max-height: calc(100vh - 240px); }
  .frozen-header-table :deep(thead tr th) { padding: 12px 8px; font-size: 0.875rem; }
}
@media (max-width: 600px) {
  .controls-bar { padding: 12px; }
  .frozen-header-table :deep(.v-data-table__wrapper) { max-height: calc(100vh - 220px); }
  .text-field-small { max-width: 100px; }
}


.font-weight-medium {
  font-weight: 500;
}
</style>
