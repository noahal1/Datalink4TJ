<template>
  <unified-page-template 
    title="权限管理"
    icon="mdi-shield-account"
    color="primary"
  >
    <v-tabs v-model="activeTab" bg-color="primary">
      <v-tab value="roles">角色管理</v-tab>
      <v-tab value="permissions">权限管理</v-tab>
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
                @manage-permissions="openRolePermissionsDialog"
                @load-items="loadRoles"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
      
      <!-- 权限管理标签页 -->
      <v-window-item value="permissions">
        <v-container>
          <v-row>
            <v-col cols="12">
              <permission-list
                :permissions="permissionsList"
                :total-permissions="totalPermissions"
                :loading="loadingPermissions"
                @add-permission="openPermissionDialog()"
                @edit-permission="editPermission"
                @delete-permission="confirmDeletePermission"
                @load-items="loadPermissions"
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
    
    <!-- 权限编辑对话框 -->
    <permission-dialog
      v-model="permissionDialog"
      v-model:permission="editedPermission"
      :is-new="editedPermissionIndex === -1"
      :loading="savingPermission"
      @save="savePermission"
      @close="closePermissionDialog"
    />
    
    <!-- 角色权限管理对话框 -->
    <role-permission-dialog
      v-model="rolePermissionsDialog"
      :role="selectedRole"
      :loading="loadingRolePermissions"
      @save="updateRolePermissions"
      @close="closeRolePermissionsDialog"
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
import { ref, onMounted } from 'vue'
import { usePermissionStore } from '../stores/permission'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import RoleList from '../components/permissions/RoleList.vue'
import PermissionList from '../components/permissions/PermissionList.vue'
import RoleDialog from '../components/permissions/RoleDialog.vue'
import PermissionDialog from '../components/permissions/PermissionDialog.vue'
import RolePermissionDialog from '../components/permissions/RolePermissionDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import api from '../utils/api'
import Message from '../utils/notification'

// 标签页控制
const activeTab = ref('roles')

// 权限Store
const permissionStore = usePermissionStore()

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

// ==== 权限管理相关 ====
const permissionsList = ref([])
const totalPermissions = ref(0)
const loadingPermissions = ref(false)
const savingPermission = ref(false)
const permissionDialog = ref(false)
const editedPermissionIndex = ref(-1)
const editedPermission = ref({
  id: null,
  permission_code: '',
  description: '',
  route_id: null,
  role_id: null
})

// 加载权限列表
const loadPermissions = async (options = {}) => {
  try {
    loadingPermissions.value = true
    
    // 构建查询参数
    const params = {
      skip: options.page ? (options.page - 1) * options.itemsPerPage : 0,
      limit: options.itemsPerPage || 10
    }
    
    if (options.sortBy && options.sortBy.length > 0) {
      params.order_by = options.sortBy[0].key
      params.order_desc = options.sortBy[0].order === 'desc'
    }
    
    const response = await api.get('/route-permissions', { params })
    if (response && response.data) {
      permissionsList.value = response.data
      totalPermissions.value = response.headers['x-total-count'] || permissionsList.value.length
    }
  } catch (error) {
    console.error('加载路由权限列表失败:', error)
    Message.error('加载路由权限列表失败')
  } finally {
    loadingPermissions.value = false
  }
}

// 打开权限对话框
const openPermissionDialog = (permission = null) => {
  if (permission) {
    editedPermissionIndex.value = permissionsList.value.findIndex(p => p.id === permission.id)
    editedPermission.value = { ...permission }
  } else {
    editedPermissionIndex.value = -1
    editedPermission.value = {
      id: null,
      permission_code: '',
      description: '',
      route_id: null,
      role_id: null
    }
  }
  permissionDialog.value = true
}

// 编辑权限
const editPermission = (permission) => {
  openPermissionDialog(permission)
}

// 保存权限
const savePermission = async () => {
  try {
    savingPermission.value = true
    
    if (editedPermissionIndex.value === -1) {
      // 创建新权限
      const response = await api.post('/route-permissions', editedPermission.value)
      Message.success('路由权限创建成功')
      
      // 刷新权限列表
      await loadPermissions()
    } else {
      // 更新现有权限
      await api.put(`/route-permissions/${editedPermission.value.id}`, editedPermission.value)
      Message.success('路由权限更新成功')
      
      // 更新本地数据
      permissionsList.value[editedPermissionIndex.value] = { ...editedPermission.value }
    }
    
    closePermissionDialog()
    
    // 重新初始化权限存储
    await permissionStore.initialize()
  } catch (error) {
    console.error('保存路由权限失败:', error)
    Message.error('保存路由权限失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    savingPermission.value = false
  }
}

// 关闭权限对话框
const closePermissionDialog = () => {
  permissionDialog.value = false
  setTimeout(() => {
    editedPermission.value = {
      id: null,
      permission_code: '',
      description: '',
      route_id: null,
      role_id: null
    }
  }, 300)
}

// ==== 角色权限管理相关 ====
const rolePermissionsDialog = ref(false)
const selectedRole = ref(null)
const loadingRolePermissions = ref(false)

// 打开角色权限管理对话框
const openRolePermissionsDialog = (role) => {
  selectedRole.value = role
  rolePermissionsDialog.value = true
}

// 更新角色权限
const updateRolePermissions = (updatedRole) => {
  // 找到角色在列表中的索引
  const index = rolesList.value.findIndex(r => r.id === updatedRole.id)
  if (index !== -1) {
    // 更新角色数据
    rolesList.value[index] = updatedRole
  }
  
  Message.success('角色权限更新成功')
  closeRolePermissionsDialog()
}

// 关闭角色权限管理对话框
const closeRolePermissionsDialog = () => {
  rolePermissionsDialog.value = false
  setTimeout(() => {
    selectedRole.value = null
  }, 300)
}

// ==== 删除确认相关 ====
const confirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogLoading = ref(false)
const deleteCallback = ref(null)
const deleteData = ref(null)

// 确认删除角色
const confirmDeleteRole = (role) => {
  confirmDialogTitle.value = '删除角色'
  confirmDialogMessage.value = `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`
  deleteCallback.value = deleteRole
  deleteData.value = role
  confirmDialog.value = true
}

// 确认删除权限
const confirmDeletePermission = (permission) => {
  confirmDialogTitle.value = '删除路由权限'
  confirmDialogMessage.value = `确定要删除权限代码 "${permission.permission_code}" 吗？此操作不可恢复。`
  deleteCallback.value = deletePermission
  deleteData.value = permission
  confirmDialog.value = true
}

// 处理确认删除
const handleConfirmDelete = async () => {
  if (deleteCallback.value && deleteData.value) {
    await deleteCallback.value(deleteData.value)
  }
}

// 删除角色
const deleteRole = async (role) => {
  try {
    confirmDialogLoading.value = true
    
    await api.delete(`/roles/${role.id}`)
    
    // 从列表中移除
    const index = rolesList.value.findIndex(r => r.id === role.id)
    if (index !== -1) {
      rolesList.value.splice(index, 1)
    }
    
    Message.success('角色删除成功')
    confirmDialog.value = false
  } catch (error) {
    console.error('删除角色失败:', error)
    Message.error('删除角色失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    confirmDialogLoading.value = false
  }
}

// 删除权限
const deletePermission = async (permission) => {
  try {
    confirmDialogLoading.value = true
    
    await api.delete(`/route-permissions/${permission.id}`)
    
    // 从列表中移除
    const index = permissionsList.value.findIndex(p => p.id === permission.id)
    if (index !== -1) {
      permissionsList.value.splice(index, 1)
    }
    
    Message.success('路由权限删除成功')
    confirmDialog.value = false
    
    // 重新初始化权限存储
    await permissionStore.initialize()
  } catch (error) {
    console.error('删除路由权限失败:', error)
    Message.error('删除路由权限失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    confirmDialogLoading.value = false
  }
}

// 初始化
onMounted(async () => {
  // 加载角色和权限数据
  await loadRoles()
  await loadPermissions()
  
  // 刷新权限存储
  await permissionStore.initialize()
})
</script>

<style scoped>
.v-window {
  min-height: 400px;
}
</style> 