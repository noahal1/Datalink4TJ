<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-office-building</v-icon>
            部门管理
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openAddDialog"
            >
              添加部门
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="departments"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-icon
                  size="small"
                  class="me-2"
                  @click="editDepartment(item.raw)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  color="error"
                  @click="confirmDelete(item.raw)"
                >
                  mdi-delete
                </v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 添加/编辑部门对话框 -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span>{{ formTitle }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.code"
                  label="部门代码"
                  :disabled="editedIndex !== -1"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="部门名称"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.description"
                  label="部门描述"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="closeDialog"
          >
            取消
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="saveDepartment"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>
          您确定要删除这个部门吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="text" @click="deleteDepartment">删除</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification'

const { showSuccess, showError } = useNotification()

// 表格列定义
const headers = [
  { title: '部门代码', key: 'code', align: 'start', sortable: true },
  { title: '部门名称', key: 'name', align: 'start', sortable: true },
  { title: '描述', key: 'description', align: 'start', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
]

// 部门数据
const departments = ref([
  { code: 'ADMIN', name: '管理员', description: '系统管理员组' },
  { code: 'QA', name: '质量部门', description: '负责质量控制与保证' },
  { code: 'ASSY', name: '生产部门', description: '负责产品装配与生产' },
  { code: 'EHS', name: '环境健康安全', description: '负责环境、健康与安全管理' },
  { code: 'PCL', name: '物流部门', description: '负责物流与供应链管理' },
  { code: 'MAT', name: '维修部门', description: '负责设备维修与保养' },
  { code: 'GMO', name: '全球制造运营', description: '负责全球制造运营管理' },
])

// 加载状态
const loading = ref(false)

// 编辑相关变量
const dialog = ref(false)
const deleteDialog = ref(false)
const editedIndex = ref(-1)
const editedItem = ref({
  code: '',
  name: '',
  description: '',
})
const defaultItem = {
  code: '',
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
    // 这里应该是从API获取数据
    // const response = await api.getDepartments()
    // departments.value = response.data
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 使用示例数据
    // departments.value = [...] // 已在上面定义
  } catch (error) {
    console.error('获取部门数据失败:', error)
    showError('获取部门数据失败')
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
  editedIndex.value = departments.value.findIndex(d => d.code === item.code)
  editedItem.value = { ...item }
  dialog.value = true
}

// 关闭对话框
const closeDialog = () => {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
  }, 300)
}

// 保存部门
const saveDepartment = async () => {
  try {
    // 表单验证
    if (!editedItem.value.code || !editedItem.value.name) {
      showError('部门代码和名称不能为空')
      return
    }
    
    // 新增部门
    if (editedIndex.value === -1) {
      // 检查代码是否已存在
      if (departments.value.some(d => d.code === editedItem.value.code)) {
        showError('部门代码已存在')
        return
      }
      
      // 调用API保存
      // await api.createDepartment(editedItem.value)
      
      // 更新本地数据
      departments.value.push(editedItem.value)
      showSuccess('部门添加成功')
    } 
    // 更新部门
    else {
      // 调用API更新
      // await api.updateDepartment(editedItem.value.code, editedItem.value)
      
      // 更新本地数据
      Object.assign(departments.value[editedIndex.value], editedItem.value)
      showSuccess('部门更新成功')
    }
    
    closeDialog()
  } catch (error) {
    console.error('保存部门失败:', error)
    showError('保存部门失败')
  }
}

// 确认删除
const confirmDelete = (item) => {
  editedIndex.value = departments.value.findIndex(d => d.code === item.code)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

// 删除部门
const deleteDepartment = async () => {
  try {
    // 调用API删除
    // await api.deleteDepartment(editedItem.value.code)
    
    // 更新本地数据
    departments.value.splice(editedIndex.value, 1)
    showSuccess('部门删除成功')
    
    deleteDialog.value = false
    editedIndex.value = -1
    editedItem.value = { ...defaultItem }
  } catch (error) {
    console.error('删除部门失败:', error)
    showError('删除部门失败')
  }
}
</script>

<style scoped>
.v-data-table {
  margin-top: 16px;
}
</style> 