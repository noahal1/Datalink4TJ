<template>
  <unified-page-template
    title="PR管理"
    icon="mdi-file-document-multiple"
    color="info"
  >
    <template #header-actions>
      <v-btn
        v-permission="'MAINT:WRITE'"
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
              v-model="filters.pr_type_id"
              :items="typeOptions"
              item-title="name"
              item-value="id"
              label="类型筛选"
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
              v-model="filters.priority_id"
              :items="priorityOptions"
              item-title="name"
              item-value="id"
              label="优先级筛选"
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
            <v-text-field
              v-model="filters.search"
              label="搜索"
              placeholder="PR编号、标题或描述"
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
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              variant="flat"
            >
              {{ item.status?.name }}
            </v-chip>
          </template>

          <!-- 类型 -->
          <template #item.pr_type="{ item }">
            <v-chip
              color="info"
              variant="outlined"
              size="small"
            >
              {{ item.pr_type?.name }}
            </v-chip>
          </template>

          <!-- 优先级 -->
          <template #item.priority="{ item }">
            <v-chip
              :color="getPriorityColor(item.priority)"
              size="small"
              variant="flat"
            >
              {{ item.priority?.name }}
            </v-chip>
          </template>

          <!-- 申请人 -->
          <template #item.requester="{ item }">
            {{ item.requester?.name }}
          </template>

          <!-- 申请日期 -->
          <template #item.requested_date="{ item }">
            {{ formatDate(item.requested_date) }}
          </template>

          <!-- 预估成本 -->
          <template #item.estimated_cost="{ item }">
            <span v-if="item.estimated_cost">
              ¥{{ item.estimated_cost.toLocaleString() }}
            </span>
            <span
              v-else
              class="text-medium-emphasis"
            >-</span>
          </template>

          <!-- 操作 -->
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              title="查看详情"
              @click="viewPrDetail(item)"
            />
            <v-btn
              v-if="canEdit(item)"
              icon="mdi-pencil"
              size="small"
              variant="text"
              title="编辑"
              @click="editPr(item)"
            />
            <v-btn
              v-if="canDelete(item)"
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              title="删除"
              @click="deletePr(item)"
            />
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
      :type-options="typeOptions"
      :priority-options="priorityOptions"
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
          确定要删除PR "{{ deletingPr?.title }}" 吗？此操作不可撤销。
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
import { useUserStore } from '../stores/user.js'
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
const typeOptions = ref([])
const priorityOptions = ref([])

// 编辑相关
const editedIndex = ref(-1)
const editedPr = ref({})
const selectedPr = ref(null)
const deletingPr = ref(null)

// 筛选和分页
const filters = reactive({
  status_id: null,
  pr_type_id: null,
  priority_id: null,
  search: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 用户store
const userStore = useUserStore()

// 表格列定义
const headers = [
  { title: 'PR编号', key: 'pr_number', sortable: false },
  { title: '标题', key: 'title', sortable: false },
  { title: '状态', key: 'status', sortable: false },
  { title: '类型', key: 'pr_type', sortable: false },
  { title: '优先级', key: 'priority', sortable: false },
  { title: '申请人', key: 'requester', sortable: false },
  { title: '申请日期', key: 'requested_date', sortable: false },
  { title: '预估成本', key: 'estimated_cost', sortable: false },
  { title: '操作', key: 'actions', sortable: false, width: 120 }
]

// 计算属性
const canEdit = computed(() => (item) => {
  return item.requester?.id === userStore.userId || userStore.isSuperAdmin
})

const canDelete = computed(() => (item) => {
  const canEditItem = item.requester?.id === userStore.userId || userStore.isSuperAdmin
  const isDeletableStatus = ['草稿', '待提交'].includes(item.status?.name)
  return canEditItem && isDeletableStatus
})

// 方法
const loadBasicData = async () => {
  try {
    // 加载状态选项
    const statusResponse = await api.get('/pr/status')
    statusOptions.value = statusResponse.data

    // 加载类型选项
    const typeResponse = await api.get('/pr/types')
    typeOptions.value = typeResponse.data

    // 加载优先级选项
    const priorityResponse = await api.get('/pr/priorities')
    priorityOptions.value = priorityResponse.data
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
  if (!status?.color) return 'grey'
  return status.color
}

// 获取优先级颜色
const getPriorityColor = (priority) => {
  if (!priority?.color) return 'grey'
  return priority.color
}

// PR操作方法
const openPrDialog = () => {
  editedIndex.value = -1
  editedPr.value = {
    title: '',
    description: '',
    pr_type_id: null,
    priority_id: null,
    required_date: null,
    estimated_cost: null,
    supplier: '',
    items: []
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
    
    if (editedIndex.value === -1) {
      // 创建新PR
      await api.post('/pr/', prData)
      Message.success('PR创建成功')
    } else {
      // 更新PR
      await api.put(`/pr/${editedPr.value.id}`, prData)
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

// 监听搜索输入
watch(() => filters.search, () => {
  // 延迟搜索
  clearTimeout(window.searchTimeout)
  window.searchTimeout = setTimeout(() => {
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

/* 统一芯片样式 */
.v-chip {
  border-radius: 6px !important;
}
</style>
