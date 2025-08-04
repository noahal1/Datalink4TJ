<template>
  <unified-page-template 
    title="路由管理"
    icon="mdi-routes"
    color="primary"
  >
    <template #header-actions>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openModernRouteEditor()"
      >
        创建路由
      </v-btn>
      <v-btn
        color="error"
        prepend-icon="mdi-delete-sweep"
        @click="batchDeleteSelected"
        :disabled="selectedRoutes.length === 0"
      >
        批量删除
      </v-btn>
      <v-btn
        color="info"
        prepend-icon="mdi-export"
        @click="exportRoutes"
      >
        导出
      </v-btn>
      <v-btn
        prepend-icon="mdi-view-list"
        @click="toggleTreeView"
      >
        {{ showTreeView ? '表格视图' : '树形视图' }}
      </v-btn>
    </template>

    <v-row>
      <v-col cols="12">
        <!-- 搜索和过滤器 -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchText"
                  prepend-inner-icon="mdi-magnify"
                  label="搜索路由"
                  placeholder="输入路径、名称或标题搜索..."
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                  @input="onSearchInput"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filterType"
                  :items="[
                    { title: '全部类型', value: 'all' },
                    { title: '页面路由', value: 'page' },
                    { title: '父级菜单', value: 'parent_menu' }
                  ]"
                  label="类型筛选"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>
              <v-col cols="12" md="2">
                <v-select
                  v-model="filterPermission"
                  :items="[
                    { title: '全部权限', value: 'all' },
                    { title: '公开访问', value: 'public' },
                    { title: '需要认证', value: 'auth' },
                    { title: '基于角色', value: 'role' }
                  ]"
                  label="权限筛选"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>
              <v-col cols="12" md="2">
                <v-select
                  v-model="filterGroup"
                  :items="[
                    { title: '全部分组', value: 'all' },
                    { title: '主菜单', value: 'main' },
                    { title: '质量', value: 'qa' },
                    { title: '生产', value: 'production' },
                    { title: '物流', value: 'logistics' },
                    { title: '维修', value: 'maintenance' },
                    { title: 'EHS', value: 'ehs' },
                    { title: '系统', value: 'admin' },
                    { title: '其他', value: 'other' },
                    { title: '工程', value: 'eng' },
                    { title: '人事', value: 'hr' },
                    { title: '财务', value: 'fin' },
                    { title: 'PRS', value: 'prs' },
                    { title: '未分组', value: 'none' }
                  ]"
                  label="分组筛选"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>
              <v-col cols="12" md="2">
                <v-checkbox
                  v-model="showHiddenRoutes"
                  label="显示隐藏路由"
                  density="compact"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 数据展示区域 -->
        <v-card>
          <!-- 表格视图 -->
          <unified-data-table
            v-if="!showTreeView"
            title="路由列表"
            icon="mdi-routes"
            :headers="tableHeaders"
            :items="filteredRoutes"
            :loading="loadingRoutes"
            v-model="selectedRoutes"
          >
            <!-- 自定义列渲染 -->
            <template #item.meta.title="{ item }">
              <div class="d-flex align-center">
                <v-icon v-if="item.meta?.icon" size="small" class="mr-2">
                  {{ item.meta.icon }}
                </v-icon>
                {{ item.meta?.title || item.name }}
              </div>
            </template>

            <template #item.type="{ item }">
              <v-chip
                size="small"
                :color="item.meta?.isParentMenu ? 'info' : 'default'"
                variant="outlined"
              >
                {{ item.meta?.isParentMenu ? '菜单组' : '页面' }}
              </v-chip>
            </template>

            <!-- 分组显示 -->
            <template #item.meta.group="{ item }">
              <div class="d-flex align-center justify-center">
                <v-chip
                  v-if="item.meta?.group"
                  :color="getGroupColor(item.meta.group)"
                  size="small"
                  variant="flat"
                >
                  {{ getGroupLabel(item.meta.group) }}
                </v-chip>
                <span v-else class="text-grey">-</span>
              </div>
            </template>

            <template #item.permission="{ item }">
              <div class="d-flex flex-column">
                <v-chip
                  size="small"
                  :color="getPermissionColor(item)"
                  variant="outlined"
                  class="mb-1"
                >
                  {{ getPermissionText(item) }}
                </v-chip>

                <!-- 显示角色列表 -->
                <div v-if="item.meta?.allowed_roles && item.meta.allowed_roles.length > 0" class="mt-1">
                  <v-tooltip location="bottom">
                    <template #activator="{ props }">
                      <v-chip-group v-bind="props">
                        <v-chip
                          v-for="roleId in item.meta.allowed_roles.slice(0, 2)"
                          :key="roleId"
                          size="x-small"
                          color="primary"
                          variant="outlined"
                        >
                          {{ getRoleName(roleId) }}
                        </v-chip>
                        <v-chip
                          v-if="item.meta.allowed_roles.length > 2"
                          size="x-small"
                          color="grey"
                          variant="outlined"
                        >
                          +{{ item.meta.allowed_roles.length - 2 }}
                        </v-chip>
                      </v-chip-group>
                    </template>
                    <div>
                      <div class="text-subtitle-2 mb-2">可访问的角色:</div>
                      <div v-for="roleId in item.meta.allowed_roles" :key="roleId" class="text-caption">
                        • {{ getRoleName(roleId) }}
                      </div>
                    </div>
                  </v-tooltip>
                </div>
              </div>
            </template>

            <template #item.actions="{ item }">
              <v-btn-group density="compact" variant="text">
                <v-btn @click="openModernRouteEditor(item)" icon size="small">
                  <v-icon>mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="bottom">编辑</v-tooltip>
                </v-btn>
                <v-btn @click="deleteRoute(item)" icon size="small" color="error">
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="bottom">删除</v-tooltip>
                </v-btn>
              </v-btn-group>
            </template>
          </unified-data-table>

          <!-- 树形视图 -->
          <div v-else class="pa-4">
            <route-tree-view
              :routes="routeTree"
              @route-selected="openModernRouteEditor"
              @route-deleted="deleteRoute"
              @route-moved="onRouteMove"
            />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 现代化路由编辑器 -->
    <route-editor
      v-model="routeEditorDialog"
      :route="editingRoute"
      :parent-routes="routeTree"
      :available-components="availableComponents"
      @route-saved="onRouteSaved"
    />
  </unified-page-template>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePermissionStore } from '../stores/permission'
import Message from '../utils/notification'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '../components/UnifiedDataTable.vue'
import RouteEditor from '../components/RouteEditor.vue'
import RouteTreeView from '../components/RouteTreeView.vue'
import RouteManagerService from '../services/RouteManagerService'
import api from '../utils/api'

// 权限存储
const permissionStore = usePermissionStore()

// 开发环境标识
const isDevelopment = import.meta.env.DEV

// 响应式数据
const routesList = ref([])
const selectedRoutes = ref([])
const loadingRoutes = ref(false)
const showTreeView = ref(false)
const showHiddenRoutes = ref(false)

// 搜索和筛选
const searchText = ref('')
const filterType = ref('all')
const filterPermission = ref('all')
const filterGroup = ref('all')

// 对话框状态
const routeEditorDialog = ref(false)
const editingRoute = ref(null)

// 组件和角色数据
const availableComponents = ref([])
const availableRoles = ref([])

// 表格配置
const tableHeaders = [
  { title: '路径', key: 'path', align: 'start', sortable: true },
  { title: '名称', key: 'name', align: 'start', sortable: true },
  { title: '标题', key: 'meta.title', align: 'start', sortable: true , width: '80px'},
  { title: '组件', key: 'component', align: 'start' },
  { title: '分组', key: 'meta.group', align: 'center', width: '60px' },
  { title: '类型', key: 'type', align: 'center', width: '60px' },
  { title: '权限', key: 'permission', align: 'center', width: '50px' },
  { title: '排序', key: 'sort_order', align: 'center', width: '50px' },
  { title: '操作', key: 'actions', align: 'center', sortable: false, width: '100px' }
]

// 计算属性
const filteredRoutes = computed(() => {
  // 应用过滤器
  RouteManagerService.setFilter('search', searchText.value)
  RouteManagerService.setFilter('type', filterType.value)
  RouteManagerService.setFilter('showHidden', showHiddenRoutes.value)
  
  let filtered = RouteManagerService.computed.filteredRoutes.value

  // 权限过滤
  if (filterPermission.value !== 'all') {
    filtered = filtered.filter(route => {
      if (filterPermission.value === 'public') {
        return route.meta?.public === true
      } else if (filterPermission.value === 'auth') {
        return route.meta?.requiresAuth === true && !route.meta?.public
      } else if (filterPermission.value === 'role') {
        return route.meta?.isRoleBased === true
      }
      return true
    })
  }

  // 分组过滤
  if (filterGroup.value !== 'all') {
    filtered = filtered.filter(route => {
      if (filterGroup.value === 'none') {
        return !route.meta?.group
      } else {
        return route.meta?.group === filterGroup.value
      }
    })
  }

  return filtered
})

const routeTree = computed(() => RouteManagerService.computed.routeTree.value)

// 方法
const onSearchInput = () => {
  // 搜索逻辑已在计算属性中处理
}

const applyFilters = () => {
  // 过滤逻辑已在计算属性中处理
}

const openModernRouteEditor = (route = null) => {
  editingRoute.value = route
  routeEditorDialog.value = true
}

const deleteRoute = async (route) => {
  const confirmed = confirm(`确定要删除路由 "${route.meta?.title || route.name}" 吗？`)
  if (!confirmed) return

  try {
    await RouteManagerService.deleteRoute(route.id)
    Message.success('路由删除成功')
    await loadRoutes()
  } catch (error) {
    Message.error('删除路由失败: ' + error.message)
  }
}

const batchDeleteSelected = async () => {
  if (selectedRoutes.value.length === 0) {
    Message.warning('请选择要删除的路由')
    return
  }

  const confirmed = confirm(`确定要删除选中的 ${selectedRoutes.value.length} 个路由吗？`)
  if (!confirmed) return

  try {
    const routeIds = selectedRoutes.value.map(route => route.id)
    await RouteManagerService.batchDeleteRoutes(routeIds)
    Message.success(`成功删除 ${selectedRoutes.value.length} 个路由`)
    selectedRoutes.value = []
    await loadRoutes()
  } catch (error) {
    Message.error('批量删除失败: ' + error.message)
  }
}

const exportRoutes = () => {
  const data = {
    routes: filteredRoutes.value,
    exportTime: new Date().toISOString(),
    version: '1.0'
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `routes-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  Message.success('路由配置导出成功')
}

const toggleTreeView = () => {
  showTreeView.value = !showTreeView.value
}

const onRouteMove = async (route, newParentId) => {
  try {
    await RouteManagerService.updateRoute(route.id, {
      ...route,
      parentId: newParentId
    })
    Message.success('路由移动成功')
    await loadRoutes()
  } catch (error) {
    Message.error('路由移动失败: ' + error.message)
  }
}

const getPermissionColor = (route) => {
  if (route.meta?.public) return 'success'
  if (route.meta?.requiresAuth && route.meta?.allowed_roles?.length > 0) return 'info'
  if (route.meta?.requiresAuth) return 'warning'
  return 'default'
}

const getPermissionText = (route) => {
  if (route.meta?.public) return '公开'
  if (route.meta?.allowed_roles && route.meta.allowed_roles.length > 0) {
    return `角色权限 (${route.meta.allowed_roles.length})`
  }
  if (route.meta?.requiresAuth) return '需要认证'
  return '未设置'
}

const getRoleName = (roleId) => {
  const role = availableRoles.value.find(r => r.id === roleId)
  return role ? role.name : `角色ID: ${roleId}`
}

// 获取分组颜色
const getGroupColor = (group) => {
  const groupColors = {
    'main': 'primary',
    'qa': 'success',
    'production': 'warning',
    'logistics': 'info',
    'maintenance': 'orange',
    'ehs': 'green',
    'admin': 'purple',
    'other': 'grey'
  }
  return groupColors[group] || 'grey'
}

// 获取分组标签
const getGroupLabel = (group) => {
  const groupLabels = {
    'main': '主菜单',
    'qa': '质量',
    'production': '生产',
    'logistics': '物流',
    'maintenance': '维修',
    'ehs': 'EHS',
    'admin': '系统',
    'hr': '人事',
    'fin': '财务',
    'prs': '冲压',
    'eng': '工程',
    'other': '其他'
  }
  return groupLabels[group] || group
}

const onRouteSaved = async (route) => {
  Message.success(route.id ? '路由更新成功' : '路由创建成功')
  routeEditorDialog.value = false
  editingRoute.value = null
  await loadRoutes()
}

// 加载路由数据
const loadRoutes = async () => {
  try {
    loadingRoutes.value = true
    const response = await api.get('/routes')
    routesList.value = response.data || []
    
    // 同步到现代化服务
    RouteManagerService.state.routes = routesList.value
  } catch (error) {
    Message.error('加载路由失败: ' + error.message)
  } finally {
    loadingRoutes.value = false
  }
}

// 加载组件列表
const loadAvailableComponents = async () => {
  try {
    const response = await api.get('/routes/components')
    if (response && response.data && response.data.components) {
      availableComponents.value = response.data.components
    } else if (response && response.data && Array.isArray(response.data)) {
      availableComponents.value = response.data
    } else {
      availableComponents.value = []
    }
  } catch (error) {
    console.error('加载组件失败:', error)
    availableComponents.value = []
  }
}

// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await api.get('/roles')
    availableRoles.value = response.data || []
  } catch (error) {
    console.error('加载角色失败:', error)
    availableRoles.value = []
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await Promise.all([
    loadRoutes(),
    loadAvailableComponents(),
    loadRoles()
  ])
})
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-btn-group {
  box-shadow: none;
}
</style>
