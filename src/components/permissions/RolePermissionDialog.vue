<template>
  <v-dialog
    v-model="localDialog"
    max-width="900px"
    persistent
    scrollable
    @click:outside="closeDialog"
  >
    <v-card>
      <v-card-title class="text-h5">
        <span>{{ role.name }} - 权限管理</span>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="搜索权限"
          single-line
          hide-details
          density="compact"
          class="ml-2"
          style="max-width: 200px;"
        ></v-text-field>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text style="height: 500px;">
        <div v-if="loading" class="d-flex justify-center align-center" style="height: 100%;">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <v-container v-else>
          <v-row>
            <!-- 已分配权限 -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-2">
                <v-card-title class="text-subtitle-1">
                  已分配权限 ({{ selectedPermissions.length }})
                </v-card-title>
                <v-card-text class="permissions-list">
                  <v-chip-group column>
                    <v-chip
                      v-for="permission in selectedPermissions"
                      :key="permission.id"
                      closable
                      @click:close="removePermission(permission)"
                      color="info"
                      text-color="white"
                      class="ma-1"
                    >
                      {{ getPermissionLabel(permission) }}
                    </v-chip>
                  </v-chip-group>
                  <div v-if="selectedPermissions.length === 0" class="text-center text-grey pa-4">
                    暂无已分配的权限
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <!-- 可用权限 -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-2">
                <v-card-title class="text-subtitle-1">
                  可用权限
                  <v-spacer></v-spacer>
                  <v-select
                    v-model="filterPrefix"
                    :items="prefixOptions"
                    label="按类型筛选"
                    density="compact"
                    hide-details
                    class="ml-2"
                    style="max-width: 150px;"
                  ></v-select>
                </v-card-title>
                <v-card-text class="permissions-list">
                  <v-list density="compact" lines="two">
                    <v-list-item
                      v-for="permission in filteredAvailablePermissions"
                      :key="permission.id"
                      :title="getPermissionLabel(permission)"
                      :subtitle="getPermissionDescription(permission)"
                      @click="addPermission(permission)"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="getPermissionColor(permission)">
                          mdi-shield
                        </v-icon>
                      </template>
                      <template v-slot:append>
                        <v-icon color="primary">mdi-plus</v-icon>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="filteredAvailablePermissions.length === 0">
                      <template v-slot:default>
                        <div class="text-center text-grey pa-4">
                          没有更多可用权限
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions>
        <small class="text-grey">已选择 {{ selectedPermissions.length }} 个权限</small>
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="closeDialog"
          :disabled="savingPermissions"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          @click="saveRolePermissions"
          :loading="savingPermissions"
          :disabled="savingPermissions"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { PermissionHelper, PermissionDescriptions, PermissionPrefixes } from '../../utils/permissionConstants'
import api from '../../utils/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  role: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      permissions: []
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

// 本地状态
const localDialog = ref(props.modelValue)
const search = ref('')
const filterPrefix = ref('')
const allPermissions = ref([])
const selectedPermissions = ref([])
const savingPermissions = ref(false)

// 权限前缀选项
const prefixOptions = computed(() => {
  const options = [{ title: '全部类型', value: '' }]
  
  // 添加前缀选项
  Object.keys(PermissionPrefixes).forEach(key => {
    const prefix = PermissionPrefixes[key]
    options.push({
      title: getPrefixDisplayName(key),
      value: prefix
    })
  })
  
  return options
})

// 获取前缀显示名称
function getPrefixDisplayName(prefixKey) {
  const displayNames = {
    'ACCESS': '访问权限',
    'MANAGE': '管理权限',
    'VIEW': '查看权限',
    'EDIT': '编辑权限',
    'CREATE': '创建权限',
    'DELETE': '删除权限'
  }
  return displayNames[prefixKey] || prefixKey
}

// 可用权限（排除已选择的）
const availablePermissions = computed(() => {
  const selectedIds = selectedPermissions.value.map(p => p.id)
  return allPermissions.value.filter(p => !selectedIds.includes(p.id))
})

// 根据搜索和过滤条件过滤可用权限
const filteredAvailablePermissions = computed(() => {
  let filtered = availablePermissions.value
  
  // 前缀过滤
  if (filterPrefix.value) {
    filtered = filtered.filter(p => p.permission_code && p.permission_code.startsWith(filterPrefix.value))
  }
  
  // 搜索过滤
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(p => {
      const permDesc = PermissionDescriptions.getDescription(p.permission_code) || p.permission_code
      const routeName = p.route?.name || ''
      const description = p.description || ''
      
      return permDesc.toLowerCase().includes(searchLower) || 
             routeName.toLowerCase().includes(searchLower) ||
             description.toLowerCase().includes(searchLower) ||
             (p.permission_code && p.permission_code.toLowerCase().includes(searchLower))
    })
  }
  
  return filtered
})

// 监听dialog prop变化
watch(() => props.modelValue, (newVal) => {
  localDialog.value = newVal
  if (newVal) {
    loadAllPermissions()
  }
})

// 监听localDialog变化
watch(() => localDialog.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听role prop变化
watch(() => props.role, (newVal) => {
  if (newVal && newVal.permissions) {
    selectedPermissions.value = [...newVal.permissions]
  } else {
    selectedPermissions.value = []
  }
})

// 获取权限标签
const getPermissionLabel = (permission) => {
  if (permission.permission_code) {
    return PermissionDescriptions.getDescription(permission.permission_code) || permission.permission_code
  }
  return permission.description || '未命名权限'
}

// 获取权限描述
const getPermissionDescription = (permission) => {
  let desc = []
  
  if (permission.route) {
    desc.push(`路由: ${permission.route.name || permission.route.path}`)
  }
  
  if (permission.description) {
    desc.push(permission.description)
  }
  
  return desc.join(' | ') || '无描述'
}

// 获取权限颜色
const getPermissionColor = (permission) => {
  if (!permission.permission_code) return 'grey'
  
  if (permission.permission_code.startsWith(PermissionPrefixes.ACCESS)) {
    return 'indigo'
  }
  
  if (permission.permission_code.startsWith(PermissionPrefixes.MANAGE)) {
    return 'purple'
  }
  
  if (permission.permission_code.startsWith(PermissionPrefixes.VIEW)) {
    return 'green'
  }
  
  if (permission.permission_code.startsWith(PermissionPrefixes.EDIT)) {
    return 'amber'
  }
  
  if (permission.permission_code.startsWith(PermissionPrefixes.CREATE)) {
    return 'blue'
  }
  
  if (permission.permission_code.startsWith(PermissionPrefixes.DELETE)) {
    return 'red'
  }
  
  return 'grey'
}

// 添加权限
const addPermission = (permission) => {
  if (!selectedPermissions.value.find(p => p.id === permission.id)) {
    selectedPermissions.value.push(permission)
  }
}

// 移除权限
const removePermission = (permission) => {
  const index = selectedPermissions.value.findIndex(p => p.id === permission.id)
  if (index !== -1) {
    selectedPermissions.value.splice(index, 1)
  }
}

// 加载所有权限
const loadAllPermissions = async () => {
  try {
    const response = await api.get('/route-permissions')
    if (response && response.data) {
      allPermissions.value = response.data
    }
  } catch (error) {
    console.error('加载权限列表失败:', error)
  }
}

// 保存角色权限
const saveRolePermissions = async () => {
  try {
    savingPermissions.value = true
    
    // 获取所有选中权限的ID，并确保它们是整数类型
    const permissionIds = selectedPermissions.value.map(p => Number(p.id))
    
    // 更新角色权限
    await api.post(`/roles/${props.role.id}/permissions`, {
      permission_ids: permissionIds
    })
    
    emit('save', {
      ...props.role,
      permissions: selectedPermissions.value
    })
    
    localDialog.value = false
  } catch (error) {
    console.error('保存角色权限失败:', error)
  } finally {
    savingPermissions.value = false
  }
}

// 关闭对话框
const closeDialog = () => {
  localDialog.value = false
  emit('close')
}

// 组件挂载时加载权限数据
onMounted(() => {
  if (props.modelValue) {
    loadAllPermissions()
  }
})
</script>

<style scoped>
.permissions-list {
  max-height: 350px;
  overflow-y: auto;
}
</style> 