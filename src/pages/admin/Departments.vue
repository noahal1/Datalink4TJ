<template>
  <unified-page-template 
    title="部门管理"
    icon="mdi-office-building"
    color="secondary"
  >
    <v-row>
      <v-col cols="12">
        <unified-data-table
          title="部门列表"
          icon="mdi-office-building"
          :headers="[
            { title: '部门代码', key: 'id', align: 'start', sortable: true },
            { title: '部门名称', key: 'name', align: 'start', sortable: true },
            { title: '部门描述', key: 'description', align: 'start', sortable: true },
            { title: '操作', key: 'actions', align: 'center', sortable: false }
          ]"
          :items="departments"
          :loading="loading"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn size="small" variant="text" color="primary" class="mr-1" @click="editDepartment(item)">
              <v-icon>mdi-pencil</v-icon>
              编辑
            </v-btn>
            <v-btn size="small" variant="text" color="error" @click="confirmDelete(item)">
              <v-icon>mdi-delete</v-icon>
              删除
            </v-btn>
          </template>
          <template #actions>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
              添加部门
            </v-btn>
          </template>
        </unified-data-table>
      </v-col>
    </v-row>
    
    <!-- 部门对话框 -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ formTitle }}
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form>
            <v-text-field
              v-model="editedItem.id"
              label="部门代码"
              placeholder="请输入部门代码"
              variant="outlined"
              density="comfortable"
              :disabled="editedIndex !== -1"
              :rules="[rules.required]"
            ></v-text-field>
            <v-text-field
              v-model="editedItem.name"
              label="部门名称"
              placeholder="请输入部门名称"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            ></v-text-field>
            <v-textarea
              v-model="editedItem.description"
              label="部门描述"
              placeholder="请输入部门描述"
              variant="outlined"
              density="comfortable"
              rows="3"
            ></v-textarea>
          </unified-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="primary" @click="saveDepartment">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-error text-white">确认删除</v-card-title>
        <v-card-text class="pt-4">
          您确定要删除这个部门吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteDepartment">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import UnifiedPageTemplate from '../../components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '../../components/UnifiedDataTable.vue'
import UnifiedForm from '../../components/UnifiedForm.vue'
import { useNotification } from '../../composables/useNotification'
import { get, post, put, del } from '../../utils/api'

const { showSuccess, showError } = useNotification()

// 部门数据
const departments = ref([])

// 表单验证规则
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项'
};

// 加载状态
const loading = ref(false)

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
    const response = await get('/departments/')
    console.log('部门数据响应:', response)
    
    // 检查响应数据结构
    if (response && response.data && Array.isArray(response.data)) {
      departments.value = response.data
    } else if (response && Array.isArray(response)) {
      departments.value = response
    } else {
      console.error('部门数据格式不正确:', response)
      departments.value = []
      showError('部门数据格式不正确')
    }
  } catch (error) {
    console.error('获取部门数据失败:', error)
    showError('获取部门数据失败')
    departments.value = [] // 确保始终是数组
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
    loading.value = true
    
    if (editedIndex.value === -1) {
      // 创建新部门
      await post('/departments/', editedItem.value)
      showSuccess('部门创建成功')
    } else {
      // 更新部门
      await put(`/departments/${editedItem.value.id}`, editedItem.value)
      showSuccess('部门更新成功')
    }
    
    closeDialog()
    fetchDepartments() // 重新加载部门列表
  } catch (error) {
    console.error('保存部门失败:', error)
    showError('保存部门失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loading.value = false
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
    loading.value = true
    
    await del(`/departments/${editedItem.value.id}`)
    showSuccess('部门删除成功')
    
    deleteDialog.value = false
    fetchDepartments() // 重新加载部门列表
  } catch (error) {
    console.error('删除部门失败:', error)
    showError('删除部门失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loading.value = false
  }
}
</script> 