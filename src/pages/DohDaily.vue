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
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            v-model="selectedDate"
            type="date"
            variant="outlined"
            density="compact"
            label="选择日期"
            hide-details
            @update:model-value="loadData"
          />
        </v-col>
        
        <v-spacer />
        
        <!-- 右侧：工具栏 -->
        <v-col cols="auto">
          <v-btn-toggle
            v-model="selectedCategory"
            density="comfortable"
            color="info"
            mandatory
          >
            <v-btn
              value="all"
              prepend-icon="mdi-view-grid"
            >
              全部
            </v-btn>
            <v-btn
              value="原材料"
              prepend-icon="mdi-cube-outline"
            >
              原材料
            </v-btn>
            <v-btn
              value="半成品"
              prepend-icon="mdi-package"
            >
              半成品
            </v-btn>
            <v-btn
              value="成品"
              prepend-icon="mdi-package-variant-closed"
            >
              成品
            </v-btn>
          </v-btn-toggle>
          
          <v-btn 
            prepend-icon="mdi-content-save"
            color="primary"
            class="ml-2"
            :loading="isSaving"
            :disabled="!isDataChanged"
            @click="saveData"
          >
            保存
          </v-btn>
          
          <v-btn
            prepend-icon="mdi-refresh"
            variant="text"
            class="ml-2"
            :loading="isLoading"
            @click="refreshData"
          >
            刷新
          </v-btn>

          <!-- Excel导入按钮 -->
          <v-btn
            prepend-icon="mdi-file-excel"
            color="success"
            variant="outlined"
            class="ml-2"
            @click="openImportDialog"
          >
            Excel导入
          </v-btn>
        </v-col>
      </v-row>
    </div>
    
    <!-- 加载指示器 -->
    <loading-overlay
      :loading="isLoading"
      message="加载数据中..."
    />
    
    <!-- 数据表格容器 -->
    <div class="table-container">
      <unified-data-table
        :headers="tableHeaders"
        :items="filteredTableData"
        :loading="isLoading"
        class="mt-4 doh-table doh-data-table"
        hover
      >
        <template #item="{ item }">
          <tr>
            <td
              class="text-center font-weight-medium"
              style="min-width: 120px"
            >
              <v-chip
                :color="getCategoryColor(item.category)"
                size="small"
                variant="tonal"
              >
                {{ item.category }}
              </v-chip>
            </td>
            <td
              class="text-center"
              style="min-width: 120px"
            >
              {{ item.product_code }}
            </td>
            <td style="min-width: 200px">
              {{ item.product_name }}
            </td>
            <td
              style="min-width: 140px"
              class="editable-cell"
            >
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
            <td
              class="text-center"
              style="min-width: 160px"
            >
              <div class="safety-range">
                <small class="text-grey-600">
                  {{ item.min_safety_days || 0 }} - {{ item.max_safety_days || 0 }} 天
                </small>
              </div>
            </td>
            <td
              class="text-center"
              style="min-width: 100px"
            >
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusText(item.status) }}
              </v-chip>
            </td>
            <td
              class="text-center"
              style="min-width: 120px"
            >
              <v-btn
                icon="mdi-cog"
                size="small"
                variant="text"
                title="设置安全库存"
                @click="openSafetyStockDialog(item)"
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
      <v-icon
        icon="mdi-alert"
        class="mr-2"
      />
      数据已修改，请记得保存！
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          :loading="isSaving"
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

    <!-- 安全库存设置对话框 -->
    <v-dialog
      v-model="safetyStockDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h6">
          <v-icon
            icon="mdi-cog"
            class="mr-2"
          />
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
            :loading="isSavingSafety"
            @click="saveSafetyStock"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Excel导入对话框 -->
    <v-dialog
      v-model="importDialog"
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h6">
          <v-icon
            icon="mdi-file-excel"
            class="mr-2"
            color="success"
          />
          Excel数据导入
        </v-card-title>

        <v-card-text>
          <v-stepper
            v-model="importStep"
            alt-labels
          >
            <v-stepper-header>
              <v-stepper-item
                title="选择文件"
                :value="1"
                :complete="importStep > 1"
              />
              <v-divider />
              <v-stepper-item
                title="验证数据"
                :value="2"
                :complete="importStep > 2"
              />
              <v-divider />
              <v-stepper-item
                title="导入完成"
                :value="3"
              />
            </v-stepper-header>

            <v-stepper-window>
              <!-- 步骤1: 文件选择 -->
              <v-stepper-window-item :value="1">
                <div class="pa-4">
                  <!-- 导入日期选择 -->
                  <v-text-field
                    v-model="importDate"
                    type="date"
                    label="导入日期"
                    variant="outlined"
                    density="compact"
                    class="mb-4"
                    :rules="[v => !!v || '请选择导入日期']"
                  />

                  <!-- 文件上传区域 -->
                  <v-file-input
                    v-model="selectedFile"
                    label="选择Excel文件"
                    variant="outlined"
                    density="compact"
                    accept=".xlsx,.xls"
                    prepend-icon="mdi-file-excel"
                    show-size
                    class="mb-4"
                    :rules="fileRules"
                  />

                  <!-- 导入选项 -->
                  <v-checkbox
                    v-model="overwriteExisting"
                    label="覆盖已存在的数据"
                    density="compact"
                    hide-details
                    class="mb-4"
                  />

                  <!-- 模板下载 -->
                  <v-alert
                    type="info"
                    variant="tonal"
                    class="mb-4"
                  >
                    <div class="d-flex align-center">
                      <div class="flex-grow-1">
                        <strong>需要导入模板？</strong><br>
                        <small>下载标准的Excel模板，包含正确的表头格式</small>
                      </div>
                      <v-btn
                        color="info"
                        variant="outlined"
                        size="small"
                        :loading="isDownloadingTemplate"
                        @click="downloadTemplate"
                      >
                        下载模板
                      </v-btn>
                    </div>
                  </v-alert>

                  <!-- 支持的格式说明 -->
                  <v-expansion-panels
                    variant="accordion"
                    class="mb-4"
                  >
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <v-icon
                          icon="mdi-information"
                          class="mr-2"
                        />
                        支持的表头格式
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div class="text-body-2">
                          <p><strong>必需列：</strong></p>
                          <ul>
                            <li>库存天数/DOH/doh/天数 - DOH数值</li>
                            <li>产品编码/编码/product_code 或 产品名称/名称/product_name - 至少一个</li>
                          </ul>
                          <p class="mt-2">
                            <strong>可选列：</strong>
                          </p>
                          <ul>
                            <li>分类/类别/category - 产品分类</li>
                            <li>备注/说明/remark - 备注信息</li>
                          </ul>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
              </v-stepper-window-item>

              <!-- 步骤2: 数据验证 -->
              <v-stepper-window-item :value="2">
                <div class="pa-4">
                  <div
                    v-if="isValidating"
                    class="text-center py-8"
                  >
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                    />
                    <p class="mt-4">
                      正在验证数据...
                    </p>
                  </div>

                  <div v-else-if="validationResult">
                    <!-- 验证结果摘要 -->
                    <v-alert
                      :type="validationResult.is_valid ? 'success' : 'error'"
                      variant="tonal"
                      class="mb-4"
                    >
                      <div class="d-flex align-center">
                        <v-icon
                          :icon="validationResult.is_valid ? 'mdi-check-circle' : 'mdi-alert-circle'"
                          class="mr-2"
                        />
                        <div>
                          <strong>
                            {{ validationResult.is_valid ? '验证通过' : '验证失败' }}
                          </strong>
                          <br>
                          <small>
                            共 {{ validationResult.data?.length || 0 }} 行有效数据
                          </small>
                        </div>
                      </div>
                    </v-alert>

                    <!-- 错误信息 -->
                    <div
                      v-if="validationResult.errors?.length > 0"
                      class="mb-4"
                    >
                      <v-alert
                        type="error"
                        variant="tonal"
                        class="mb-2"
                      >
                        <strong>发现 {{ validationResult.errors.length }} 个错误：</strong>
                      </v-alert>
                      <v-list
                        density="compact"
                        class="bg-error-lighten-5 rounded"
                      >
                        <v-list-item
                          v-for="(error, index) in validationResult.errors"
                          :key="index"
                          class="text-error"
                        >
                          <v-list-item-title>
                            <v-icon
                              icon="mdi-alert-circle"
                              size="small"
                              class="mr-2"
                            />
                            {{ error }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </div>

                    <!-- 警告信息 -->
                    <div
                      v-if="validationResult.warnings?.length > 0"
                      class="mb-4"
                    >
                      <v-alert
                        type="warning"
                        variant="tonal"
                        class="mb-2"
                      >
                        <strong>{{ validationResult.warnings.length }} 个警告：</strong>
                      </v-alert>
                      <v-list
                        density="compact"
                        class="bg-warning-lighten-5 rounded"
                      >
                        <v-list-item
                          v-for="(warning, index) in validationResult.warnings"
                          :key="index"
                          class="text-warning"
                        >
                          <v-list-item-title>
                            <v-icon
                              icon="mdi-alert"
                              size="small"
                              class="mr-2"
                            />
                            {{ warning }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </div>

                    <!-- 数据预览 -->
                    <div v-if="validationResult.data?.length > 0">
                      <h4 class="mb-2">
                        数据预览（前5行）：
                      </h4>
                      <v-table
                        density="compact"
                        class="border rounded"
                      >
                        <thead>
                          <tr>
                            <th>行号</th>
                            <th>产品编码</th>
                            <th>产品名称</th>
                            <th>分类</th>
                            <th>库存天数</th>
                            <th>备注</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in validationResult.data.slice(0, 5)"
                            :key="row.row_number"
                          >
                            <td>{{ row.row_number }}</td>
                            <td>{{ row.product_code || '-' }}</td>
                            <td>{{ row.product_name || '-' }}</td>
                            <td>{{ row.category || '-' }}</td>
                            <td>{{ row.doh_value }}</td>
                            <td>{{ row.remark || '-' }}</td>
                          </tr>
                        </tbody>
                      </v-table>
                    </div>
                  </div>
                </div>
              </v-stepper-window-item>

              <!-- 步骤3: 导入结果 -->
              <v-stepper-window-item :value="3">
                <div class="pa-4">
                  <div
                    v-if="isImporting"
                    class="text-center py-8"
                  >
                    <v-progress-circular
                      indeterminate
                      color="primary"
                      size="64"
                    />
                    <p class="mt-4">
                      正在导入数据...
                    </p>
                  </div>

                  <div v-else-if="importResult">
                    <!-- 导入结果摘要 -->
                    <v-alert
                      :type="importResult.success ? 'success' : 'error'"
                      variant="tonal"
                      class="mb-4"
                    >
                      <div class="d-flex align-center">
                        <v-icon
                          :icon="importResult.success ? 'mdi-check-circle' : 'mdi-alert-circle'"
                          class="mr-2"
                        />
                        <div>
                          <strong>{{ importResult.message }}</strong>
                        </div>
                      </div>
                    </v-alert>

                    <!-- 详细统计 -->
                    <v-row class="mb-4">
                      <v-col
                        cols="6"
                        md="3"
                      >
                        <v-card
                          variant="tonal"
                          color="info"
                        >
                          <v-card-text class="text-center">
                            <div class="text-h4">
                              {{ importResult.total_rows }}
                            </div>
                            <div class="text-caption">
                              总行数
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col
                        cols="6"
                        md="3"
                      >
                        <v-card
                          variant="tonal"
                          color="success"
                        >
                          <v-card-text class="text-center">
                            <div class="text-h4">
                              {{ importResult.imported_rows }}
                            </div>
                            <div class="text-caption">
                              新增
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col
                        cols="6"
                        md="3"
                      >
                        <v-card
                          variant="tonal"
                          color="primary"
                        >
                          <v-card-text class="text-center">
                            <div class="text-h4">
                              {{ importResult.updated_rows }}
                            </div>
                            <div class="text-caption">
                              更新
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col
                        cols="6"
                        md="3"
                      >
                        <v-card
                          variant="tonal"
                          color="warning"
                        >
                          <v-card-text class="text-center">
                            <div class="text-h4">
                              {{ importResult.skipped_rows }}
                            </div>
                            <div class="text-caption">
                              跳过
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>

                    <!-- 错误详情 -->
                    <div v-if="importResult.errors?.length > 0">
                      <v-alert
                        type="error"
                        variant="tonal"
                        class="mb-2"
                      >
                        <strong>导入错误详情：</strong>
                      </v-alert>
                      <v-list
                        density="compact"
                        class="bg-error-lighten-5 rounded"
                      >
                        <v-list-item
                          v-for="(error, index) in importResult.errors"
                          :key="index"
                          class="text-error"
                        >
                          <v-list-item-title>
                            <v-icon
                              icon="mdi-alert-circle"
                              size="small"
                              class="mr-2"
                            />
                            {{ error }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </div>
                  </div>
                </div>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <!-- 步骤1的按钮 -->
          <template v-if="importStep === 1">
            <v-btn
              variant="text"
              @click="closeImportDialog"
            >
              取消
            </v-btn>
            <v-btn
              color="primary"
              :disabled="!hasValidFile || !importDate"
              :loading="isValidating"
              @click="validateFile"
            >
              下一步
            </v-btn>
          </template>

          <!-- 步骤2的按钮 -->
          <template v-if="importStep === 2">
            <v-btn
              variant="text"
              @click="importStep = 1"
            >
              上一步
            </v-btn>
            <v-btn
              color="primary"
              :disabled="!validationResult?.is_valid"
              :loading="isImporting"
              @click="importData"
            >
              开始导入
            </v-btn>
          </template>

          <!-- 步骤3的按钮 -->
          <template v-if="importStep === 3">
            <v-btn
              color="primary"
              @click="finishImport"
            >
              完成
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { get, put, post } from '@/utils/api'
import axios from 'axios'
import Message from '@/utils/notification'
import { useUserStore } from '@/stores/user'
import UnifiedPageTemplate from '@/components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '@/components/UnifiedDataTable.vue'
import UnifiedStatsCard from '@/components/UnifiedStatsCard.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

// 响应式数据
const userStore = useUserStore()
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

// Excel导入相关
const importDialog = ref(false)
const importStep = ref(1)
const selectedFile = ref(null)
const importDate = ref(new Date().toISOString().split('T')[0])
const overwriteExisting = ref(false)
const isValidating = ref(false)
const isImporting = ref(false)
const isDownloadingTemplate = ref(false)
const validationResult = ref(null)
const importResult = ref(null)

// 文件验证规则
const fileRules = [
  v => !!v || '请选择文件',
  v => !v || v.size < 10 * 1024 * 1024 || '文件大小不能超过10MB',
  v => !v || ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(v.type) || '只支持Excel文件格式'
]

// 检查是否有有效文件
const hasValidFile = computed(() => {
  if (!selectedFile.value) return false
  const file = Array.isArray(selectedFile.value) ? selectedFile.value[0] : selectedFile.value
  return file && file instanceof File
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

// Excel导入相关函数
// 打开导入对话框
const openImportDialog = () => {
  console.log('打开导入对话框，重置步骤为1')
  importDialog.value = true
  importStep.value = 1
  selectedFile.value = null
  importDate.value = selectedDate.value
  overwriteExisting.value = false
  validationResult.value = null
  importResult.value = null
  isValidating.value = false
  isImporting.value = false
  console.log('当前步骤:', importStep.value)
}

// 关闭导入对话框
const closeImportDialog = () => {
  importDialog.value = false
  importStep.value = 1
  selectedFile.value = null
  validationResult.value = null
  importResult.value = null
}

// 下载Excel模板
const downloadTemplate = async () => {
  isDownloadingTemplate.value = true
  try {
    const response = await get('/doh/v2/excel/template', {
      responseType: 'blob'
    })

    // 创建下载链接
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'DOH导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    Message.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    Message.error('下载模板失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isDownloadingTemplate.value = false
  }
}

// 验证Excel文件
const validateFile = async () => {
  console.log('开始验证文件，selectedFile:', selectedFile.value, 'importDate:', importDate.value)

  if (!selectedFile.value || !importDate.value) {
    Message.error('请选择文件和导入日期')
    return
  }

  // 确保selectedFile是File对象
  const file = Array.isArray(selectedFile.value) ? selectedFile.value[0] : selectedFile.value
  if (!file) {
    Message.error('请选择有效的文件')
    return
  }

  console.log('验证文件:', file.name, '大小:', file.size, '类型:', file.type)
  console.log('用户token:', userStore.token ? '已获取' : '未获取')

  if (!userStore.token) {
    Message.error('用户未登录，请刷新页面重新登录')
    return
  }

  isValidating.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    console.log('FormData创建完成，开始发送请求到 /doh/v2/excel/validate')

    // 直接使用axios发送文件，避免API工具函数的数据处理
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
    const response = await axios.post(`${API_BASE_URL}/doh/v2/excel/validate`, formData, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    validationResult.value = response.data

    if (validationResult.value.is_valid) {
      Message.success('文件验证通过')
      importStep.value = 2
    } else {
      Message.error('文件验证失败，请检查错误信息')
      importStep.value = 2 // 仍然进入下一步显示错误详情
    }

  } catch (error) {
    console.error('文件验证失败:', error)
    Message.error('文件验证失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isValidating.value = false
  }
}

// 导入数据
const importData = async () => {
  if (!validationResult.value?.is_valid) {
    Message.error('请先通过文件验证')
    return
  }

  // 确保selectedFile是File对象
  const file = Array.isArray(selectedFile.value) ? selectedFile.value[0] : selectedFile.value
  if (!file) {
    Message.error('请选择有效的文件')
    return
  }

  console.log('导入文件:', file.name, '日期:', importDate.value)
  console.log('用户token:', userStore.token ? '已获取' : '未获取')

  if (!userStore.token) {
    Message.error('用户未登录，请刷新页面重新登录')
    return
  }

  isImporting.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('record_date', importDate.value)
    formData.append('overwrite_existing', overwriteExisting.value)

    // 直接使用axios发送文件，避免API工具函数的数据处理
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
    const response = await axios.post(`${API_BASE_URL}/doh/v2/excel/import`, formData, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })

    importResult.value = response.data

    if (importResult.value.success) {
      Message.success('数据导入成功')
      importStep.value = 3

      // 如果导入的是当前选择的日期，刷新数据
      if (importDate.value === selectedDate.value) {
        await fetchData()
      }
    } else {
      Message.error('数据导入失败')
      importStep.value = 3 // 仍然进入结果页面显示详情
    }

  } catch (error) {
    console.error('数据导入失败:', error)
    Message.error('数据导入失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    isImporting.value = false
  }
}

// 完成导入
const finishImport = () => {
  closeImportDialog()

  // 如果导入成功，显示成功消息
  if (importResult.value?.success) {
    Message.success(`导入完成！成功处理 ${importResult.value.imported_rows + importResult.value.updated_rows} 条数据`)
  }
}

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
