<template>
  <unified-page-template
    title="工程KPI管理"
    icon="mdi-engineering"
    color="primary"
  >
    <v-row class="mb-4 align-center">
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
              @update:model-value="loadData"
            />
          </v-col>
        </v-row>
      </v-col>

      <v-col
        cols="12"
        md="6"
        class="text-right"
      >
        <v-btn
          color="info"
          prepend-icon="mdi-target"
          variant="outlined"
          class="mr-2"
          @click="openTargetDialog"
        >
          设置目标值
        </v-btn>
        <v-btn
          color="secondary"
          :disabled="!isDataChanged"
          prepend-icon="mdi-refresh"
          variant="outlined"
          class="mr-2"
          @click="resetData"
        >
          重置
        </v-btn>
        <v-btn
          color="primary"
          :loading="submitting"
          :disabled="!isDataChanged"
          prepend-icon="mdi-content-save"
          variant="elevated"
          @click="saveData"
        >
          保存数据
        </v-btn>
      </v-col>
    </v-row>

    <unified-data-table
      :headers="headers"
      :items="kpiData"
      :loading="loading"
      density="comfortable"
      class="mb-6"
      hide-default-footer=""
      :items-per-page="-1"
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

      <template #item.target_value="{ item }">
        <div class="text-center">
          <v-chip
            :color="item.target_value > 0 ? 'success' : 'grey'"
            size="small"
            variant="flat"
          >
            {{ formatNumber(item.target_value) }}%
          </v-chip>
        </div>
      </template>

      <template #item.achievement_rate="{ item }">
        <div class="d-flex align-center justify-center">
          <v-progress-circular
            :model-value="getAchievementRate(item.actual_value, item.target_value)"
            :color="getAchievementColor(getAchievementRate(item.actual_value, item.target_value))"
            size="40"
            width="4"
          >
            <span class="text-caption font-weight-bold">
              {{ getAchievementRate(item.actual_value, item.target_value) }}%
            </span>
          </v-progress-circular>
        </div>
      </template>

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
        <div
          v-else
          class="text-center text-grey"
        >
          <v-icon>mdi-check-circle</v-icon>
          <div class="text-caption">
            达标
          </div>
        </div>
      </template>
    </unified-data-table>

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

    <!-- 目标值设置弹窗 -->
    <v-dialog
      v-model="targetDialog"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          <v-icon start>
            mdi-target
          </v-icon>
          设置工程KPI目标值 ({{ selectedYear }}年)
        </v-card-title>
        <v-card-text class="pa-6">
          <unified-data-table
            :headers="targetHeaders"
            :items="targetData"
            density="compact"
            hide-default-footer
          >
            <template #item.target_value="{ item }">
              <v-text-field
                v-model.number="item.target_value"
                type="number"
                min="0"
                step="0.01"
                variant="outlined"
                density="compact"
                hide-details
                suffix="%"
              />
            </template>
          </unified-data-table>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            color="grey"
            variant="outlined"
            @click="targetDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
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
const showChangeAlert = ref(false)

// 目标值弹窗相关
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

const headers = [
  { title: '描述', key: 'description', align: 'start', width: '280px' },
  { title: '区域', key: 'area', align: 'center', width: '100px' },
  { title: '实际值', key: 'actual_value', align: 'center', width: '120px' },
  { title: '目标值', key: 'target_value', align: 'center', width: '120px' },
  { title: 'YTD', key: 'ytd_value', align: 'center', width: '120px' },
  { title: '原因分析', key: 'remark', align: 'center', width: '150px' },
]

const targetHeaders = [
  { title: '描述', key: 'description', align: 'start', width: '280px' },
  { title: '区域', key: 'area', align: 'center', width: '120px' },
  { title: '目标值 (%)', key: 'target_value', align: 'center', width: '150px' },
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

  // 工程KPI项目 - Achievement of CT Target at PPAP Approval
  const kpiItems = [
    { description: 'Achievement of CT Target at PPAP Approval', areas: ['TJM', 'TJC', '汇总'] }
  ]

  kpiItems.forEach(kpiItem => {
    kpiItem.areas.forEach(area => {
      data.push({
        id: id++,
        description: kpiItem.description,
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

// 工具函数
const getAreaColor = (area) => {
  const colors = {
    'TJM': 'primary',
    'TJC': 'secondary',
    '汇总': 'success'
  }
  return colors[area] || 'default'
}

const getAchievementRate = (actual, target) => {
  if (target === 0) return 0
  return Math.round((actual / target) * 100)
}

const getAchievementColor = (rate) => {
  if (rate >= 100) return 'success'
  if (rate >= 80) return 'warning'
  return 'error'
}

const formatNumber = (value) => {
  if (value === 0) return '0'
  return value.toLocaleString()
}

// 判断是否显示备注输入框 - 实际值低于目标值时显示
const shouldShowRemark = (item) => {
  return (item.actual_value || 0) < (item.target_value || 0)
}

// 处理输入变更
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
    const response = await get('/eng/kpi/', {
      params: {
        month: selectedMonth.value,
        year: selectedYear.value
      }
    })

    if (response.data && response.data.length > 0) {
      // 将API返回的数据映射到表格数据
      response.data.forEach(item => {
        const existingItem = kpiData.value.find(
          kpi => kpi.area === item.area && kpi.description === item.description
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
    } else {
      // 如果没有数据，尝试获取目标值
      try {
        const targetResponse = await get('/eng/kpi/targets/', {
          params: { year: selectedYear.value }
        })

        if (targetResponse.data && targetResponse.data.length > 0) {
          targetResponse.data.forEach(target => {
            const existingItem = kpiData.value.find(
              kpi => kpi.area === target.area && kpi.description === target.description
            )
            if (existingItem) {
              existingItem.target_value = target.target_value || 0
            }
          })
        }
      } catch (error) {
        console.warn('获取目标值失败:', error)
      }
    }

    // 保存原始数据用于重置
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value))
    isDataChanged.value = false
    showChangeAlert.value = false

  } catch (error) {
    console.error('加载数据失败:', error)
    Message.error('加载数据失败: ' + (error.response?.data?.detail || error.message))
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

    const result = await put('/eng/kpi/', payload)

    if (result.success) {
      Message.success('工程KPI数据保存成功')
      isDataChanged.value = false
      // 重新加载数据以获取最新状态
      await loadData()
    }
  } catch (error) {
    console.error('保存数据失败:', error)
    Message.error('保存数据失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    submitting.value = false
  }
}

// 重置数据
const resetData = () => {
  kpiData.value = JSON.parse(JSON.stringify(originalKpiData.value))
  isDataChanged.value = false
  showChangeAlert.value = false
  Message.info('数据已重置')
}

// 目标值管理
const openTargetDialog = async () => {
  try {
    // 初始化目标值数据
    const data = []
    let id = 1

    const kpiItems = [
      { description: 'Achievement of CT Target at PPAP Approval', areas: ['TJM', 'TJC', '汇总'] }
    ]

    kpiItems.forEach(kpiItem => {
      kpiItem.areas.forEach(area => {
        data.push({
          id: id++,
          description: kpiItem.description,
          area,
          target_value: 0
        })
      })
    })

    targetData.value = data

    // 获取现有目标值
    const response = await get('/eng/kpi/targets/', {
      params: { year: selectedYear.value }
    })

    if (response.data && response.data.length > 0) {
      response.data.forEach(target => {
        const existingItem = targetData.value.find(
          item => item.area === target.area && item.description === target.description
        )
        if (existingItem) {
          existingItem.target_value = target.target_value || 0
        }
      })
    }

    targetDialog.value = true
  } catch (error) {
    console.error('获取目标值失败:', error)
    Message.error('获取目标值失败: ' + (error.response?.data?.detail || error.message))
  }
}

const saveTargets = async () => {
  savingTargets.value = true

  try {
    const payload = {
      year: selectedYear.value,
      items: targetData.value.map(item => ({
        area: item.area,
        description: item.description,
        target_value: item.target_value || 0
      }))
    }

    await put('/eng/kpi/targets/', payload)

    Message.success('目标值保存成功')
    targetDialog.value = false

    // 重新加载数据以更新目标值显示
    loadData()

  } catch (error) {
    console.error('保存目标值失败:', error)
    Message.error('保存目标值失败')
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

// 监听年份变化，重新加载数据
watch(selectedYear, () => {
  loadData()
})
</script>

<style scoped>
/* 页面布局样式 */
.sticky-header-container {
  position: sticky;
  top: 64px; /* 考虑导航栏高度 */
  z-index: 1000;
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.controls-bar {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.scrollable-table-container {
  background: white;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-top: none;
}

/* 表格样式 */
.frozen-header-table {
  background: transparent;
}

.frozen-header-table :deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  border-radius: 0 0 16px 16px;
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

/* 表格容器美化 */
.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

/* 表格样式优化 */
.eng-kpi-table {
  background: transparent;
}

.eng-kpi-table :deep(.v-data-table__wrapper) {
  border-radius: 16px;
}

.eng-kpi-table :deep(thead tr th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  padding: 16px 12px;
}

.eng-kpi-table :deep(tbody tr) {
  transition: all 0.2s ease;
}

.eng-kpi-table :deep(tbody tr:hover) {
  background: rgba(59, 130, 246, 0.04);
}

.eng-kpi-table :deep(tbody tr td) {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

/* 文本字段美化 */
.text-field-small {
  max-width: 120px;
}

.text-field-small :deep(.v-field) {
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.02);
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.text-field-small :deep(.v-field:hover) {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.05);
  transform: scale(1.02);
}

.text-field-small :deep(.v-field--focused) {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 字体样式 */
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
    top: 56px;
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

  .eng-kpi-table :deep(tbody tr td) {
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
