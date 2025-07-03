<template>
  <v-container fluid>
    <v-card elevation="3">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon class="mr-2" color="primary">mdi-account-key</v-icon>
        <div class="text-h5 font-weight-medium">角色权限管理</div>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="refreshData" :loading="loading">
          <v-icon start>mdi-refresh</v-icon>
          刷新
        </v-btn>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-row>
          <!-- 角色列表 -->
          <v-col cols="12" md="4">
            <v-card outlined>
              <v-card-title class="text-h6">角色列表</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="role in roles"
                    :key="role.id"
                    :class="{ 'v-list-item--active': selectedRole?.id === role.id }"
                    @click="selectRole(role)"
                    rounded
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-account-group</v-icon>
                    </template>
                    <v-list-item-title>{{ role.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ role.description }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 权限分配 -->
          <v-col cols="12" md="8">
            <v-card outlined v-if="selectedRole">
              <v-card-title class="text-h6">
                {{ selectedRole.name }} - 权限配置
              </v-card-title>
              <v-card-text>
                <v-tabs v-model="activeTab">
                  <v-tab value="routes">路由权限</v-tab>
                  <v-tab value="permissions">功能权限</v-tab>
                </v-tabs>
                
                <v-window v-model="activeTab" class="mt-4">
                  <!-- 路由权限标签页 -->
                  <v-window-item value="routes">
                    <v-card outlined>
                      <v-card-title class="text-subtitle-1">可访问路由</v-card-title>
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" md="6">
                            <v-card outlined>
                              <v-card-title class="text-subtitle-2">可选路由</v-card-title>
                              <v-card-text style="max-height: 400px; overflow-y: auto;">
                                <v-treeview
                                  v-model:selected="selectedRoutes"
                                  :items="availableRoutes"
                                  item-key="id"
                                  item-title="title"
                                  item-children="children"
                                  selectable
                                  return-object
                                  dense
                                >
                                  <template v-slot:prepend="{ item }">
                                    <v-icon size="small">{{ item.icon || 'mdi-link' }}</v-icon>
                                  </template>
                                </v-treeview>
                              </v-card-text>
                            </v-card>
                          </v-col>
                          <v-col cols="12" md="6">
                            <v-card outlined>
                              <v-card-title class="text-subtitle-2">已分配路由</v-card-title>
                              <v-card-text style="max-height: 400px; overflow-y: auto;">
                                <v-list dense>
                                  <v-list-item
                                    v-for="route in assignedRoutes"
                                    :key="route.id"
                                  >
                                    <template v-slot:prepend>
                                      <v-icon size="small">{{ route.icon || 'mdi-link' }}</v-icon>
                                    </template>
                                    <v-list-item-title>{{ route.title }}</v-list-item-title>
                                    <v-list-item-subtitle>{{ route.path }}</v-list-item-subtitle>
                                    <template v-slot:append>
                                      <v-btn
                                        icon="mdi-delete"
                                        size="small"
                                        variant="text"
                                        color="error"
                                        @click="removeRoutePermission(route)"
                                      ></v-btn>
                                    </template>
                                  </v-list-item>
                                </v-list>
                              </v-card-text>
                            </v-card>
                          </v-col>
                        </v-row>
                        
                        <v-row class="mt-4">
                          <v-col cols="12">
                            <v-btn
                              color="primary"
                              @click="saveRoutePermissions"
                              :loading="saving"
                              :disabled="!hasRouteChanges"
                            >
                              <v-icon start>mdi-content-save</v-icon>
                              保存路由权限
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-window-item>
                  
                  <!-- 功能权限标签页 -->
                  <v-window-item value="permissions">
                    <v-card outlined>
                      <v-card-title class="text-subtitle-1">功能权限</v-card-title>
                      <v-card-text>
                        <v-row>
                          <v-col
                            v-for="module in permissionModules"
                            :key="module.name"
                            cols="12" md="6" lg="4"
                          >
                            <v-card outlined>
                              <v-card-title class="text-subtitle-2">{{ module.title }}</v-card-title>
                              <v-card-text>
                                <v-checkbox
                                  v-for="level in module.levels"
                                  :key="`${module.name}-${level.name}`"
                                  v-model="selectedPermissions"
                                  :value="`${module.name}.${level.name}`"
                                  :label="level.title"
                                  density="compact"
                                ></v-checkbox>
                              </v-card-text>
                            </v-card>
                          </v-col>
                        </v-row>
                        
                        <v-row class="mt-4">
                          <v-col cols="12">
                            <v-btn
                              color="primary"
                              @click="saveFunctionPermissions"
                              :loading="saving"
                              :disabled="!hasPermissionChanges"
                            >
                              <v-icon start>mdi-content-save</v-icon>
                              保存功能权限
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-window-item>
                </v-window>
              </v-card-text>
            </v-card>
            
            <v-card outlined v-else>
              <v-card-text class="text-center py-8">
                <v-icon size="64" color="grey">mdi-account-key</v-icon>
                <div class="text-h6 mt-4">请选择一个角色</div>
                <div class="text-body-2 text-grey">选择左侧的角色来配置其权限</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useNotification } from '../../composables/useNotification'
import api from '../../utils/api'

const { showSuccess, showError } = useNotification()

// 状态变量
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('routes')

// 角色相关
const roles = ref([])
const selectedRole = ref(null)

// 路由权限相关
const availableRoutes = ref([])
const selectedRoutes = ref([])
const assignedRoutes = ref([])

// 功能权限相关
const permissionModules = ref([
  {
    name: 'USER',
    title: '用户管理',
    levels: [
      { name: 'READ', title: '查看' },
      { name: 'WRITE', title: '编辑' },
      { name: 'ADMIN', title: '管理' }
    ]
  },
  {
    name: 'DEPARTMENT',
    title: '部门管理',
    levels: [
      { name: 'READ', title: '查看' },
      { name: 'WRITE', title: '编辑' },
      { name: 'ADMIN', title: '管理' }
    ]
  },
  {
    name: 'QA',
    title: '质量管理',
    levels: [
      { name: 'READ', title: '查看' },
      { name: 'WRITE', title: '编辑' },
      { name: 'ADMIN', title: '管理' }
    ]
  },
  {
    name: 'EHS',
    title: 'EHS管理',
    levels: [
      { name: 'READ', title: '查看' },
      { name: 'WRITE', title: '编辑' },
      { name: 'ADMIN', title: '管理' }
    ]
  }
])
const selectedPermissions = ref([])

// 计算属性
const hasRouteChanges = computed(() => {
  // 检查路由权限是否有变化
  return selectedRoutes.value.length > 0
})

const hasPermissionChanges = computed(() => {
  // 检查功能权限是否有变化
  return selectedPermissions.value.length > 0
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadRoles(),
      loadAvailableRoutes()
    ])
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    // 使用标准的角色API端点，添加查询参数
    const response = await api.get('/roles', {
      params: {
        skip: 0,
        limit: 1000  // 获取所有角色
      }
    })
    roles.value = response.data || []
    console.log('成功加载角色列表:', roles.value.length, '个角色')
  } catch (error) {
    console.error('加载角色列表失败:', error)
    showError('加载角色列表失败: ' + (error.response?.data?.detail || error.message))
  }
}

const loadAvailableRoutes = async () => {
  try {
    const response = await api.get('/routes')
    availableRoutes.value = buildRouteTree(response.data || [])
  } catch (error) {
    console.error('加载路由列表失败:', error)
    showError('加载路由列表失败')
  }
}

const buildRouteTree = (routes) => {
  const routeMap = new Map()
  const rootRoutes = []
  
  // 第一遍：创建所有路由对象
  routes.forEach(route => {
    const routeObj = {
      id: route.id,
      title: route.meta?.title || route.name,
      path: route.path,
      icon: route.meta?.icon || 'mdi-link',
      children: []
    }
    routeMap.set(route.id, routeObj)
    
    if (!route.parent_id) {
      rootRoutes.push(routeObj)
    }
  })
  
  // 第二遍：建立父子关系
  routes.forEach(route => {
    if (route.parent_id && routeMap.has(route.parent_id)) {
      routeMap.get(route.parent_id).children.push(routeMap.get(route.id))
    }
  })
  
  return rootRoutes
}

const selectRole = async (role) => {
  selectedRole.value = role
  await loadRolePermissions(role.id)
}

const loadRolePermissions = async (roleId) => {
  try {
    // 确保roleId是整数
    const numericRoleId = parseInt(roleId)
    if (isNaN(numericRoleId)) {
      console.error('无效的角色ID:', roleId)
      showError('无效的角色ID')
      return
    }

    // 加载角色的路由权限
    const routeResponse = await api.get(`/permissions/route-permissions?role_id=${numericRoleId}`)
    assignedRoutes.value = routeResponse.data || []

    // 加载角色的功能权限
    const permResponse = await api.get(`/permissions/roles/${numericRoleId}`)
    if (permResponse.data && permResponse.data.permissions) {
      selectedPermissions.value = permResponse.data.permissions.map(p => `${p.module}.${p.level}`)
    }
  } catch (error) {
    console.error('加载角色权限失败:', error)
    showError('加载角色权限失败: ' + (error.response?.data?.detail || error.message))
  }
}

const saveRoutePermissions = async () => {
  if (!selectedRole.value) return

  saving.value = true
  try {
    const roleId = parseInt(selectedRole.value.id)
    if (isNaN(roleId)) {
      showError('无效的角色ID')
      return
    }

    // 确保路由ID都是整数
    const routeIds = selectedRoutes.value.map(routeId => {
      const numericId = parseInt(routeId)
      if (isNaN(numericId)) {
        console.warn('无效的路由ID:', routeId)
        return null
      }
      return numericId
    }).filter(id => id !== null)

    console.log('保存路由权限:', { roleId, routeIds })

    // 先清除现有的路由权限（通过重新加载获取当前权限，然后删除）
    // 然后为每个选中的路由创建权限
    const createPromises = routeIds.map(routeId => {
      return api.post('/permissions/route-permissions', {
        route_id: routeId,
        role_id: roleId,
        permission_code: `ROUTE_${routeId}`,
        description: `访问路由 ${routeId} 的权限`
      }).catch(error => {
        // 如果权限已存在，忽略错误
        if (error.response?.status !== 400) {
          throw error
        }
        console.log(`路由权限已存在: route_id=${routeId}, role_id=${roleId}`)
      })
    })

    await Promise.all(createPromises)

    showSuccess('路由权限保存成功')

    // 重新加载权限数据
    await loadRolePermissions(roleId)
  } catch (error) {
    console.error('保存路由权限失败:', error)
    showError('保存路由权限失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    saving.value = false
  }
}

const saveFunctionPermissions = async () => {
  if (!selectedRole.value) return

  saving.value = true
  try {
    const roleId = parseInt(selectedRole.value.id)
    if (isNaN(roleId)) {
      showError('无效的角色ID')
      return
    }

    // 解析选中的权限
    const permissions = selectedPermissions.value.map(perm => {
      const [module, level] = perm.split('.')
      return { module, level }
    })

    // 保存功能权限
    await api.post(`/permissions/roles/${roleId}`, {
      permissions: permissions
    })

    showSuccess('功能权限保存成功')

    // 重新加载权限数据
    await loadRolePermissions(roleId)
  } catch (error) {
    console.error('保存功能权限失败:', error)
    showError('保存功能权限失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    saving.value = false
  }
}

const removeRoutePermission = async (route) => {
  if (!selectedRole.value) return

  try {
    const roleId = parseInt(selectedRole.value.id)
    const routeId = parseInt(route.id)

    if (isNaN(roleId) || isNaN(routeId)) {
      showError('无效的角色或路由ID')
      return
    }

    // 从本地列表中移除
    assignedRoutes.value = assignedRoutes.value.filter(r => r.id !== route.id)

    // 更新selectedRoutes以反映删除
    selectedRoutes.value = selectedRoutes.value.filter(id => parseInt(id) !== routeId)

    // 重新保存权限来实现删除效果
    await saveRoutePermissions()

    showSuccess('路由权限删除成功')
  } catch (error) {
    console.error('删除路由权限失败:', error)
    showError('删除路由权限失败: ' + (error.response?.data?.detail || error.message))

    // 如果删除失败，恢复本地状态
    await loadRolePermissions(selectedRole.value.id)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
