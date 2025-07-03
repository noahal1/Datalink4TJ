<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-matrix</v-icon>
      角色路由访问权限矩阵
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="refreshMatrix" :loading="loading" class="mr-2">
        <v-icon left>mdi-refresh</v-icon>
        刷新
      </v-btn>
      <v-btn color="success" @click="openBatchDialog" :disabled="!roles.length || !routes.length">
        <v-icon left>mdi-account-cog</v-icon>
        批量设置
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-alert type="info" class="mb-4">
        <strong>简化权限系统：</strong>基于角色的路由访问控制，权限规则由系统预定义。
      </v-alert>

      <!-- 权限矩阵表格 -->
      <v-data-table
        :headers="matrixHeaders"
        :items="matrixData"
        :loading="loading"
        class="elevation-1"
        item-key="roleId"
        density="compact"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>权限矩阵</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-chip color="success" class="mr-2">
              {{ roles.length }} 个角色
            </v-chip>
            <v-chip color="info">
              {{ routes.length }} 个路由
            </v-chip>
          </v-toolbar>
        </template>

        <!-- 角色名称列 -->
        <template v-slot:item.roleName="{ item }">
          <v-chip :color="getRoleColor(item.roleName)" dark size="small">
            {{ item.roleName }}
          </v-chip>
        </template>

        <!-- 路由访问权限列 -->
        <template v-for="route in routes" :key="route.id" v-slot:[`item.route_${route.id}`]="{ item }">
          <v-checkbox
            :model-value="item[`route_${route.id}`]"
            @update:model-value="togglePermission(item.roleId, route.id, $event)"
            :loading="savingPermissions"
            hide-details
            density="compact"
            color="success"
          />
        </template>
      </v-data-table>

      <!-- 统计信息 -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="text-h6">
              <v-icon class="mr-2">mdi-account-group</v-icon>
              角色统计
            </v-card-title>
            <v-card-text>
              <div v-for="role in roles" :key="role.id" class="d-flex justify-space-between mb-2">
                <span>{{ role.name }}</span>
                <v-chip size="small" :color="getAccessCountColor(getRouteAccessCount(role.id))">
                  {{ getRouteAccessCount(role.id) }} / {{ routes.length }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="text-h6">
              <v-icon class="mr-2">mdi-routes</v-icon>
              路由统计
            </v-card-title>
            <v-card-text>
              <div v-for="route in routes" :key="route.id" class="d-flex justify-space-between mb-2">
                <span>{{ route.name }}</span>
                <v-chip size="small" :color="getRoleAccessCountColor(getRoleAccessCount(route.id))">
                  {{ getRoleAccessCount(route.id) }} / {{ roles.length }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 批量设置对话框 -->
    <v-dialog v-model="batchDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-account-cog</v-icon>
          批量设置角色权限
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="selectedRole"
                :items="roles"
                item-title="name"
                item-value="id"
                label="选择角色"
                prepend-icon="mdi-account"
                variant="outlined"
                @update:model-value="loadRoleRoutes"
              />
            </v-col>

            <v-col cols="12" v-if="selectedRole">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  选择可访问的路由
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12">
                      <v-btn-toggle v-model="selectAllMode" mandatory class="mb-3">
                        <v-btn value="none" size="small">全不选</v-btn>
                        <v-btn value="all" size="small">全选</v-btn>
                        <v-btn value="basic" size="small">基础权限</v-btn>
                      </v-btn-toggle>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <div class="route-checkboxes">
                        <v-checkbox
                          v-for="route in routes"
                          :key="route.id"
                          v-model="selectedRoutes"
                          :value="route.id"
                          :label="route.name"
                          hide-details
                          density="compact"
                          class="mb-1"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeBatchDialog">取消</v-btn>
          <v-btn
            color="primary"
            @click="saveBatchPermissions"
            :loading="savingBatch"
            :disabled="!selectedRole || selectedRoutes.length === 0"
          >
            保存权限
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification'
import api from '../../utils/api'

const { showSuccess, showError } = useNotification()

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['refresh'])

// 状态变量
const roles = ref([])
const routes = ref([])
const accessMatrix = ref([])
const savingPermissions = ref(false)

// 批量设置相关状态
const batchDialog = ref(false)
const selectedRole = ref(null)
const selectedRoutes = ref([])
const selectAllMode = ref('none')
const savingBatch = ref(false)

// 计算属性
const matrixHeaders = computed(() => {
  const baseHeaders = [
    { title: '角色', key: 'roleName', sortable: true, width: '150px' }
  ]

  // 为每个路由添加一列
  const routeHeaders = routes.value.map(route => ({
    title: route.name,
    key: `route_${route.id}`,
    sortable: false,
    width: '100px',
    align: 'center'
  }))

  return [...baseHeaders, ...routeHeaders]
})

const matrixData = computed(() => {
  return roles.value.map((role, roleIndex) => {
    const rowData = {
      roleId: role.id,
      roleName: role.name
    }

    // 为每个路由添加访问权限字段
    routes.value.forEach((route, routeIndex) => {
      rowData[`route_${route.id}`] = accessMatrix.value[roleIndex]?.[routeIndex] || false
    })

    return rowData
  })
})

// 方法
const refreshMatrix = async () => {
  try {
    const response = await api.get('/permissions/routes-matrix')
    const matrix = response.data

    roles.value = matrix.roles || []
    routes.value = matrix.routes || []
    accessMatrix.value = matrix.access_matrix || []

    showSuccess('权限矩阵刷新成功')
    emit('refresh')
  } catch (error) {
    console.error('刷新权限矩阵失败:', error)
    showError('刷新权限矩阵失败: ' + (error.response?.data?.detail || error.message))
  }
}

// 切换权限
const togglePermission = async (roleId, routeId, hasAccess) => {
  try {
    savingPermissions.value = true

    console.log(`切换权限: 角色${roleId}, 路由${routeId}, 权限${hasAccess}`)

    // 获取当前角色的所有可访问路由
    const roleIndex = roles.value.findIndex(r => r.id === roleId)
    if (roleIndex === -1) {
      throw new Error('找不到指定角色')
    }

    // 构建新的路由权限列表
    const currentPermissions = accessMatrix.value[roleIndex] || []
    const newRouteIds = []

    routes.value.forEach((route, index) => {
      const shouldHaveAccess = route.id === routeId ? hasAccess : currentPermissions[index]
      if (shouldHaveAccess) {
        newRouteIds.push(route.id)
      }
    })

    console.log(`角色 ${roleId} 的新权限路由列表:`, newRouteIds)

    // 调用API保存权限
    await api.put(`/permissions/roles/${roleId}/routes`, {
      route_ids: newRouteIds
    })

    // 更新本地状态
    accessMatrix.value[roleIndex][routes.value.findIndex(r => r.id === routeId)] = hasAccess

    showSuccess(`权限设置成功`)

  } catch (error) {
    console.error('设置权限失败:', error)
    showError('设置权限失败: ' + (error.response?.data?.detail || error.message))

    // 刷新矩阵以恢复正确状态
    await refreshMatrix()
  } finally {
    savingPermissions.value = false
  }
}

// 批量设置相关方法
const openBatchDialog = () => {
  batchDialog.value = true
  selectedRole.value = null
  selectedRoutes.value = []
  selectAllMode.value = 'none'
}

const closeBatchDialog = () => {
  batchDialog.value = false
  selectedRole.value = null
  selectedRoutes.value = []
}

const loadRoleRoutes = () => {
  if (!selectedRole.value) {
    selectedRoutes.value = []
    return
  }

  // 加载当前角色的权限
  const roleIndex = roles.value.findIndex(r => r.id === selectedRole.value)
  if (roleIndex !== -1 && accessMatrix.value[roleIndex]) {
    const currentRoutes = []
    routes.value.forEach((route, index) => {
      if (accessMatrix.value[roleIndex][index]) {
        currentRoutes.push(route.id)
      }
    })
    selectedRoutes.value = currentRoutes
  }
}

// 监听选择模式变化
watch(selectAllMode, (newMode) => {
  if (!selectedRole.value) return

  switch (newMode) {
    case 'none':
      selectedRoutes.value = []
      break
    case 'all':
      selectedRoutes.value = routes.value.map(r => r.id)
      break
    case 'basic':
      // 基础权限：Dashboard, Events
      const basicPaths = ['/dashboard', '/events']
      selectedRoutes.value = routes.value
        .filter(r => basicPaths.includes(r.path))
        .map(r => r.id)
      break
  }
})

const saveBatchPermissions = async () => {
  try {
    savingBatch.value = true

    console.log(`批量设置权限: 角色${selectedRole.value}, 路由${selectedRoutes.value}`)

    // 调用API保存权限
    await api.put(`/permissions/roles/${selectedRole.value}/routes`, {
      route_ids: selectedRoutes.value
    })

    showSuccess(`角色权限批量设置成功`)

    // 刷新矩阵
    await refreshMatrix()

    // 关闭对话框
    closeBatchDialog()

  } catch (error) {
    console.error('批量设置权限失败:', error)
    showError('批量设置权限失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    savingBatch.value = false
  }
}

// 获取角色颜色
const getRoleColor = (roleName) => {
  const colorMap = {
    '超级管理员': 'red',
    '管理员': 'purple',
    '部门负责人': 'blue',
    '班组负责人': 'green',
    '普通用户': 'grey'
  }
  return colorMap[roleName] || 'primary'
}

// 获取角色的路由访问数量
const getRouteAccessCount = (roleId) => {
  const roleIndex = roles.value.findIndex(r => r.id === roleId)
  if (roleIndex === -1) return 0
  return accessMatrix.value[roleIndex]?.filter(Boolean).length || 0
}

// 获取路由的角色访问数量
const getRoleAccessCount = (routeId) => {
  const routeIndex = routes.value.findIndex(r => r.id === routeId)
  if (routeIndex === -1) return 0
  return accessMatrix.value.filter(roleAccess => roleAccess[routeIndex]).length
}

// 获取访问数量颜色
const getAccessCountColor = (count) => {
  const total = routes.value.length
  const ratio = count / total
  if (ratio >= 0.8) return 'success'
  if (ratio >= 0.5) return 'warning'
  return 'error'
}

// 获取路由访问数量颜色
const getRoleAccessCountColor = (count) => {
  const total = roles.value.length
  const ratio = count / total
  if (ratio >= 0.8) return 'success'
  if (ratio >= 0.5) return 'warning'
  return 'error'
}

// 初始化
onMounted(() => {
  refreshMatrix()
})
</script>

<style scoped>
.v-data-table {
  font-size: 0.875rem;
}

.v-chip {
  font-size: 0.75rem;
}

.route-checkboxes {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}

.route-checkboxes .v-checkbox {
  margin-bottom: 4px;
}

.v-btn-toggle {
  width: 100%;
}

.v-btn-toggle .v-btn {
  flex: 1;
}
</style>
