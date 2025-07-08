<template>
  <unified-page-template 
    title="EHS KPI数据管理"
    icon="mdi-shield-check"
    color="success"
  >
    <!-- 顶部控制栏 -->
    <div class="controls-bar mb-6">
      <v-row class="align-center">
        <!-- 左侧：月份和年份选择器 -->
        <v-col cols="12" md="6">
          <v-row>
            <v-col cols="6" md="4">
              <v-select
                v-model="selectedMonth"
                :items="monthOptions"
                label="选择月份"
                variant="outlined"
                density="compact"
                @update:model-value="loadData"
                hide-details
                class="control-select"
              ></v-select>
            </v-col>
            <v-col cols="6" md="4">
              <v-select
                v-model="selectedYear"
                :items="yearOptions"
                label="选择年份"
                variant="outlined"
                density="compact"
                @update:model-value="loadData"
                hide-details
                class="control-select"
              ></v-select>
            </v-col>
          </v-row>
        </v-col>

        <v-spacer></v-spacer>

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
            @click="saveData"
            class="action-btn"
            variant="elevated"
          >
            保存数据
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- 加载指示器 -->
    <loading-overlay :loading="loading" message="加载数据中..." />

    <!-- 数据变更提醒 -->
    <v-snackbar
      v-model="showChangeAlert"
      :timeout="0"
      color="warning"
      location="bottom"
      multi-line
      class="change-alert"
    >
      <v-icon icon="mdi-alert" class="mr-2" />
      数据已修改，请记得保存！
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="saveData"
          :loading="submitting"
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
    <div class="table-container">
      <unified-data-table
        :headers="headers"
        :items="kpiData"
        :loading="loading"
        density="comfortable"
        class="ehs-kpi-table"
        hover
      >
      <!-- KPI描述列 -->
      <template v-slot:item.description="{ item }">
        <div class="font-weight-medium">
          {{ item.description }}
        </div>
      </template>

      <!-- 区域列 -->
      <template v-slot:item.area="{ item }">
        <v-chip
          :color="getAreaColor(item.area)"
          size="small"
          variant="flat"
        >
          {{ item.area }}
        </v-chip>
      </template>

      <!-- 实际值输入 -->
      <template v-slot:item.actual_value="{ item }">
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
        ></v-select>
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
        ></v-text-field>
      </template>

      <!-- 目标值显示 -->
      <template v-slot:item.target_value="{ item }">
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
      <template v-slot:item.ytd_value="{ item }">
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
        ></v-select>
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
        ></v-text-field>
      </template>

      <!-- 原因分析与行动计划 -->
      <template v-slot:item.remark="{ item }">
        <div v-if="shouldShowRemark(item)" class="d-flex align-center">
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
        <span v-else class="text-grey">-</span>
      </template>
    </unified-data-table>
  </div>

    <!-- 目标值管理对话框 -->
    <v-dialog v-model="targetDialog" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-target</v-icon>
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
            <template v-slot:item.area="{ item }">
              <v-chip
                :color="getAreaColor(item.area)"
                size="small"
                variant="flat"
              >
                {{ item.area }}
              </v-chip>
            </template>

            <!-- 目标值输入 -->
            <template v-slot:item.target_value="{ item }">
              <v-text-field
                v-model.number="item.target_value"
                type="number"
                min="0"
                step="0.01"
                variant="outlined"
                density="compact"
                hide-details
                class="text-field-small"
              ></v-text-field>
            </template>
          </unified-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
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
import LoadingOverlay from '@/components/LoadingOverlay.vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
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

// Environmental Performance 选项
const environmentalOptions = [
  { title: 'Green', value: 'Green' },
  { title: 'Yellow/Green', value: 'Yellow/Green' },
  { title: 'Yellow', value: 'Yellow' },
  { title: 'Red', value: 'Red' }
]

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
        actual_value: description === 'Environmental Performance' ? 'Green' : 0,
        target_value: 0,
        ytd_value: description === 'Environmental Performance' ? 'Green' : 0,
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
  // Environmental Performance 特殊处理
  if (item.description === 'Environmental Performance') {
    const colorMap = {
      'Green': 'success',
      'Yellow/Green': 'warning',
      'Yellow': 'warning',
      'Red': 'error'
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
    return item.actual_value || 'Green'
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

    const result = await put('/ehs/kpi/', payload)

    Message.success('数据保存成功')
    isDataChanged.value = false
    showChangeAlert.value = false
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
      targetData.value = response.data
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

    await put('/ehs/kpi/targets/', payload)

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
/* 导入通用KPI样式 */
@import '@/styles/kpi-page-enhancement.css';

/* EHS KPI特殊样式 */
.ehs-kpi-table :deep(tbody tr:hover) {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(252, 165, 165, 0.03) 100%);
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
</style>
