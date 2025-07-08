<template>
  <v-container fluid>
    <v-card elevation="3">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon class="mr-2" color="primary">mdi-matrix</v-icon>
        <div class="text-h5 font-weight-medium">角色权限矩阵</div>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="refreshData" :loading="loading">
          <v-icon start>mdi-refresh</v-icon>
          刷新
        </v-btn>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-alert v-if="!roles.length || !permissions.length" type="warning" class="mb-4">
          {{ !roles.length ? '没有找到角色数据' : '没有找到权限数据' }}
        </v-alert>
        
        <v-data-table
          v-if="roles.length && permissions.length"
          :headers="tableHeaders"
          :items="tableData"
          :loading="loading"
          item-value="id"
          class="elevation-1"
          density="compact"
        >
          <template v-slot:item="{ item }">
            <tr>
              <td class="font-weight-medium">{{ item.module }}</td>
              <td class="font-weight-medium">{{ item.level }}</td>
              <td v-for="role in roles" :key="role.id" class="text-center">
                <v-checkbox
                  :model-value="hasPermission(role.id, item.id)"
                  @update:model-value="togglePermission(role.id, item.id, $event)"
                  :loading="saving"
                  hide-details
                  density="compact"
                />
              </td>
            </tr>
          </template>
        </v-data-table>
        
        <v-alert v-if="hasChanges" type="info" class="mt-4">
          <div class="d-flex align-center">
            <span>有未保存的更改</span>
            <v-spacer></v-spacer>
            <v-btn color="success" @click="saveChanges" :loading="saving">
              保存更改
            </v-btn>
            <v-btn color="grey" @click="cancelChanges" class="ml-2">
              取消
            </v-btn>
          </div>
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../../../../utils/api'
import Message from '../../../../utils/notification'

// Props
const props = defineProps({
  roles: {
    type: Array,
    default: () => []
  },
  permissions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update-role-permissions', 'refresh-data'])

// 响应式数据
const saving = ref(false)
const rolePermissions = ref(new Map()) // roleId -> Set(permissionIds)
const originalRolePermissions = ref(new Map())
const hasChanges = ref(false)

// 计算属性
const tableHeaders = computed(() => {
  const headers = [
    { title: '模块', key: 'module', sortable: true },
    { title: '权限等级', key: 'level', sortable: true }
  ]
  
  // 为每个角色添加一列
  props.roles.forEach(role => {
    headers.push({
      title: role.name,
      key: `role_${role.id}`,
      align: 'center',
      sortable: false,
      width: '120px'
    })
  })
  
  return headers
})

const tableData = computed(() => {
  return props.permissions.map(permission => ({
    id: permission.id,
    module: permission.module,
    level: permission.level
  }))
})

// 方法
const refreshData = () => {
  emit('refresh-data')
  loadRolePermissions()
}

const loadRolePermissions = async () => {
  try {
    const newRolePermissions = new Map()
    
    for (const role of props.roles) {
      const permissionIds = new Set()
      
      // 从角色的permissions属性中获取权限ID
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(perm => {
          permissionIds.add(perm.id)
        })
      }
      
      newRolePermissions.set(role.id, permissionIds)
    }
    
    rolePermissions.value = newRolePermissions
    originalRolePermissions.value = new Map(
      Array.from(newRolePermissions.entries()).map(([roleId, permIds]) => 
        [roleId, new Set(permIds)]
      )
    )
    
    hasChanges.value = false
    
  } catch (error) {
    console.error('加载角色权限失败:', error)
    Message.error('加载角色权限失败')
  }
}

const hasPermission = (roleId, permissionId) => {
  const permissions = rolePermissions.value.get(roleId)
  return permissions ? permissions.has(permissionId) : false
}

const togglePermission = (roleId, permissionId, checked) => {
  const permissions = rolePermissions.value.get(roleId) || new Set()
  
  if (checked) {
    permissions.add(permissionId)
  } else {
    permissions.delete(permissionId)
  }
  
  rolePermissions.value.set(roleId, permissions)
  checkForChanges()
}

const checkForChanges = () => {
  let changed = false
  
  for (const [roleId, currentPerms] of rolePermissions.value) {
    const originalPerms = originalRolePermissions.value.get(roleId) || new Set()
    
    if (currentPerms.size !== originalPerms.size) {
      changed = true
      break
    }
    
    for (const permId of currentPerms) {
      if (!originalPerms.has(permId)) {
        changed = true
        break
      }
    }
    
    if (changed) break
  }
  
  hasChanges.value = changed
}

const saveChanges = async () => {
  saving.value = true
  
  try {
    const promises = []
    
    for (const [roleId, permissions] of rolePermissions.value) {
      const permissionIds = Array.from(permissions)
      promises.push(
        emit('update-role-permissions', roleId, permissionIds)
      )
    }
    
    await Promise.all(promises)
    
    // 更新原始数据
    originalRolePermissions.value = new Map(
      Array.from(rolePermissions.value.entries()).map(([roleId, permIds]) => 
        [roleId, new Set(permIds)]
      )
    )
    
    hasChanges.value = false
    Message.success('权限更新成功')
    
  } catch (error) {
    console.error('保存权限失败:', error)
    Message.error('保存权限失败')
  } finally {
    saving.value = false
  }
}

const cancelChanges = () => {
  rolePermissions.value = new Map(
    Array.from(originalRolePermissions.value.entries()).map(([roleId, permIds]) => 
      [roleId, new Set(permIds)]
    )
  )
  hasChanges.value = false
  Message.info('已取消更改')
}

// 生命周期
onMounted(() => {
  loadRolePermissions()
})

// 监听props变化
watch(() => props.roles, loadRolePermissions, { deep: true })
watch(() => props.permissions, loadRolePermissions, { deep: true })
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-data-table :deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.v-data-table :deep(.v-data-table__th) {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style>
