<template>
  <unified-page-template 
    title="DOH每日填报"
    icon="mdi-package-variant"
    color="info"
  >
    <!-- 顶部控制栏 -->
    <div class="controls-bar mb-4">
      <!-- 左侧：日期选择器 -->
      <v-row class="align-center">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="selectedDate"
            type="date"
            variant="outlined"
            density="compact"
            label="选择日期"
            @update:model-value="loadData"
            hide-details
          />
        </v-col>
        
        <v-spacer></v-spacer>
        
        <!-- 右侧：工具栏 -->
        <v-col cols="auto">
          <v-btn-toggle v-model="selectedCategory" density="comfortable" color="info" mandatory>
            <v-btn value="all" prepend-icon="mdi-view-grid">全部</v-btn>
            <v-btn value="原材料" prepend-icon="mdi-cube-outline">原材料</v-btn>
            <v-btn value="半成品" prepend-icon="mdi-package">半成品</v-btn>
            <v-btn value="成品" prepend-icon="mdi-package-variant-closed">成品</v-btn>
          </v-btn-toggle>
          
          <v-btn 
            prepend-icon="mdi-content-save"
            color="primary"
            class="ml-2"
            @click="saveData"
            :loading="isSaving"
            :disabled="!isDataChanged"
          >
            保存
          </v-btn>
          
          <v-btn 
            prepend-icon="mdi-refresh"
            variant="text"
            class="ml-2"
            @click="refreshData"
            :loading="isLoading"
          >
            刷新
          </v-btn>
        </v-col>
      </v-row>
    </div>
    
    <!-- 加载指示器 -->
    <loading-overlay :loading="isLoading" message="加载数据中..." />
    
    <!-- 数据表格容器 -->
    <div class="table-container">
      <unified-data-table
        :headers="tableHeaders"
        :items="filteredTableData"
        :loading="isLoading"
        class="mt-4 doh-table doh-data-table"
        hover
      >
        
        <template v-slot:item="{ item }">
          <tr>
            <td class="text-center font-weight-medium" style="min-width: 120px">
              <v-chip
                :color="getCategoryColor(item.category)"
                size="small"
                variant="tonal"
              >
                {{ item.category }}
              </v-chip>
            </td>
            <td class="text-center" style="min-width: 120px">{{ item.product_code }}</td>
            <td style="min-width: 200px">{{ item.product_name }}</td>
            <td style="min-width: 140px" class="editable-cell">
              <v-text-field
                v-model="item.doh_value"
                variant="outlined"
                density="compact"
                type="number"
                step="0.1"
                min="0"
                hide-details
                class="ma-1"
                suffix="天"
                @input="handleInput(item)"
              />
            </td>
            <td class="text-center" style="min-width: 160px">
              <div class="safety-range">
                <small class="text-grey-600">
                  {{ item.min_safety_days || 0 }} - {{ item.max_safety_days || 0 }} 天
                </small>
              </div>
            </td>
            <td class="text-center" style="min-width: 100px">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusText(item.status) }}
              </v-chip>
            </td>
            <td class="text-center" style="min-width: 120px">
              <v-btn
                icon="mdi-cog"
                size="small"
                variant="text"
                @click="openSafetyStockDialog(item)"
                title="设置安全库存"
              />
            </td>
          </tr>
        </template>
      </unified-data-table>
    </div>
    
    <!-- 数据变更提示 -->
    <v-snackbar
      v-model="showChangeAlert"
      :timeout="0"
      color="warning"
      location="bottom"
      multi-line
    >
      <v-icon icon="mdi-alert" class="mr-2" />
      数据已修改，请记得保存！
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="saveData"
          :loading="isSaving"
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

    <!-- 安全库存设置对话框 -->
    <v-dialog v-model="safetyStockDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon icon="mdi-cog" class="mr-2" />
          设置安全库存
        </v-card-title>

        <v-card-text>
          <div class="mb-4">
            <strong>产品：</strong>{{ selectedProduct?.product_name }}
            <br>
            <strong>编码：</strong>{{ selectedProduct?.product_code }}
          </div>

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="safetyStockForm.min_safety_days"
                label="最小安全库存"
                type="number"
                step="0.1"
                min="0"
                suffix="天"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="safetyStockForm.max_safety_days"
                label="最大安全库存"
                type="number"
                step="0.1"
                min="0"
                suffix="天"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>

          <v-alert
            type="info"
            variant="tonal"
            class="mt-4"
            density="compact"
          >
            <small>
              库存预警的参考标准。当前库存天数低于最小时显示为偏低，高于最大时显示为偏高，此更改只对本产品有效。
            </small>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="safetyStockDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="saveSafetyStock"
            :loading="isSavingSafety"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { get, put } from '@/utils/api'
import Message from '@/utils/notification'
import UnifiedPageTemplate from '@/components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '@/components/UnifiedDataTable.vue'
import UnifiedStatsCard from '@/components/UnifiedStatsCard.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

// 响应式数据
const isLoading = ref(false)
const isSaving = ref(false)
const isSavingSafety = ref(false)
const isDataChanged = ref(false)
const showChangeAlert = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedCategory = ref('all')

// 安全库存对话框相关
const safetyStockDialog = ref(false)
const selectedProduct = ref(null)
const safetyStockForm = ref({
  min_safety_days: 0,
  max_safety_days: 0
})

// 表格数据
const tableData = ref([])
const originalData = ref([])
const summaryData = ref([])

// 表格头部定义
const tableHeaders = [
  { title: '分类', key: 'category', width: '120px', sortable: false },
  { title: '产品编码', key: 'product_code', width: '120px', sortable: false },
  { title: '产品名称', key: 'product_name', width: '200px', sortable: false },
  { title: '当前库存天数', key: 'doh_value', width: '140px', sortable: false },
  { title: '安全库存范围', key: 'safety_range', width: '160px', sortable: false },
  { title: '状态', key: 'status', width: '100px', sortable: false },
  { title: '操作', key: 'actions', width: '120px', sortable: false }
]

// 计算属性：过滤后的表格数据
const filteredTableData = computed(() => {
  let data = tableData.value

  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    data = data.filter(item => item.category === selectedCategory.value)
  }

  // 按分类和排序顺序排序
  return data.sort((a, b) => {
    // 首先按分类排序
    const categoryOrder = { '原材料': 1, '半成品': 2, '成品': 3 }
    const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category]
    if (categoryDiff !== 0) return categoryDiff

    // 同一分类内按sort_order排序
    return (a.sort_order || 0) - (b.sort_order || 0)
  })
})

// 获取分类图标
const getCategoryIcon = (category) => {
  const iconMap = {
    '原材料': 'mdi-cube-outline',
    '半成品': 'mdi-package',
    '成品': 'mdi-package-variant-closed'
  }
  return iconMap[category] || 'mdi-package'
}

// 获取分类颜色
const getCategoryColor = (category) => {
  const colorMap = {
    '原材料': 'orange',
    '半成品': 'blue',
    '成品': 'green'
  }
  return colorMap[category] || 'grey'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'normal': 'success',
    'low': 'warning',
    'high': 'error'
  }
  return colorMap[status] || 'grey'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'low': '偏低',
    'high': '偏高'
  }
  return textMap[status] || '未知'
}

// 输入处理
const handleInput = (item) => {
  try {
    // 确保DOH值为数字
    if (item.doh_value !== null && item.doh_value !== undefined && item.doh_value !== '') {
      item.doh_value = parseFloat(item.doh_value) || 0
    }
    
    isDataChanged.value = true
    showChangeAlert.value = true
  } catch (error) {
    console.error('输入处理错误:', error)
  }
}

// 获取DOH数据 - 使用新的V2 API
const fetchData = async (date = selectedDate.value) => {
  isLoading.value = true
  try {
    const params = { target_date: date }
    const response = await get('/doh/v2/daily', { params })

    tableData.value = response.data || []
    originalData.value = JSON.parse(JSON.stringify(tableData.value))
    isDataChanged.value = false
    showChangeAlert.value = false

    // 获取汇总数据
    await fetchSummaryData(date)

  } catch (error) {
    console.error('获取DOH数据错误:', error)
    Message.error('获取DOH数据失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isLoading.value = false
  }
}

// 获取汇总数据
const fetchSummaryData = async (date = selectedDate.value) => {
  try {
    const params = { target_date: date }
    const response = await get('/doh/v2/summary', { params })
    summaryData.value = response.data || []
  } catch (error) {
    console.error('获取汇总数据错误:', error)
  }
}

// 保存数据 - 使用新的V2 API
const saveData = async () => {
  isSaving.value = true
  try {
    const dataToSend = {
      record_date: selectedDate.value,
      records: tableData.value.map(item => ({
        master_data_id: item.id,
        record_date: selectedDate.value,
        doh_value: item.doh_value || 0
      }))
    }

    const response = await put('/doh/v2/daily', dataToSend)

    if (response && response.data) {
      Message.success('DOH数据保存成功')
      originalData.value = JSON.parse(JSON.stringify(tableData.value))
      isDataChanged.value = false
      showChangeAlert.value = false

      // 刷新汇总数据
      await fetchSummaryData()
    } else {
      Message.error('保存失败: 服务器响应格式不正确')
    }

  } catch (error) {
    console.error('保存DOH数据错误:', error)
    Message.error('保存失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isSaving.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 加载数据
const loadData = () => {
  fetchData()
}

// 打开安全库存设置对话框
const openSafetyStockDialog = (item) => {
  selectedProduct.value = item
  safetyStockForm.value = {
    min_safety_days: item.min_safety_days || 0,
    max_safety_days: item.max_safety_days || 0
  }
  safetyStockDialog.value = true
}

// 保存安全库存设置 - 使用新的V2 API
const saveSafetyStock = async () => {
  if (!selectedProduct.value) return

  isSavingSafety.value = true
  try {
    const dataToSend = {
      min_safety_days: parseFloat(safetyStockForm.value.min_safety_days) || 0,
      max_safety_days: parseFloat(safetyStockForm.value.max_safety_days) || 0
    }

    const response = await put(`/doh/v2/master-data/${selectedProduct.value.id}/safety-stock`, dataToSend)

    if (response && response.data) {
      Message.success('安全库存设置保存成功')

      // 更新本地数据
      const productIndex = tableData.value.findIndex(p => p.id === selectedProduct.value.id)
      if (productIndex !== -1) {
        tableData.value[productIndex].min_safety_days = dataToSend.min_safety_days
        tableData.value[productIndex].max_safety_days = dataToSend.max_safety_days

        // 重新计算状态
        const dohValue = tableData.value[productIndex].doh_value || 0
        let status = "normal"
        if (dataToSend.min_safety_days > 0 && dohValue < dataToSend.min_safety_days) {
          status = "low"
        } else if (dataToSend.max_safety_days > 0 && dohValue > dataToSend.max_safety_days) {
          status = "high"
        }
        tableData.value[productIndex].status = status
      }

      safetyStockDialog.value = false
    } else {
      Message.error('保存失败: 服务器响应格式不正确')
    }

  } catch (error) {
    console.error('保存安全库存设置错误:', error)
    Message.error('保存失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isSavingSafety.value = false
  }
}

// 监听日期变化
watch(selectedDate, (newDate) => {
  if (newDate) {
    loadData()
  }
})

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 控制栏美化 */
.controls-bar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.controls-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

/* 汇总卡片区域 */
.summary-cards {
  margin-bottom: 24px;
}

/* 表格容器美化 */
.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

/* 禁用table-container的悬停效果，避免与表格行悬停冲突 */

/* 表格样式优化 */
.doh-table {
  background: transparent;
}

.doh-table :deep(.v-data-table__wrapper) {
  border-radius: 16px;
}

.doh-table :deep(thead tr th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  padding: 16px 12px;
}

.doh-table :deep(tbody tr) {
  transition: all 0.2s ease;
}

/* DOH表格专用悬停样式 - 避免闪烁 */
.doh-data-table :deep(.v-data-table__tr:hover) {
  background: rgba(59, 130, 246, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

.doh-data-table :deep(.v-data-table tbody tr:hover) {
  background: rgba(59, 130, 246, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

/* 禁用其他可能的悬停效果 */
.doh-data-table:hover {
  transform: none !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
}

.doh-table :deep(tbody tr td) {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

/* 可编辑单元格美化 */
.editable-cell {
  padding: 8px !important;
}

.editable-cell .v-text-field {
  transition: all 0.3s ease;
}

.editable-cell .v-text-field:hover {
  transform: scale(1.02);
}

.editable-cell .v-text-field :deep(.v-field) {
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.02);
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.editable-cell .v-text-field :deep(.v-field:hover) {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.05);
}

.editable-cell .v-text-field :deep(.v-field--focused) {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 分组头部样式 */
.group-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  font-weight: 600;
  padding: 16px !important;
  color: #475569;
}

.group-header td {
  border-bottom: 3px solid #e2e8f0 !important;
}

/* 安全库存范围美化 */
.safety-range {
  font-size: 0.875rem;
  line-height: 1.3;
  padding: 4px 8px;
  background: rgba(156, 163, 175, 0.1);
  border-radius: 6px;
  display: inline-block;
  color: #6b7280;
  font-weight: 500;
}

/* 状态芯片美化 */
:deep(.v-chip) {
  font-weight: 500;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
}

:deep(.v-chip:hover) {
  transform: scale(1.05);
}

/* 分类芯片特殊样式 */
:deep(.v-chip--variant-tonal) {
  border: 1px solid rgba(0, 0, 0, 0.2);
}

/* 按钮美化 */
:deep(.v-btn) {
  transition: all 0.3s ease;
  font-weight: 500;
}

:deep(.v-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.v-btn-toggle .v-btn) {
  border-radius: 8px;
  margin: 0 2px;
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
}

/* 响应式优化 */
@media (max-width: 960px) {
  .controls-bar {
    padding: 16px;
    border-radius: 12px;
  }

  .table-container {
    border-radius: 12px;
  }

  .doh-table :deep(thead tr th) {
    padding: 12px 8px;
    font-size: 0.875rem;
  }

  .doh-table :deep(tbody tr td) {
    padding: 8px;
  }
}

@media (max-width: 600px) {
  .controls-bar {
    padding: 12px;
    border-radius: 8px;
  }

  .editable-cell {
    padding: 4px !important;
  }

  .safety-range {
    font-size: 0.75rem;
    padding: 2px 6px;
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
