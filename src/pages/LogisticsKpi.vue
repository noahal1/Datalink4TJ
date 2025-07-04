<template>
  <unified-page-template
    title="物流KPI数据管理"
    icon="mdi-truck"
    color="info"
  >
    <!-- 顶部控制栏 -->
    <v-row class="mb-4 align-center">
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
            ></v-select>
          </v-col>
        </v-row>
      </v-col>

      <!-- 右侧：操作按钮 -->
      <v-col cols="12" md="6" class="text-right">
        <v-btn
          color="info"
          @click="openTargetDialog"
          prepend-icon="mdi-target"
          variant="outlined"
          class="mr-2"
        >
          设置目标值
        </v-btn>
        <v-btn
          color="secondary"
          @click="resetData"
          :disabled="!isDataChanged"
          prepend-icon="mdi-refresh"
          variant="outlined"
          class="mr-2"
        >
          重置
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

    <!-- KPI数据表格 -->
    <unified-data-table
      :headers="headers"
      :items="kpiData"
      :loading="loading"
      density="comfortable"
      class="mb-6"
      hide-default-footer=""
      :items-per-page="-1"
    >
      <template v-slot:item.description="{ item }">
        <div class="font-weight-medium">
          {{ item.description }}
        </div>
      </template>
      <template v-slot:item.area="{ item }">
        <v-chip
          :color="getAreaColor(item.area)"
          size="small"
          variant="flat"
        >
          {{ item.area }}
        </v-chip>
      </template>

      <template v-slot:item.actual_value="{ item }">
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
        ></v-text-field>
      </template>

      <template v-slot:item.target_value="{ item }">
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

      <template v-slot:item.ytd_value="{ item }">
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

    <!-- 目标值管理对话框 -->
    <v-dialog v-model="targetDialog" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-target</v-icon>
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
            <template v-slot:item.area="{ item }">
              <v-chip
                :color="getAreaColor(item.area)"
                size="small"
                variant="flat"
              >
                {{ item.area }}
              </v-chip>
            </template>
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
            :disabled="savingTargets"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="saveTargets"
            :loading="savingTargets"
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

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
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
const areas = ['新厂', '老厂', '汇总']

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
    '新厂': 'primary',
    '老厂': 'secondary',
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

// 检查是否有备注内容
const hasRemarkContent = (item) => {
  return !!(item.action_plan || item.root_cause_analysis)
}

// 打开备注对话框
const openRemarkDialog = (item) => {
  selectedItem.value = item
  remarkDialog.value = true
}

// 保存备注
const saveRemark = (remarkData) => {
  if (selectedItem.value) {
    selectedItem.value.action_plan = remarkData.action_plan
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
          existingItem.action_plan = item.action_plan || null
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
        action_plan: item.action_plan,
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
.text-field-small {
  max-width: 120px;
}

.v-chip {
  font-weight: 500;
}

.font-weight-medium {
  font-weight: 500;
}
</style>
