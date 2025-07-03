<template>
  <unified-page-template
    title="权限角色管理"
    icon="mdi-shield-account"
    color="primary"
  >
    <v-tabs v-model="activeTab" bg-color="primary">
      <v-tab value="roles">角色管理</v-tab>
      <v-tab value="route-permissions">路由权限矩阵</v-tab>
      <v-tab value="permission-codes">权限代码</v-tab>
    </v-tabs>
    
    <v-window v-model="activeTab" class="mt-4">
      <!-- 角色管理标签页 -->
      <v-window-item value="roles">
        <v-container>
          <v-row>
            <v-col cols="12">
              <role-list
                :roles="rolesList"
                :total-roles="totalRoles"
                :loading="loadingRoles"
                @add-role="openRoleDialog()"
                @edit-role="editRole"
                @delete-role="confirmDeleteRole"
                @manage-routes="openRoleRoutesDialog"
                @load-items="loadRoles"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <!-- 路由权限矩阵标签页 -->
      <v-window-item value="route-permissions">
        <v-container>
          <v-row>
            <v-col cols="12">
              <RoutePermissionMatrix
                :loading="loadingMatrix"
                @refresh="loadRoutesMatrix"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <!-- 权限代码标签页 -->
      <v-window-item value="permission-codes">
        <v-container>
          <v-row>
            <v-col cols="12">
              <permission-codes-manager
                :loading="loadingPermissionCodes"
                @refresh="loadPermissionCodes"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
    </v-window>
    
    <!-- 角色编辑对话框 -->
    <role-dialog
      v-model="roleDialog"
      v-model:role="editedRole"
      :is-new="editedRoleIndex === -1"
      :loading="savingRole"
      @save="saveRole"
      @close="closeRoleDialog"
    />

    <!-- 角色路由权限管理对话框 -->
    <role-routes-dialog
      v-model="roleRoutesDialog"
      :role="selectedRole"
      :routes="routesList"
      :loading="loadingRoleRoutes"
      @save="updateRoleRoutes"
      @close="closeRoleRoutesDialog"
    />
    
    <!-- 确认删除对话框 -->
    <confirm-dialog
      v-model="confirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :loading="confirmDialogLoading"
      @confirm="handleConfirmDelete"
    />
  </unified-page-template>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePermissionStore } from '../stores/permission'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import RoleList from '../components/permissions/RoleList.vue'
import RoleDialog from '../components/permissions/RoleDialog.vue'
import RoleRoutesDialog from '../components/permissions/RoleRoutesDialog.vue'
import RoutePermissionMatrix from '../components/permissions/RoutePermissionMatrix.vue'
import PermissionCodesManager from '../components/permissions/PermissionCodesManager.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import api from '../utils/api'
import Message from '../utils/notification'

// 标签页控制
const activeTab = ref('roles')

// 权限Store
const permissionStore = usePermissionStore()

// ==== 路由权限矩阵相关 ====
const routesList = ref([])
const loadingMatrix = ref(false)

// ==== 权限代码相关 ====
const loadingPermissionCodes = ref(false)

// ==== 角色管理相关 ====
const rolesList = ref([])
const totalRoles = ref(0)
const loadingRoles = ref(false)
const savingRole = ref(false)
const roleDialog = ref(false)
const editedRoleIndex = ref(-1)
const editedRole = ref({
  id: null,
  name: '',
  description: ''
})

// ==== 角色路由权限管理相关 ====
const roleRoutesDialog = ref(false)
const selectedRole = ref(null)
const loadingRoleRoutes = ref(false)

// 加载角色列表
const loadRoles = async (options = {}) => {
  try {
    loadingRoles.value = true
    
    // 构建查询参数
    const params = {
      skip: options.page ? (options.page - 1) * options.itemsPerPage : 0,
      limit: options.itemsPerPage || 10
    }
    
    if (options.sortBy && options.sortBy.length > 0) {
      params.order_by = options.sortBy[0].key
      params.order_desc = options.sortBy[0].order === 'desc'
    }
    
    const response = await api.get('/roles', { params })
    if (response && response.data) {
      rolesList.value = response.data
      totalRoles.value = response.headers['x-total-count'] || rolesList.value.length
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
    Message.error('加载角色列表失败')
  } finally {
    loadingRoles.value = false
  }
}

// 打开角色对话框
const openRoleDialog = (role = null) => {
  if (role) {
    editedRoleIndex.value = rolesList.value.findIndex(r => r.id === role.id)
    editedRole.value = { ...role }
  } else {
    editedRoleIndex.value = -1
    editedRole.value = {
      id: null,
      name: '',
      description: ''
    }
  }
  roleDialog.value = true
}

// 编辑角色
const editRole = (role) => {
  openRoleDialog(role)
}

// 保存角色
const saveRole = async () => {
  try {
    savingRole.value = true
    
    // 添加调试日志
    console.log('保存角色数据:', JSON.stringify(editedRole.value))
    
    // 检查并清理数据，确保格式正确
    const roleData = {
      name: editedRole.value.name,
      description: editedRole.value.description,
      permission_ids: editedRole.value.permission_ids
    }
    
    // 确保name字段不包含对象字符串表示
    if (typeof roleData.name === 'string' && roleData.name.includes("name=")) {
      console.warn('检测到name字段格式不正确，尝试修复')
      try {
        // 尝试提取真正的名称
        const match = roleData.name.match(/name=['"]([^'"]+)['"]/)
        if (match && match[1]) {
          roleData.name = match[1]
        }
      } catch (e) {
        console.error('修复name字段失败:', e)
      }
    }
    
    console.log('清理后的角色数据:', roleData)
    
    if (editedRoleIndex.value === -1) {
      // 创建新角色
      const response = await api.post('/roles', roleData)
      Message.success('角色创建成功')
      
      // 刷新角色列表
      await loadRoles()
    } else {
      // 更新现有角色
      await api.put(`/roles/${editedRole.value.id}`, roleData)
      Message.success('角色更新成功')
      
      // 更新本地数据
      rolesList.value[editedRoleIndex.value] = { 
        ...editedRole.value,
        name: roleData.name,
        description: roleData.description
      }
    }
    
    closeRoleDialog()
  } catch (error) {
    console.error('保存角色失败:', error)
    Message.error('保存角色失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    savingRole.value = false
  }
}

// 关闭角色对话框
const closeRoleDialog = () => {
  roleDialog.value = false
  setTimeout(() => {
    editedRole.value = {
      id: null,
      name: '',
      description: ''
    }
  }, 300)
}

// ==== 角色路由权限管理方法 ====
// 打开角色路由权限对话框
const openRoleRoutesDialog = (role) => {
  selectedRole.value = role
  roleRoutesDialog.value = true
}

// 关闭角色路由权限对话框
const closeRoleRoutesDialog = () => {
  roleRoutesDialog.value = false
  selectedRole.value = null
}

// 更新角色路由权限
const updateRoleRoutes = async (roleId, routeIds) => {
  try {
    loadingRoleRoutes.value = true

    // 调用后端API更新角色路由权限
    const response = await api.put(`/permissions/roles/${roleId}/routes`, {
      route_ids: routeIds
    })

    Message.success('角色路由权限更新成功')

    // 刷新路由权限矩阵
    await loadRoutesMatrix()

    closeRoleRoutesDialog()
  } catch (error) {
    console.error('更新角色路由权限失败:', error)
    Message.error('更新角色路由权限失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loadingRoleRoutes.value = false
  }
}

// ==== 路由权限矩阵方法 ====
// 加载路由权限矩阵
const loadRoutesMatrix = async () => {
  try {
    loadingMatrix.value = true

    // 加载路由列表
    const routesResponse = await api.get('/routes')
    if (routesResponse && routesResponse.data) {
      routesList.value = routesResponse.data
    }

    Message.success('路由权限矩阵加载成功')
  } catch (error) {
    console.error('加载路由权限矩阵失败:', error)
    Message.error('加载路由权限矩阵失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loadingMatrix.value = false
  }
}

// ==== 权限代码方法 ====
// 加载权限代码
const loadPermissionCodes = async () => {
  try {
    loadingPermissionCodes.value = true

    // 这里可以调用获取权限代码的API
    // 目前权限代码是基于角色硬编码的，所以这个方法主要用于刷新

    Message.success('权限代码加载成功')
  } catch (error) {
    console.error('加载权限代码失败:', error)
    Message.error('加载权限代码失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loadingPermissionCodes.value = false
  }
}

// ==== 确认删除相关 ====
const confirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogLoading = ref(false)
const deleteTarget = ref(null)
const deleteType = ref('')

// 确认删除角色
const confirmDeleteRole = (role) => {
  deleteTarget.value = role
  deleteType.value = 'role'
  confirmDialogTitle.value = '确认删除角色'
  confirmDialogMessage.value = `确定要删除角色 "${role.name}" 吗？此操作不可撤销。`
  confirmDialog.value = true
}

// 处理确认删除
const handleConfirmDelete = async () => {
  try {
    confirmDialogLoading.value = true

    if (deleteType.value === 'role') {
      await api.delete(`/roles/${deleteTarget.value.id}`)
      Message.success('角色删除成功')
      await loadRoles()
    }

    confirmDialog.value = false
  } catch (error) {
    console.error('删除失败:', error)
    Message.error('删除失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    confirmDialogLoading.value = false
    deleteTarget.value = null
    deleteType.value = ''
  }
}

// 初始化
onMounted(async () => {
  // 加载角色数据
  await loadRoles()

  // 加载路由权限矩阵
  await loadRoutesMatrix()

  // 刷新权限存储
  await permissionStore.initPermissions()
})
</script>

<style scoped>
.v-window {
  min-height: 400px;
}
</style> 