<template>
  <unified-page-template 
    title="GMO KPI数据管理"
    icon="mdi-dna"
    color="primary">
    <v-row class="mb-4 align-center">
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
          color="primary"
          @click="saveData"
          :loading="submitting"
          :disabled="!isDataChanged"
          prepend-icon="mdi-content-save"
          variant="elevated"
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
            color="info"
            size="small"
            variant="flat"
          >
            {{ formatNumber(item.target_value || 0) }}
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

      <template v-slot:item.achievement_rate="{ item }">
        <div class="text-center">
          <v-progress-circular
            :model-value="getAchievementRate(item.actual_value || 0, item.target_value || 0)"
            :color="getAchievementColor(getAchievementRate(item.actual_value || 0, item.target_value || 0))"
            size="40"
            width="4"
          >
            <span class="text-caption">
              {{ getAchievementRate(item.actual_value || 0, item.target_value || 0) }}%
            </span>
          </v-progress-circular>
        </div>
      </template>
    </unified-data-table>

    <!-- 数据变更提示 -->
    <v-snackbar
      v-model="showChangeAlert"
      color="warning"
      timeout="3000"
    >
      数据已修改，请记得保存
      <template v-slot:actions>
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
    <v-dialog v-model="targetDialog" max-width="800px">
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
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="targetDialog = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveTargets" :loading="savingTargets">
            保存目标值
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { get, post, put } from '@/utils/api'
import Message from '@/utils/notification'
import UnifiedPageTemplate from '@/components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '@/components/UnifiedDataTable.vue'

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
  'Audit score'
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
        ytd_value: 0
      })
    })
  })

  return data
}

// 工具函数
const getAreaColor = (area) => {
  const colors = {
    '新厂': 'primary',
    '老厂': 'secondary',
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
        ytd_value: item.ytd_value
      }))
    }

    await put('/gmo/kpi/', payload)

    Message.success('数据保存成功')
    isDataChanged.value = false
    showChangeAlert.value = false

    // 更新原始数据
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value))

  } catch (error) {
    console.error('保存数据失败:', error)
    Message.error(`保存失败: ${error.message || '未知错误'}`)
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
    Message.error('保存目标值失败')
  } finally {
    savingTargets.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.text-field-small {
  max-width: 120px;
}

.font-weight-medium {
  font-weight: 500;
}
</style>
