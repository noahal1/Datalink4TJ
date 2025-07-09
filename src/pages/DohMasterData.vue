<template>
  <unified-page-template 
    title="DOH主数据维护"
    icon="mdi-database-cog"
    color="primary"
  >
    <!-- 顶部控制栏 -->
    <div class="controls-bar mb-4">
      <v-row class="align-center">
        <!-- 左侧：筛选器 -->
        <v-col cols="12" md="8">
          <v-row class="align-center">
            <v-col cols="auto">
              <v-btn-toggle v-model="selectedCategory" density="comfortable" color="primary" mandatory>
                <v-btn value="all" prepend-icon="mdi-view-grid">全部</v-btn>
                <v-btn value="原材料" prepend-icon="mdi-cube-outline">原材料</v-btn>
                <v-btn value="半成品" prepend-icon="mdi-package">半成品</v-btn>
                <v-btn value="成品" prepend-icon="mdi-package-variant-closed">成品</v-btn>
              </v-btn-toggle>
            </v-col>
            
            <v-col cols="auto">
              <v-text-field
                v-model="searchText"
                prepend-inner-icon="mdi-magnify"
                label="搜索产品"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                style="min-width: 200px"
              />
            </v-col>

            <v-col cols="auto">
              <v-select
                v-model="statusFilter"
                :items="statusFilterOptions"
                item-title="text"
                item-value="value"
                label="产品状态"
                variant="outlined"
                density="compact"
                hide-details
                style="min-width: 120px;"
                @update:model-value="fetchData"
              />
            </v-col>
          </v-row>
        </v-col>
        
        <!-- 右侧：操作按钮 -->
        <v-col cols="12" md="4" class="text-right">
          <v-btn 
            prepend-icon="mdi-plus"
            color="primary"
            @click="openCreateDialog"
          >
            新增产品
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

    <!-- 统计卡片 -->
    <div class="summary-cards mb-4" v-if="summaryStats">
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <unified-stats-card
            title="总产品数"
            :value="summaryStats.total.toString()"
            subtitle="全部产品"
            icon="mdi-package-variant"
            color="primary"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <unified-stats-card
            title="原材料"
            :value="summaryStats.raw_material.toString()"
            subtitle="原材料产品"
            icon="mdi-cube-outline" 
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <unified-stats-card
            title="半成品"
            :value="summaryStats.semi_finished.toString()"
            subtitle="半成品产品"
            icon="mdi-package"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <unified-stats-card
            title="成品"
            :value="summaryStats.finished_goods.toString()"
            subtitle="成品产品"
            icon="mdi-package-variant-closed"
          />
        </v-col>
      </v-row>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-container">
      <unified-data-table
        :headers="tableHeaders"
        :items="filteredTableData"
        :loading="isLoading"
        class="mt-4 master-data-table doh-master-table"
        hover
      >
        <template v-slot:item="{ item }">
          <tr>
            <td class="text-center font-weight-medium">
              <v-chip 
                :color="getCategoryColor(item.category)" 
                size="small" 
                variant="tonal"
              >
                {{ item.category }}
              </v-chip>
            </td>
            <td class="text-center">{{ item.product_code }}</td>
            <td>{{ item.product_name }}</td>
            <td class="text-center">{{ item.unit }}</td>
            <td class="text-center">
              <div class="safety-range">
                <small class="text-grey-600">
                  {{ item.min_safety_days || 0 }} - {{ item.max_safety_days || 0 }} 天
                </small>
              </div>
            </td>
            <td class="text-center">
              <v-chip 
                :color="item.is_active ? 'success' : 'error'" 
                size="small" 
                variant="tonal"
              >
                {{ item.is_active ? '启用' : '禁用' }}
              </v-chip>
            </td>
            <td class="text-center">{{ formatDate(item.updated_at) }}</td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="openEditDialog(item)"
                title="编辑产品"
              />
              <v-btn
                icon="mdi-cog"
                size="small"
                variant="text"
                @click="openSafetyStockDialog(item)"
                title="设置安全库存"
              />
              <v-btn
                :icon="item.is_active ? 'mdi-eye-off' : 'mdi-eye'"
                size="small"
                variant="text"
                :color="item.is_active ? 'warning' : 'success'"
                @click="toggleStatus(item)"
                :title="item.is_active ? '禁用产品' : '启用产品'"
              />
            </td>
          </tr>
        </template>
      </unified-data-table>
    </div>
    
    <!-- 产品编辑对话框 -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon :icon="isCreating ? 'mdi-plus' : 'mdi-pencil'" class="mr-2" />
          {{ isCreating ? '新增产品' : '编辑产品' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="editFormRef" v-model="editFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editForm.category"
                  :items="categoryOptions"
                  label="产品分类"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '请选择产品分类']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editForm.product_code"
                  label="分类"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '请输入产品分类']"
                  persistent-hint
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.product_name"
                  label="产品名称"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '请输入产品名称']"
                  persistent-hint
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editForm.unit"
                  label="单位"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '请输入单位']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editForm.sort_order"
                  label="排序顺序"
                  type="number"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="editDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="saveProduct"
            :loading="isSaving"
            :disabled="!editFormValid"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
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
            <strong>分类：</strong>{{ selectedProduct?.product_code }}
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
              设置后将作为库存预警的参考标准。当前库存天数低于最小值时显示为"偏低"，高于最大值时显示为"偏高"。
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
import { get, post, put } from '@/utils/api'
import Message from '@/utils/notification'
import { processFormData } from '@/utils/reactiveUtils'
import UnifiedPageTemplate from '@/components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '@/components/UnifiedDataTable.vue'
import UnifiedStatsCard from '@/components/UnifiedStatsCard.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

// 响应式数据
const isLoading = ref(false)
const isSaving = ref(false)
const isSavingSafety = ref(false)
const selectedCategory = ref('all')
const searchText = ref('')
const statusFilter = ref(null) // null表示显示所有，1表示只显示启用，0表示只显示禁用

// 状态过滤选项
const statusFilterOptions = [
  { text: '全部状态', value: null },
  { text: '仅启用', value: 1 },
  { text: '仅禁用', value: 0 }
]

// 表格数据
const tableData = ref([])
const summaryStats = ref(null)

// 对话框状态
const editDialog = ref(false)
const safetyStockDialog = ref(false)
const isCreating = ref(false)
const editFormValid = ref(false)

// 表单数据
const selectedProduct = ref(null)
const editForm = ref({
  category: '',
  product_code: '',
  product_name: '',
  unit: '天',
  sort_order: 0,
  is_active: 1
})

const safetyStockForm = ref({
  min_safety_days: 0,
  max_safety_days: 0
})

const tableHeaders = [
  { title: '分类', key: 'category', width: '100px', sortable: false },
  { title: '分类', key: 'product_code', width: '120px', sortable: false },
  { title: '产品名称', key: 'product_name', width: '200px', sortable: false },
  { title: '单位', key: 'unit', width: '80px', sortable: false },
  { title: '安全库存范围', key: 'safety_range', width: '140px', sortable: false },
  { title: '状态', key: 'status', width: '80px', sortable: false },
  { title: '更新时间', key: 'updated_at', width: '120px', sortable: false },
  { title: '操作', key: 'actions', width: '150px', sortable: false }
]

// 分类选项
const categoryOptions = [
  { title: '原材料', value: '原材料' },
  { title: '半成品', value: '半成品' },
  { title: '成品', value: '成品' }
]

// 计算属性：过滤后的表格数据
const filteredTableData = computed(() => {
  let data = tableData.value
  
  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    data = data.filter(item => item.category === selectedCategory.value)
  }
  
  // 按搜索文本筛选
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.product_code.toLowerCase().includes(search) ||
      item.product_name.toLowerCase().includes(search)
    )
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

// 获取分类颜色
const getCategoryColor = (category) => {
  const colorMap = {
    '原材料': 'orange',
    '半成品': 'blue',
    '成品': 'green'
  }
  return colorMap[category] || 'grey'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 获取主数据列表
const fetchData = async () => {
  isLoading.value = true
  try {
    // 构建查询参数
    const params = {}
    if (statusFilter.value !== null) {
      params.is_active = statusFilter.value
    }

    const response = await get('/doh/v2/master-data/', { params })

    tableData.value = response.data || []

    // 计算统计数据
    calculateSummaryStats()
    
  } catch (error) {
    console.error('获取主数据错误:', error)
    Message.error('获取主数据失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isLoading.value = false
  }
}

// 计算统计数据
const calculateSummaryStats = () => {
  const stats = {
    total: tableData.value.length,
    raw_material: 0,
    semi_finished: 0,
    finished_goods: 0
  }
  
  tableData.value.forEach(item => {
    switch (item.category) {
      case '原材料':
        stats.raw_material++
        break
      case '半成品':
        stats.semi_finished++
        break
      case '成品':
        stats.finished_goods++
        break
    }
  })
  
  summaryStats.value = stats
}

// 打开新增对话框
const openCreateDialog = () => {
  isCreating.value = true
  editForm.value = {
    category: '',
    product_code: '',
    product_name: '',
    unit: '天',
    sort_order: 0,
    is_active: 1
  }
  editDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (item) => {
  isCreating.value = false
  selectedProduct.value = item
  editForm.value = {
    category: item.category,
    product_code: item.product_code,
    product_name: item.product_name,
    unit: item.unit,
    sort_order: item.sort_order || 0,
    is_active: item.is_active
  }
  editDialog.value = true
}

// 保存产品
const saveProduct = async () => {
  isSaving.value = true
  try {
    let response

    // 使用工具函数处理表单数据，避免循环引用
    const formData = processFormData(editForm.value, {
      removeEmpty: false, // 保留空值，让后端验证
      trimStrings: true   // 去除字符串首尾空格
    })

    console.log('📤 发送的表单数据:', formData)

    if (isCreating.value) {
      // 新增产品
      response = await post('/doh/v2/master-data/', formData)
    } else {
      // 编辑产品
      response = await put(`/doh/v2/master-data/${selectedProduct.value.id}/`, formData)
    }

    if (response && response.data) {
      Message.success(isCreating.value ? '产品创建成功' : '产品更新成功')
      editDialog.value = false
      await fetchData() // 刷新数据
    } else {
      Message.error('保存失败: 服务器响应格式不正确')
    }
    
  } catch (error) {
    console.error('保存产品错误:', error)
    Message.error('保存失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isSaving.value = false
  }
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

// 保存安全库存设置
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
      safetyStockDialog.value = false
      await fetchData() // 刷新数据
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

// 切换产品状态
const toggleStatus = async (item) => {
  try {
    const newStatus = item.is_active ? 0 : 1
    const updateData = {
      ...item,
      is_active: newStatus
    }
    
    const response = await put(`/doh/v2/master-data/${item.id}/`, updateData)
    
    if (response && response.data) {
      Message.success(`产品已${newStatus ? '启用' : '禁用'}`)
      await fetchData() // 刷新数据
    } else {
      Message.error('状态更新失败')
    }
    
  } catch (error) {
    console.error('切换状态错误:', error)
    Message.error('状态更新失败: ' + (error.response?.data?.detail || error.message))
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 组件挂载时加载数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.controls-bar {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.summary-cards {
  margin-bottom: 20px;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.master-data-table {
  background: transparent;
}

.safety-range {
  font-size: 0.875rem;
  line-height: 1.2;
}

/* DOH主数据表格专用悬停样式 - 避免闪烁 */
.doh-master-table :deep(.v-data-table__tr:hover) {
  background: rgba(59, 130, 246, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

.doh-master-table :deep(.v-data-table tbody tr:hover) {
  background: rgba(59, 130, 246, 0.04) !important;
  transition: background-color 0.15s ease !important;
}

/* 禁用其他可能的悬停效果 */
.doh-master-table:hover {
  transform: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}
</style>
