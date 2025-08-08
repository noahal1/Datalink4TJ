<template>
  <unified-page-template
    title="物料管理"
    icon="mdi-package-variant"
    color="success"
  >
    <template #header-actions>
      <v-btn
        v-permission="'MAINT:WRITE'"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openMaterialDialog"
      >
        新建物料
      </v-btn>
    </template>

    <!-- 筛选条件 -->
    <v-card
      class="mb-4"
      rounded="lg"
    >
      <v-card-title class="d-flex align-center">
        <v-icon
          color="success"
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
              v-model="filters.is_active"
              :items="[
                { title: '全部', value: null },
                { title: '启用', value: true },
                { title: '停用', value: false }
              ]"
              label="状态筛选"
              clearable
              variant="outlined"
              density="compact"
              @update:model-value="loadMaterialList"
            />
          </v-col>
          <v-col
            cols="12"
            md="3"
          >
            <v-text-field
              v-model="filters.category"
              label="物料分类"
              variant="outlined"
              density="compact"
              clearable
              @keyup.enter="loadMaterialList"
              @click:clear="loadMaterialList"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              v-model="filters.search"
              label="搜索"
              placeholder="物料名称、编码、规格或品牌"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @keyup.enter="loadMaterialList"
              @click:clear="loadMaterialList"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 物料列表 -->
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon
          color="success"
          class="mr-2"
        >
          mdi-format-list-bulleted
        </v-icon>
        <span>物料列表</span>
        <v-spacer />
        <v-chip
          v-if="materialList.length > 0"
          color="success"
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
          :items="materialList"
          :items-length="pagination.total"
          :loading="loading"
          item-value="id"
          density="compact"
          hover
          class="unified-table"
          @update:options="handleTableUpdate"
        >
          <!-- 物料编码 -->
          <template #item.material_code="{ item }">
            <v-chip
              color="primary"
              variant="outlined"
              size="small"
            >
              {{ item.material_code }}
            </v-chip>
          </template>

          <!-- 状态 -->
          <template #item.is_active="{ item }">
            <v-chip
              :color="item.is_active ? 'success' : 'error'"
              size="small"
              variant="flat"
            >
              {{ item.is_active ? '启用' : '停用' }}
            </v-chip>
          </template>

          <!-- 物料名称 -->
          <template #item.material_name="{ item }">
            <span class="font-weight-medium">{{ item.material_name }}</span>
          </template>

          <!-- 规格 -->
          <template #item.specification="{ item }">
            <span>{{ item.specification || '-' }}</span>
          </template>

          <!-- 品牌 -->
          <template #item.brand="{ item }">
            <span>{{ item.brand || '-' }}</span>
          </template>

          <!-- 分类 -->
          <template #item.category="{ item }">
            <v-chip
              v-if="item.category"
              color="info"
              variant="outlined"
              size="small"
            >
              {{ item.category }}
            </v-chip>
            <span v-else>-</span>
          </template>

          <!-- 创建时间 -->
          <template #item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>

          <!-- 操作 -->
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              title="查看详情"
              @click="viewMaterialDetail(item)"
            />
            <v-btn
              v-if="canEdit(item)"
              icon="mdi-pencil"
              size="small"
              variant="text"
              title="编辑"
              @click="editMaterial(item)"
            />
            <v-btn
              v-if="canToggleStatus(item)"
              :icon="item.is_active ? 'mdi-pause' : 'mdi-play'"
              size="small"
              variant="text"
              :color="item.is_active ? 'warning' : 'success'"
              :title="item.is_active ? '停用' : '启用'"
              @click="toggleMaterialStatus(item)"
            />
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- 物料创建/编辑对话框 -->
    <material-dialog
      v-model="materialDialog"
      v-model:material="editedMaterial"
      :is-new="editedIndex === -1"
      :loading="savingMaterial"
      @save="saveMaterial"
      @close="closeMaterialDialog"
    />

    <!-- 物料详情对话框 -->
    <material-detail-dialog
      v-model="detailDialog"
      :material="selectedMaterial"
      @close="closeDetailDialog"
    />

    <!-- 状态切换确认对话框 -->
    <v-dialog
      v-model="statusDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>确认操作</v-card-title>
        <v-card-text>
          确定要{{ statusChangeMaterial?.is_active ? '停用' : '启用' }}物料 "{{ statusChangeMaterial?.material_name }}" 吗？
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="statusDialog = false">
            取消
          </v-btn>
          <v-btn
            :color="statusChangeMaterial?.is_active ? 'warning' : 'success'"
            :loading="changingStatus"
            @click="confirmStatusChange"
          >
            {{ statusChangeMaterial?.is_active ? '停用' : '启用' }}
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
import MaterialDialog from '../components/materials/MaterialDialog.vue'
import MaterialDetailDialog from '../components/materials/MaterialDetailDialog.vue'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'

// 响应式数据
const loading = ref(false)
const savingMaterial = ref(false)
const changingStatus = ref(false)
const materialDialog = ref(false)
const detailDialog = ref(false)
const statusDialog = ref(false)

// 列表数据
const materialList = ref([])

// 编辑相关
const editedIndex = ref(-1)
const editedMaterial = ref({})
const selectedMaterial = ref(null)
const statusChangeMaterial = ref(null)

// 筛选和分页
const filters = reactive({
  is_active: null,
  category: '',
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
  { title: '物料编码', key: 'material_code', sortable: false },
  { title: '物料名称', key: 'material_name', sortable: false },
  { title: '规格', key: 'specification', sortable: false },
  { title: '品牌', key: 'brand', sortable: false },
  { title: '单位', key: 'unit', sortable: false },
  { title: '分类', key: 'category', sortable: false },
  { title: '状态', key: 'is_active', sortable: false },
  { title: '创建时间', key: 'created_at', sortable: false },
  { title: '操作', key: 'actions', sortable: false, width: 150 }
]

// 计算属性
const canEdit = computed(() => (item) => {
  return userStore.hasPermission('MAINT', 'WRITE')
})

const canToggleStatus = computed(() => (item) => {
  return userStore.hasPermission('MAINT', 'WRITE')
})

// 方法
const loadMaterialList = async () => {
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

    const response = await api.get('/materials/', { params })
    const data = response.data

    materialList.value = data.items
    pagination.total = data.total
  } catch (error) {
    console.error('加载物料列表失败:', error)
    Message.error('加载物料列表失败')
  } finally {
    loading.value = false
  }
}

const handleTableUpdate = (options) => {
  pagination.page = options.page
  pagination.page_size = options.itemsPerPage
  loadMaterialList()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 物料操作方法
const openMaterialDialog = () => {
  editedIndex.value = -1
  editedMaterial.value = {
    material_code: '',
    material_name: '',
    specification: '',
    brand: '',
    unit: '',
    category: '',
    description: '',
    is_active: true
  }
  materialDialog.value = true
}

const editMaterial = (item) => {
  editedIndex.value = materialList.value.indexOf(item)
  editedMaterial.value = { ...item }
  materialDialog.value = true
}

const closeMaterialDialog = () => {
  materialDialog.value = false
  editedMaterial.value = {}
  editedIndex.value = -1
}

const saveMaterial = async (materialData) => {
  try {
    savingMaterial.value = true
    
    if (editedIndex.value === -1) {
      // 创建新物料
      await api.post('/materials/', materialData)
      Message.success('物料创建成功')
    } else {
      // 更新物料
      await api.put(`/materials/${editedMaterial.value.id}`, materialData)
      Message.success('物料更新成功')
    }
    
    closeMaterialDialog()
    loadMaterialList()
  } catch (error) {
    console.error('保存物料失败:', error)
    Message.error('保存物料失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    savingMaterial.value = false
  }
}

const viewMaterialDetail = async (item) => {
  try {
    const response = await api.get(`/materials/${item.id}`)
    selectedMaterial.value = response.data
    detailDialog.value = true
  } catch (error) {
    console.error('获取物料详情失败:', error)
    Message.error('获取物料详情失败')
  }
}

const closeDetailDialog = () => {
  detailDialog.value = false
  selectedMaterial.value = null
}

const toggleMaterialStatus = (item) => {
  statusChangeMaterial.value = item
  statusDialog.value = true
}

const confirmStatusChange = async () => {
  try {
    changingStatus.value = true
    const newStatus = !statusChangeMaterial.value.is_active
    await api.put(`/materials/${statusChangeMaterial.value.id}`, {
      is_active: newStatus
    })
    Message.success(`物料已${newStatus ? '启用' : '停用'}`)
    statusDialog.value = false
    statusChangeMaterial.value = null
    loadMaterialList()
  } catch (error) {
    console.error('更改物料状态失败:', error)
    Message.error('更改物料状态失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    changingStatus.value = false
  }
}

// 监听搜索输入
watch(() => filters.search, () => {
  // 延迟搜索
  clearTimeout(window.searchTimeout)
  window.searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadMaterialList()
  }, 500)
})

watch(() => filters.category, () => {
  pagination.page = 1
  loadMaterialList()
})

// 组件挂载时加载数据
onMounted(() => {
  loadMaterialList()
})
</script>

<style scoped>
.unified-table {
  border-radius: 8px;
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