<template>
  <unified-page-template
    title="PR管理"
    icon="mdi-file-document-multiple"
    color="info"
  >
    <template #header-actions>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openPrDialog"
      >
        新建PR
      </v-btn>
    </template>

    <!-- 筛选条件 -->
    <v-card
      class="mb-4"
      rounded="lg"
    >
      <v-card-title class="d-flex align-center">
        <v-icon
          color="info"
          class="mr-2"
        >
          mdi-filter-variant
        </v-icon>
        <span>筛选条件</span>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            cols="12"
            md="3"
          >
            <v-select
              v-model="filters.status_id"
              :items="statusOptions"
              item-title="name"
              item-value="id"
              label="状态筛选"
              clearable
              variant="outlined"
              density="compact"
              @update:model-value="loadPrList"
            />
          </v-col>
          <v-col
            cols="12"
            md="3"
          >
            <v-select
              v-model="filters.requester_id"
              :items="requesterOptions"
              item-title="name"
              item-value="id"
              label="申请人筛选"
              clearable
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-account"
              @update:model-value="loadPrList"
            />
          </v-col>
          <v-col
            cols="12"
            md="3"
          >
            <v-text-field
              v-model="filters.search"
              label="搜索"
              placeholder="请购单号、物品名称或编码"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @keyup.enter="loadPrList"
              @click:clear="loadPrList"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- PR列表 -->
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon
          color="info"
          class="mr-2"
        >
          mdi-format-list-bulleted
        </v-icon>
        <span>PR列表</span>
        <v-spacer />
        <v-chip
          v-if="prList.length > 0"
          color="info"
          variant="outlined"
          size="small"
        >
          共 {{ pagination.total }} 条记录
        </v-chip>
      </v-card-title>
      <v-card-text>
        <v-data-table-server
          v-model:items-per-page="pagination.page_size"
          v-model:page="pagination.page"
          :headers="headers"
          :items="prList"
          :items-length="pagination.total"
          :loading="loading"
          item-value="id"
          density="compact"
          hover
          class="unified-table"
          @update:options="handleTableUpdate"
        >
          <!-- PR编号 -->
          <template #item.pr_number="{ item }">
            <v-chip
              color="primary"
              variant="outlined"
              size="small"
              class="cursor-pointer"
              @click="viewPrDetail(item)"
            >
              {{ item.pr_number }}
            </v-chip>
          </template>

          <!-- 状态 -->
          <template #item.status="{ item }">
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-chip
                  v-bind="props"
                  :color="getStatusColor(item.status)"
                  size="small"
                  variant="flat"
                  class="cursor-pointer"
                  :prepend-icon="getStatusIcon(item.status)"
                >
                  {{ item.status?.name }}
                  <v-icon size="small" class="ml-1">mdi-chevron-down</v-icon>
                </v-chip>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="status in statusOptions"
                  :key="status.id"
                  :disabled="status.id === item.status_id"
                  @click="changeStatus(item, status)"
                >
                  <template #prepend>
                    <v-icon :color="getStatusColor(status)" size="small">
                      {{ getStatusIcon(status) }}
                    </v-icon>
                  </template>
                  <v-list-item-title>{{ status.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <!-- 物品名称 -->
          <template #item.item_name="{ item }">
            <span class="font-weight-medium">{{ item.item_name }}</span>
          </template>
          <!-- 型号 -->
          <template #item.specification="{ item }">
            <span class="font-weight-medium">{{ item.specification }}</span>
          </template>
          <!-- 品牌 -->
          <template #item.brand="{ item }">
            <span class="font-weight-medium">{{ item.brand }}</span>
          </template>
          <!-- 数量 -->
          <template #item.quantity="{ item }">
            <span>{{ item.quantity }} {{ item.unit || '' }}</span>
          </template>

          <!-- 申请人 -->
          <template #item.requester="{ item }">
            {{ item.requester?.name }}
          </template>

          <!-- 申请日期 -->
          <template #item.requested_date="{ item }">
            {{ formatDate(item.requested_date) }}
          </template>

          <!-- 操作 -->
          <template #item.actions="{ item }">
            <v-btn-group variant="text" density="compact">
              <v-btn
                icon="mdi-eye"
                size="small"
                color="info"
                title="查看详情"
                @click="viewPrDetail(item)"
              />
              <v-btn
                v-if="canEdit(item)"
                icon="mdi-pencil"
                size="small"
                color="primary"
                title="编辑"
                @click="editPr(item)"
              />
              <v-btn
                v-if="canQuickApprove(item)"
                icon="mdi-check-circle"
                size="small"
                color="success"
                title="标记已批准"
                @click="quickApprove(item)"
              />
              <v-btn
                v-if="canMarkPurchased(item)"
                icon="mdi-cart"
                size="small"
                color="purple"
                title="标记已采购"
                @click="markPurchased(item)"
              />
              <v-btn
                v-if="canMarkDelivered(item)"
                icon="mdi-truck-delivery"
                size="small"
                color="orange"
                title="标记已到货"
                @click="markDelivered(item)"
              />
              <v-btn
                v-if="canDelete(item)"
                icon="mdi-delete"
                size="small"
                color="error"
                title="删除"
                @click="deletePr(item)"
              />
            </v-btn-group>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- PR创建/编辑对话框 -->
    <pr-dialog
      v-model="prDialog"
      v-model:pr="editedPr"
      :is-new="editedIndex === -1"
      :loading="savingPr"
      :status-options="statusOptions"
      @save="savePr"
      @close="closePrDialog"
    />

    <!-- PR详情对话框 -->
    <pr-detail-dialog
      v-model="detailDialog"
      :pr="selectedPr"
      :status-options="statusOptions"
      @status-change="handleStatusChange"
      @close="closeDetailDialog"
    />

    <!-- 删除确认对话框 -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除PR "{{ deletingPr?.material_name }}" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">
            取消
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import Message from '../utils/notification'
import api from '../utils/api'
import PrDialog from '../components/pr/PrDialog.vue'
import PrDetailDialog from '../components/pr/PrDetailDialog.vue'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'

// 响应式数据
const loading = ref(false)
const savingPr = ref(false)
const deleting = ref(false)

const prDialog = ref(false)
const detailDialog = ref(false)
const deleteDialog = ref(false)

// 列表数据
const prList = ref([])
const statusOptions = ref([])
const requesterOptions = ref([])

// 编辑相关
const editedIndex = ref(-1)
const editedPr = ref({})
const selectedPr = ref(null)
const deletingPr = ref(null)

// 筛选和分页
const filters = reactive({
  status_id: null,
  requester_id: null,
  // pr_type_id: null,  // 已删除
  search: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})



// 表格列定义
const headers = [
  { title: '物品名称', key: 'item_name', sortable: false },
  { title: '型号', key: 'specification', sortable: false },
  { title: '品牌', key: 'brand', sortable: false},
  { title: '数量', key: 'quantity', sortable: false },
  { title: '申请人', key: 'requester', sortable: false },
  { title: '申请日期', key: 'requested_date', sortable: false },
  { title: '状态', key: 'status', sortable: false },
  { title: '操作', key: 'actions', sortable: false, width: 120 }
]

// 计算属性
const canEdit = computed(() => () => {
  // 编辑权限：所有用户在所有状态下都可以编辑
  return true
})

const canDelete = computed(() => (item) => {
  // 只有在"待提交"状态下才能删除
  const isDeletableStatus = ['待提交'].includes(item.status?.name)
  return isDeletableStatus
})

// 方法
const loadBasicData = async () => {
  try {
    // 加载状态选项
    const statusResponse = await api.get('/pr/status')
    statusOptions.value = statusResponse.data
    console.log('状态选项加载成功:', statusOptions.value)

    // 加载申请人选项
    const requesterResponse = await api.get('/pr/requesters')
    requesterOptions.value = requesterResponse.data
    console.log('申请人选项加载成功:', requesterOptions.value)

    // 加载类型选项 - 已删除
    // const typeResponse = await api.get('/pr/types')
    // typeOptions.value = typeResponse.data

  } catch (error) {
    console.error('加载基础数据失败:', error)
    Message.error('加载基础数据失败')
  }
}

const loadPrList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...filters
    }

    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === '') {
        delete params[key]
      }
    })

    const response = await api.get('/pr/', { params })
    const data = response.data

    prList.value = data.items
    pagination.total = data.total
  } catch (error) {
    console.error('加载PR列表失败:', error)
    Message.error('加载PR列表失败')
  } finally {
    loading.value = false
  }
}

const handleTableUpdate = (options) => {
  pagination.page = options.page
  pagination.page_size = options.itemsPerPage
  loadPrList()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取状态颜色
const getStatusColor = (status) => {
  if (!status) return 'grey'

  // 如果有颜色值，直接使用（支持十六进制颜色和 Vuetify 颜色名）
  if (status.color) {
    // 如果是十六进制颜色，转换为 Vuetify 颜色名
    if (status.color.startsWith('#')) {
      const colorMap = {
        '#9E9E9E': 'grey',
        '#FF9800': 'orange',
        '#2196F3': 'blue',
        '#4CAF50': 'green',
        '#9C27B0': 'purple',
        '#00BCD4': 'cyan',
        '#8BC34A': 'light-green',
        '#F44336': 'red',
        '#E91E63': 'pink'
      }
      return colorMap[status.color] || 'grey'
    }
    return status.color
  }

  // 如果没有颜色，根据状态名称提供默认颜色
  const statusName = status.name?.toLowerCase()
  switch (statusName) {
    case '待提交':
      return 'orange'
    case '审批中':
      return 'blue'
    case '已批准':
      return 'green'
    case '采购中':
      return 'purple'
    case '已到货':
      return 'cyan'
    case '已拒绝':
      return 'red'
    default:
      return 'grey'
  }
}


// PR操作方法
const openPrDialog = () => {
  editedIndex.value = -1
  editedPr.value = {
    material_name: '',
    description: '',
    priority_id: 1,
    required_date: null,
    estimated_cost: null,
    supplier: '',
    material_code: '',
    specification: '',
    quantity: 1,
    brand: '',
    remarks: ''
  }
  prDialog.value = true
}

const editPr = (item) => {
  editedIndex.value = prList.value.indexOf(item)
  editedPr.value = { ...item }
  prDialog.value = true
}

const closePrDialog = () => {
  prDialog.value = false
  editedPr.value = {}
  editedIndex.value = -1
}

const savePr = async (prData) => {
  try {
    savingPr.value = true
    
    // 清理数据，确保正确的JSON格式
    const cleanData = {
      material_name: prData.material_name || '',
      description: prData.description || null,
      required_date: prData.required_date || null,
      approved_date: prData.approved_date || null,
      delivery_date: prData.delivery_date || null,
      material_code: prData.material_code || null,
      specification: prData.specification || null,
      quantity: parseFloat(prData.quantity) || 0,
      brand: prData.brand || null,
      remarks: prData.remarks || null
    }
    
    // 调试：打印发送的数据
    console.log('发送的PR数据:', JSON.stringify(cleanData, null, 2))
    
    if (editedIndex.value === -1) {
      // 创建新PR
      await api.post('/pr/', cleanData)
      Message.success('PR创建成功')
    } else {
      // 更新PR
      await api.put(`/pr/${editedPr.value.id}`, cleanData)
      Message.success('PR更新成功')
    }
    
    closePrDialog()
    loadPrList()
  } catch (error) {
    console.error('保存PR失败:', error)
    Message.error('保存PR失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    savingPr.value = false
  }
}

const viewPrDetail = async (item) => {
  try {
    const response = await api.get(`/pr/${item.id}`)
    selectedPr.value = response.data
    detailDialog.value = true
  } catch (error) {
    console.error('获取PR详情失败:', error)
    Message.error('获取PR详情失败')
  }
}

const closeDetailDialog = () => {
  detailDialog.value = false
  selectedPr.value = null
}

const handleStatusChange = async (statusData) => {
  try {
    await api.put(`/pr/${selectedPr.value.id}/status`, statusData)
    Message.success('状态更新成功')
    closeDetailDialog()
    loadPrList()
  } catch (error) {
    console.error('更新状态失败:', error)
    Message.error('更新状态失败: ' + (error.response?.data?.detail || error.message))
  }
}

const deletePr = (item) => {
  deletingPr.value = item
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    deleting.value = true
    await api.delete(`/pr/${deletingPr.value.id}`)
    Message.success('PR删除成功')
    deleteDialog.value = false
    deletingPr.value = null
    loadPrList()
  } catch (error) {
    console.error('删除PR失败:', error)
    Message.error('删除PR失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    deleting.value = false
  }
}

// 状态相关辅助函数
const getStatusIcon = (status) => {
  if (!status) return 'mdi-help-circle'
  const statusName = status.name?.toLowerCase()
  switch (statusName) {
    case '待提交':
      return 'mdi-file-document-outline'
    case '待审批':
    case '审批中':
      return 'mdi-clock-outline'
    case '已批准':
    case '已审批':
      return 'mdi-check-circle'
    case '已下单':
    case '采购中':
      return 'mdi-cart'
    case '已到货':
      return 'mdi-truck-delivery'
    case '已拒绝':
      return 'mdi-close-circle'
    default:
      return 'mdi-help-circle'
  }
}

const canQuickApprove = (item) => {
  return item.status?.name === '待审批' || item.status?.name === '审批中'
}

const canMarkPurchased = (item) => {
  return item.status?.name === '已批准' || item.status?.name === '已审批'
}

const canMarkDelivered = (item) => {
  return item.status?.name === '已下单' || item.status?.name === '采购中'
}

// 快速状态变更操作
const changeStatus = async (item, newStatus) => {
  try {
    console.log('正在更新状态:', { itemId: item.id, newStatusId: newStatus.id, newStatusName: newStatus.name })
    await api.put(`/pr/${item.id}/status`, { status_id: newStatus.id })
    Message.success(`状态已更新为：${newStatus.name}`)
    loadPrList()
  } catch (error) {
    console.error('状态更新失败:', error)
    Message.error('状态更新失败: ' + (error.response?.data?.detail || error.message))
  }
}

const quickApprove = async (item) => {
  const approvedStatus = statusOptions.value.find(s => s.name === '已批准' || s.name === '已审批')
  if (approvedStatus) {
    await changeStatus(item, approvedStatus)
  }
}

const markPurchased = async (item) => {
  const purchasedStatus = statusOptions.value.find(s => s.name === '采购中' || s.name === '已下单')
  if (purchasedStatus) {
    await changeStatus(item, purchasedStatus)
  }
}

const markDelivered = async (item) => {
  const deliveredStatus = statusOptions.value.find(s => s.name === '已到货')
  if (deliveredStatus) {
    await changeStatus(item, deliveredStatus)
  }
}

// 搜索防抖
let searchTimeout = null

// 监听搜索输入
watch(() => filters.search, () => {
  // 延迟搜索
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadPrList()
  }, 500)
})

// 组件挂载时加载数据
onMounted(() => {
  loadBasicData()
  loadPrList()
})
</script>

<style scoped>
.unified-table {
  border-radius: 8px;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.8;
}

/* 统一卡片样式 */
.v-card {
  border-radius: 12px !important;
}

/* 统一按钮样式 */
.v-btn {
  border-radius: 8px !important;
}

/* 状态芯片悬停效果 */
.v-chip.cursor-pointer {
  transition: all 0.2s ease;
}

.v-chip.cursor-pointer:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* 操作按钮组样式 */
.v-btn-group .v-btn {
  margin: 0 1px;
}

.v-btn-group .v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 状态菜单样式 */
.v-menu > .v-overlay__content > .v-list {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 统一芯片样式 */
.v-chip {
  border-radius: 6px !important;
}
</style>
