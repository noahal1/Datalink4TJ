<template>
  <div>
    <v-row>
      <v-col cols="12">
        <unified-data-table
          title="部门管理"
          icon="mdi-domain"
          :headers="headers"
          :items="departments"
          :loading="loading"
          :search="search"
          :items-per-page="10"
        >
          <template #title>
            <span>部门管理</span>
            <v-spacer />
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="搜索"
              single-line
              hide-details
              density="compact"
              class="ml-4"
              style="max-width: 300px"
            />
          </template>
          
          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              class="mr-1"
              @click="editDepartment(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              编辑
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
              删除
            </v-btn>
          </template>
          
          <template #actions>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openAddDialog"
            >
              添加部门
            </v-btn>
            <v-btn
              class="ml-2"
              color="secondary"
              prepend-icon="mdi-refresh"
              @click="fetchDepartments"
            >
              刷新
            </v-btn>
            <v-btn
              class="ml-2"
              color="info"
              prepend-icon="mdi-filter"
              @click="filterDrawer = true"
            >
              筛选
            </v-btn>
          </template>
        </unified-data-table>
      </v-col>
    </v-row>
    
    <!-- 部门对话框 -->
    <v-dialog
      v-model="dialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ formTitle }}
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form
            ref="formRef"
            :show-default-actions="false"
          >
            <v-text-field
              v-model="editedItem.id"
              label="部门代码"
              placeholder="请输入部门代码"
              variant="outlined"
              density="comfortable"
              :disabled="editedIndex !== -1"
              :rules="[rules.required]"
            />
            <v-text-field
              v-model="editedItem.name"
              label="部门名称"
              placeholder="请输入部门名称"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
            <v-textarea
              v-model="editedItem.description"
              label="部门描述"
              placeholder="请输入部门描述"
              variant="outlined"
              density="comfortable"
              rows="3"
            />
          </unified-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="closeDialog"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveDepartment"
          >
            确定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认对话框 -->
    <v-dialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h5 bg-error text-white">
          确认删除
        </v-card-title>
        <v-card-text class="pt-4">
          <p>您确定要删除部门 <strong>{{ editedItem.name }}</strong> 吗？此操作不可撤销。</p>
          <p class="text-caption text-grey">
            部门ID: {{ editedItem.id }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="deleteDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteDepartment"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 过滤器抽屉 -->
    <v-navigation-drawer
      v-model="filterDrawer"
      location="right"
      temporary
      width="300"
    >
      <v-card class="h-100">
        <v-card-title class="bg-primary text-white">
          <v-icon
            class="mr-2"
            color="white"
          >
            mdi-filter
          </v-icon>
          筛选条件
          <v-spacer />
          <v-btn
            icon
            variant="text"
            color="white"
            size="small"
            @click="filterDrawer = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <unified-form>
            <v-text-field
              v-model="filters.id"
              label="部门代码"
              variant="outlined"
              density="comfortable"
              clearable
            />
            
            <v-text-field
              v-model="filters.name"
              label="部门名称"
              variant="outlined"
              density="comfortable"
              clearable
            />
            
            <v-text-field
              v-model="filters.description"
              label="部门描述"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </unified-form>
        </v-card-text>
        
        <v-card-actions class="py-3">
          <v-spacer />
          <v-btn
            variant="text"
            color="grey"
            @click="clearFilters"
          >
            清除筛选
          </v-btn>
          <v-btn
            color="primary"
            @click="applyFilters"
          >
            应用筛选
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import UnifiedDataTable from '../../components/UnifiedDataTable.vue'
import UnifiedForm from '../../components/UnifiedForm.vue'
import { useNotification } from '../../composables/useNotification'
import api from '../../utils/api'

const { showSuccess, showError } = useNotification()

// 表格列定义
const headers = [
  { title: '部门代码', key: 'id', align: 'start', sortable: true },
  { title: '部门名称', key: 'name', align: 'start', sortable: true },
  { title: '部门描述', key: 'description', align: 'start', sortable: true },
  { title: '操作', key: 'actions', align: 'center', sortable: false }
]

// 部门数据
const departments = ref([])
const filteredDepartments = ref([])
const allDepartments = ref([])

// 状态变量
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filterDrawer = ref(false)

// 过滤器
const filters = ref({
  id: '',
  name: '',
  description: ''
})

// 编辑相关变量
const dialog = ref(false)
const deleteDialog = ref(false)
const editedIndex = ref(-1)
const editedItem = ref({
  id: '',
  name: '',
  description: '',
})
const defaultItem = {
  id: '',
  name: '',
  description: '',
}

// 表单验证规则
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项'
};

// 表单标题
const formTitle = computed(() => {
  return editedIndex.value === -1 ? '添加部门' : '编辑部门'
})

// 页面加载时获取数据
onMounted(() => {
  fetchDepartments()
})

// 获取部门数据
const fetchDepartments = async () => {
  try {
    loading.value = true
    // 使用api工具发送请求
    const response = await api.get('/departments/')
    console.log('部门数据响应:', response)
    
    // 检查响应数据结构
    if (response && response.data && Array.isArray(response.data)) {
      departments.value = response.data
      allDepartments.value = [...response.data]
    } else if (response && Array.isArray(response)) {
      departments.value = response
      allDepartments.value = [...response]
    } else {
      console.error('部门数据格式不正确:', response)
      departments.value = []
      allDepartments.value = []
      showError('部门数据格式不正确')
    }
  } catch (error) {
    console.error('获取部门数据失败:', error)
    showError('获取部门数据失败')
    departments.value = [] // 确保始终是数组
    allDepartments.value = []
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
const openAddDialog = () => {
  editedIndex.value = -1
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

// 编辑部门
const editDepartment = (item) => {
  editedIndex.value = departments.value.findIndex(d => d.id === item.id)
  editedItem.value = { ...item }
  dialog.value = true
}

// 关闭对话框
const closeDialog = () => {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
  }, 300)
}

// 保存部门
const saveDepartment = async () => {
  // 表单验证
  if (!editedItem.value.id || !editedItem.value.name) {
    showError('请填写必填字段')
    return
  }
  
  try {
    saving.value = true
    
    if (editedIndex.value === -1) {
      // 创建新部门
      await api.post('/departments/', editedItem.value)
      showSuccess('部门创建成功')
    } else {
      // 更新部门
      await api.put(`/departments/${editedItem.value.id}`, editedItem.value)
      showSuccess('部门更新成功')
    }
    
    closeDialog()
    fetchDepartments() // 重新加载部门列表
  } catch (error) {
    console.error('保存部门失败:', error)
    showError('保存部门失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    saving.value = false
  }
}

// 确认删除
const confirmDelete = (item) => {
  editedItem.value = { ...item }
  deleteDialog.value = true
}

// 删除部门
const deleteDepartment = async () => {
  try {
    deleting.value = true
    
    await api.delete(`/departments/${editedItem.value.id}`)
    showSuccess('部门删除成功')
    
    deleteDialog.value = false
    fetchDepartments() // 重新加载部门列表
  } catch (error) {
    console.error('删除部门失败:', error)
    showError('删除部门失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    deleting.value = false
  }
}

// 应用过滤器
const applyFilters = () => {
  filterDrawer.value = false
  
  // 应用过滤条件
  const filtered = allDepartments.value.filter(dept => {
    let match = true
    
    if (filters.value.id && !dept.id.toString().toLowerCase().includes(filters.value.id.toLowerCase())) {
      match = false
    }
    
    if (filters.value.name && !dept.name.toLowerCase().includes(filters.value.name.toLowerCase())) {
      match = false
    }
    
    if (filters.value.description && dept.description && 
        !dept.description.toLowerCase().includes(filters.value.description.toLowerCase())) {
      match = false
    }
    
    return match
  })
  
  departments.value = filtered
}

// 清除过滤器
const clearFilters = () => {
  filters.value = {
    id: '',
    name: '',
    description: ''
  }
  
  // 重置为所有部门
  departments.value = [...allDepartments.value]
}
</script> 