<template>
  <unified-page-template
    title="GMO KPI管理"
    icon="mdi-dna"
    color="primary"
  >
    <!-- 固定区域：控制栏 + 表格头部 -->
    <div class="sticky-header-container">
      <!-- 顶部控制栏 -->
      <div class="controls-bar">
        <v-row class="align-center">
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

          <!-- 右侧：工具栏 -->
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
              :loading="submitting"
              :disabled="!isDataChanged"
              prepend-icon="mdi-content-save"
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
        class="gmo-kpi-table kpi-data-table frozen-header-table"
        hover
        hide-default-footer=""
        :items-per-page="-1"
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
              color="info"
              size="small"
              variant="flat"
            >
              {{ formatNumber(item.target_value || 0) }}
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
            -
          </div>
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
      数据已修改，请记得保存
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="showChangeAlert = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>

    <!-- 目标值设置对话框 -->
    <v-dialog
      v-model="targetDialog"
      max-width="800px"
    >
      <v-card>
        <v-card-title class="text-h5">
          设置 {{ selectedYear }} 年度目标值
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="targetHeaders"
            :items="targetData"
            density="compact"
            :items-per-page="50"
            hide-default-footer
            class="elevation-1"
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
                class="text-field-small"
              />
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
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

// 表格头部
const headers = [
  { title: '描述', key: 'description', align: 'start', width: '250px' },
  { title: '区域', key: 'area', align: 'center', width: '100px' },
  { title: '实际值', key: 'actual_value', align: 'center', width: '120px' },
  { title: '目标值', key: 'target_value', align: 'center', width: '120px' },
  { title: 'YTD', key: 'ytd_value', align: 'center', width: '120px' },
  { title: '原因分析', key: 'remark', align: 'center', width: '150px' },
]

// 目标值表格头部
const targetHeaders = [
  { title: '描述', key: 'description', align: 'start', width: '300px' },
  { title: '区域', key: 'area', align: 'center', width: '100px' },
  { title: '目标值', key: 'target_value', align: 'center', width: '150px' },
]

// GMO KPI指标列表
const kpiDescriptions = [
  'Purchasing',
  'Engineering (VA/VE)',
  'Continuous Improvement',
  'Total cost saving',
  'Audit score',
  'AP/AR Spread',
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

  // 定义每个指标对应的区域
  const kpiAreaMapping = {
    'Purchasing': ['TJM', 'TJC', '汇总'],
    'Engineering (VA/VE)': ['TJM', 'TJC', '汇总'],
    'Continuous Improvement': ['TJM', 'TJC', '汇总'],
    'Total cost saving': ['TJM', 'TJC', '汇总'],
    'Audit score': ['TJM', 'TJC', '汇总'],
    'AP/AR Spread': ['TJM', 'TJC', '汇总'],
  }

  kpiDescriptions.forEach(description => {
    const applicableAreas = kpiAreaMapping[description] || areas
    applicableAreas.forEach(area => {
      data.push({
        id: id++,
        description,
        area,
        actual_value: 0,
        target_value: 0,
        ytd_value: 0,
        remark: null,
        action_plan: null,
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

// 判断是否显示备注输入框 - 只有AP/AR Spread指标需要填写原因分析
const shouldShowRemark = (item) => {
  // 只有AP/AR Spread指标在实际值小于目标值时显示备注填写按钮
  if (item.description === 'AP/AR Spread') {
    return (item.actual_value || 0) < (item.target_value || 0)
  }
  // 其他GMO指标都不需要填写原因分析
  return false
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
    const response = await get('/gmo/kpi/', {
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
          existingItem.action_plan = item.action_plan || null
          existingItem.root_cause_analysis = item.root_cause_analysis || null
        }
      })
    } else {
      // 如果没有数据，尝试获取目标值
      try {
        const targetResponse = await get('/gmo/kpi/targets/', {
          params: { year: selectedYear.value }
        })

        if (targetResponse.data && targetResponse.data.length > 0) {
          targetResponse.data.forEach(target => {
            const existingItem = kpiData.value.find(
              k => k.area === target.area && k.description === target.description
            )

            if (existingItem) {
              existingItem.target_value = target.target_value || 0
            }
          })
        }
      } catch (error) {
        console.error('获取目标值失败:', error)
      }
    }

    // 保存原始数据用于比较
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value))
    isDataChanged.value = false

  } catch (error) {
    console.error('获取GMO KPI数据失败:', error)
    Message.error(`获取数据失败: ${error.message || '未知错误'}`)
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
        action_plan: item.action_plan,
        root_cause_analysis: item.root_cause_analysis
      }))
    }

    await put('/gmo/kpi/', payload)

    Message.success('数据保存成功')
    isDataChanged.value = false

    // 更新原始数据
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value))

  } catch (error) {
    console.error('保存数据失败:', error)
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || '未知错误'
    Message.error(`保存失败: ${errorMessage}`)
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

// 监听月份和年份变化
watch([selectedMonth, selectedYear], () => {
  if (isDataChanged.value) {
    // 如果有未保存的数据，提示用户
    if (confirm('当前有未保存的数据，切换月份将丢失这些数据，是否继续？')) {
      loadData()
    } else {
      // 恢复之前的选择
      return
    }
  } else {
    loadData()
  }
})

// 打开目标值设置对话框
const openTargetDialog = async () => {
  try {
    // 获取当前目标值
    const response = await get('/gmo/kpi/targets/', {
      params: { year: selectedYear.value }
    })

    if (response.data && response.data.length > 0) {
      targetData.value = response.data
    } else {
      // 如果没有目标值，创建默认结构
      targetData.value = []

      // 定义每个指标对应的区域
      const kpiAreaMapping = {
        'Purchasing': ['TJM', 'TJC', '汇总'],
        'Engineering (VA/VE)': ['TJM', 'TJC', '汇总'],
        'Continuous Improvement': ['TJM', 'TJC', '汇总'],
        'Total cost saving': ['TJM', 'TJC', '汇总'],
        'Audit score': ['TJM', 'TJC', '汇总'],
        'AP/AR Spread': ['TJM', 'TJC', '汇总'],
      }

      kpiDescriptions.forEach(description => {
        const applicableAreas = kpiAreaMapping[description] || areas
        applicableAreas.forEach(area => {
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
    const payload = {
      year: selectedYear.value,
      items: targetData.value.map(item => ({
        area: item.area,
        description: item.description,
        target_value: item.target_value || 0
      }))
    }

    await put('/gmo/kpi/targets/', payload)

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

const hasRemarkContent = (item) => {
  return (item.root_cause_analysis && item.root_cause_analysis.trim()) ||
         (item.action_plan && item.action_plan.trim())
}

const saveRemarkData = (data) => {
  if (selectedItem.value) {
    selectedItem.value.root_cause_analysis = data.root_cause_analysis
    selectedItem.value.action_plan = data.action_plan
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
.gmo-kpi-table {
  background: transparent;
}

.gmo-kpi-table :deep(.v-data-table__wrapper) {
  border-radius: 16px;
}

.gmo-kpi-table :deep(thead tr th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  padding: 16px 12px;
}

.gmo-kpi-table :deep(tbody tr) {
  transition: all 0.2s ease;
}

/* GMO KPI表格专用悬停样式 - 避免闪烁 */
.kpi-data-table :deep(.v-data-table__tr:hover) {
  background: rgba(59, 130, 246, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

.kpi-data-table :deep(.v-data-table tbody tr:hover) {
  background: rgba(59, 130, 246, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

/* 禁用其他可能的悬停效果 */
.kpi-data-table:hover {
  transform: none !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
}

.gmo-kpi-table :deep(tbody tr td) {
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

  .gmo-kpi-table :deep(tbody tr td) {
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
