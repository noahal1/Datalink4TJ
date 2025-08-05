<template>
  <unified-page-template 
    title="维修KPI管理"
    icon="mdi-wrench"
    color="warning"
  >
    <!-- 顶部控制栏 -->
    <v-row class="mb-4 align-center">
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

      <!-- 右侧：操作按钮 -->
      <v-col
        cols="12"
        md="6"
        class="text-right"
      >
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-target"
          class="mr-2"
          @click="openTargetDialog"
        >
          目标值管理
        </v-btn>
        
        <v-btn
          color="success"
          prepend-icon="mdi-content-save"
          :loading="submitting"
          :disabled="!isDataChanged"
          @click="saveData"
        >
          保存数据
        </v-btn>
      </v-col>
    </v-row>

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

    <!-- KPI 数据表格 -->
    <unified-data-table
      :headers="headers"
      :items="kpiData"
      :loading="loading"
      density="comfortable"
      class="mb-6"
      hide-default-footer
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

      <!-- 目标值显示 -->
      <template #item.target_value="{ item }">
        <div class="text-center">
          <v-chip
            :color="item.target_value > 0 ? 'primary' : 'grey'"
            size="small"
            variant="flat"
          >
            {{ item.target_value || 0 }}
          </v-chip>
        </div>
      </template>

      <!-- YTD值输入 -->
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

      <!-- 达成状态 -->
      <template #item.status="{ item }">
        <v-chip
          :color="getStatusColor(item)"
          size="small"
          variant="flat"
        >
          {{ getStatusText(item) }}
        </v-chip>
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
          {{ selectedYear }}年 维修KPI 目标值设置
        </v-card-title>
        
        <v-card-text>
          <unified-data-table
            :headers="targetHeaders"
            :items="targetData"
            :loading="false"
            density="compact"
            :items-per-page="50"
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
import { ref, onMounted } from 'vue'
import { get, put } from '@/utils/api'
import Message from '@/utils/notification'
import UnifiedPageTemplate from '@/components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '@/components/UnifiedDataTable.vue'
import KpiRemarkDialog from '@/components/KpiRemarkDialog.vue'

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

// KPI数据
const kpiData = ref([])
const originalKpiData = ref([])

// 表格头部配置
const headers = [
  { title: 'KPI指标', key: 'description', width: '30%', sortable: false },
  { title: '区域', key: 'area', width: '12%', sortable: false },
  { title: '实际值(%)', key: 'actual_value', width: '14%', sortable: false },
  { title: '目标值(%)', key: 'target_value', width: '14%', sortable: false },
  { title: 'YTD(%)', key: 'ytd_value', width: '14%', sortable: false },
  { title: '达成状态', key: 'status', width: '12%', sortable: false },
  { title: '原因分析', key: 'remark', width: '14%', sortable: false }
]

// 目标值表格头部
const targetHeaders = [
  { title: 'KPI指标', key: 'description', width: '60%', sortable: false },
  { title: '区域', key: 'area', width: '20%', sortable: false },
  { title: '目标值(%)', key: 'target_value', width: '20%', sortable: false }
]

// 初始化KPI数据结构
const initializeKpiData = () => {
  const kpiList = [
    'Preventative Maintenance Attainment'
  ]

  const areaList = ['TJC', 'TJM', '汇总']
  const data = []

  kpiList.forEach(description => {
    areaList.forEach(area => {
      data.push({
        area,
        description,
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
  if (!item.target_value || item.target_value === 0) return 'grey'

  // Preventative Maintenance Attainment: 值越高越好
  const ratio = item.actual_value / item.target_value
  if (ratio >= 1) return 'success'
  if (ratio >= 0.8) return 'warning'
  return 'error'
}

// 获取状态文本
const getStatusText = (item) => {
  if (!item.target_value || item.target_value === 0) return '无目标'

  const ratio = item.actual_value / item.target_value
  if (ratio >= 1) return '达成'
  if (ratio >= 0.8) return '接近'
  return '未达成'
}

// 判断是否需要显示备注字段
const shouldShowRemark = (item) => {
  if (!item.target_value || item.target_value === 0) return false

  // Preventative Maintenance Attainment: 小于目标值时显示备注
  return item.actual_value < item.target_value
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
    const response = await get('/maint/kpi/', {
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
        action_plan: item.action_plan,
        root_cause_analysis: item.root_cause_analysis
      }))
    }

    await put('/maint/kpi/', payload)

    Message.success('数据保存成功')
    isDataChanged.value = false

    // 更新原始数据
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
    const response = await get('/maint/kpi/targets/', {
      params: {
        year: selectedYear.value
      }
    })

    if (response.data && response.data.length > 0) {
      targetData.value = response.data
    } else {
      // 如果没有目标值，创建默认结构
      targetData.value = []

      // KPI指标列表
      const kpiList = [
        'Preventative Maintenance Attainment'
      ]

      // 区域列表
      const areaList = ['TJC', 'TJM', '汇总']

      kpiList.forEach(description => {
        areaList.forEach(area => {
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

    await put('/maint/kpi/targets/', payload)

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
.maintenance-kpi-table {
  background: transparent;
}

.maintenance-kpi-table :deep(.v-data-table__wrapper) {
  border-radius: 16px;
}

.maintenance-kpi-table :deep(thead tr th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  padding: 16px 12px;
}

.maintenance-kpi-table :deep(tbody tr) {
  transition: all 0.2s ease;
}

.maintenance-kpi-table :deep(tbody tr:hover) {
  background: rgba(59, 130, 246, 0.04);
}

.maintenance-kpi-table :deep(tbody tr td) {
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

  .maintenance-kpi-table :deep(tbody tr td) {
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
