<template>
  <v-dialog v-model="dialog" max-width="800" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">
          {{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}
        </v-icon>
        {{ isEditing ? '编辑路由' : '创建路由' }}
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="closeDialog" :disabled="saving">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <!-- 基本信息 -->
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 mb-4">基本信息</h3>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                label="路由名称"
                placeholder="例如: Dashboard"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                :error-messages="getFieldErrors('name')"
                @input="validateField('name')"
              >
                <template #append-inner>
                  <v-tooltip location="bottom">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" color="grey">mdi-help-circle-outline</v-icon>
                    </template>
                    路由的唯一标识符，用于程序内部引用
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.meta.title"
                label="显示标题"
                placeholder="例如: 仪表板"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                :error-messages="getFieldErrors('title')"
                @input="validateField('title')"
              >
                <template #append-inner>
                  <v-tooltip location="bottom">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" color="grey">mdi-help-circle-outline</v-icon>
                    </template>
                    在菜单和页面标题中显示的名称
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="routeType"
                :items="routeTypeOptions"
                label="路由类型"
                variant="outlined"
                density="comfortable"
                @update:model-value="onRouteTypeChange"
              ></v-select>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.parentId"
                :items="parentOptions"
                item-title="title"
                item-value="id"
                label="父路由"
                placeholder="选择父路由（可选）"
                variant="outlined"
                density="comfortable"
                clearable
              ></v-select>
            </v-col>
          </v-row>

          <!-- 路径和组件配置 -->
          <v-row v-if="routeType === 'page'">
            <v-col cols="12">
              <h3 class="text-h6 mb-4">路径和组件</h3>
            </v-col>
            
            <v-col cols="12" md="8">
              <v-text-field
                v-model="formData.path"
                label="路由路径"
                placeholder="例如: /dashboard"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.pathFormat]"
                :error-messages="getFieldErrors('path')"
                @input="validateField('path')"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.sortOrder"
                label="排序"
                type="number"
                variant="outlined"
                density="comfortable"
                hint="数字越小排序越靠前"
                persistent-hint
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="formData.component"
                :items="availableComponents"
                label="组件"
                placeholder="选择组件"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                :error-messages="getFieldErrors('component')"
                @update:model-value="validateField('component')"
              >
                <template #append>
                  <v-btn
                    icon
                    variant="text"
                    color="secondary"
                    @click="refreshComponents"
                    :loading="loadingComponents"
                  >
                    <v-icon>mdi-refresh</v-icon>
                    <v-tooltip activator="parent" location="bottom">
                      刷新组件列表
                    </v-tooltip>
                  </v-btn>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <!-- 显示配置 -->
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 mb-4">显示配置</h3>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.meta.icon"
                label="图标"
                placeholder="例如: mdi-home"
                variant="outlined"
                density="comfortable"
              >
                <template #prepend-inner>
                  <v-icon v-if="formData.meta.icon">{{ formData.meta.icon }}</v-icon>
                </template>
              </v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.meta.group"
                :items="groupOptions"
                label="导航分组"
                placeholder="选择导航分组"
                variant="outlined"
                density="comfortable"
                clearable
                hint="用于在导航菜单中分组显示"
                persistent-hint
              ></v-select>
            </v-col>

            <v-col cols="12">
              <div class="d-flex align-center">
                <v-checkbox
                  v-model="formData.meta.hideInMenu"
                  label="在菜单中隐藏"
                  color="primary"
                  hide-details
                  class="mr-6"
                ></v-checkbox>
              </div>
            </v-col>
          </v-row>

          <!-- 权限配置 -->
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 mb-4">权限配置</h3>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="accessType"
                :items="accessTypeOptions"
                label="访问类型"
                variant="outlined"
                density="comfortable"
                @update:model-value="onAccessTypeChange"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <div class="d-flex align-center h-100">
                <v-checkbox
                  v-model="formData.meta.requiresAuth"
                  label="需要认证"
                  color="primary"
                  :disabled="accessType === 'public'"
                  hide-details
                ></v-checkbox>
              </div>
            </v-col>

            <!-- 角色权限配置 -->
            <v-col cols="12" v-if="accessType === 'role_based'">
              <v-card variant="outlined" class="mt-2">
                <v-card-title class="text-subtitle-1 d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
                  角色权限管理
                  <v-spacer></v-spacer>
                  <v-chip
                    :color="selectedRoles.length > 0 ? 'success' : 'warning'"
                    size="small"
                    variant="outlined"
                  >
                    已选择 {{ selectedRoles.length }} 个角色
                  </v-chip>
                </v-card-title>

                <v-card-text>
                  <v-alert
                    v-if="availableRoles.length === 0"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                  >
                    <v-icon>mdi-information</v-icon>
                    <div class="ml-3">
                      <strong>暂无可用角色</strong>
                      <p class="mt-1">请先在角色管理中创建角色，然后刷新此页面。</p>
                    </div>
                  </v-alert>

                  <div v-else>
                    <!-- 角色搜索 -->
                    <v-text-field
                      v-model="roleSearchText"
                      prepend-inner-icon="mdi-magnify"
                      label="搜索角色"
                      placeholder="输入角色名称搜索..."
                      variant="outlined"
                      density="compact"
                      clearable
                      hide-details
                      class="mb-4"
                    ></v-text-field>

                    <!-- 角色列表 -->
                    <v-row dense>
                      <v-col
                        v-for="role in filteredRoles"
                        :key="role.id"
                        cols="12"
                        md="6"
                        lg="4"
                      >
                        <v-card
                          :class="[
                            'role-card cursor-pointer',
                            { 'role-selected': isRoleSelected(role.id) }
                          ]"
                          variant="outlined"
                          @click="toggleRole(role.id)"
                          :color="isRoleSelected(role.id) ? 'primary' : ''"
                        >
                          <v-card-text class="d-flex align-center pa-3">
                            <v-checkbox
                              :model-value="isRoleSelected(role.id)"
                              color="primary"
                              hide-details
                              @click.stop
                              @change="toggleRole(role.id)"
                            ></v-checkbox>
                            <div class="ml-3 flex-grow-1">
                              <div class="text-subtitle-2 font-weight-medium">
                                {{ role.name }}
                              </div>
                              <div class="text-caption text-grey">
                                {{ role.description || '无描述' }}
                              </div>
                            </div>
                            <v-icon
                              v-if="isRoleSelected(role.id)"
                              color="primary"
                              size="small"
                            >
                              mdi-check-circle
                            </v-icon>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>

                    <!-- 快速操作 -->
                    <v-divider class="my-4"></v-divider>
                    <div class="d-flex align-center">
                      <v-btn
                        size="small"
                        variant="outlined"
                        @click="selectAllRoles"
                        :disabled="filteredRoles.length === 0"
                      >
                        全选
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="outlined"
                        @click="clearAllRoles"
                        class="ml-2"
                        :disabled="selectedRoles.length === 0"
                      >
                        清空
                      </v-btn>
                      <v-spacer></v-spacer>
                      <div class="text-caption text-grey">
                        <v-icon size="small" class="mr-1">mdi-information</v-icon>
                        选择的角色将能够访问此路由
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 当前权限状态显示 -->
            <v-col cols="12" v-if="isEditing">
              <v-card variant="outlined" color="info">
                <v-card-title class="text-subtitle-1 d-flex align-center">
                  <v-icon class="mr-2" color="info">mdi-shield-check</v-icon>
                  当前权限状态
                </v-card-title>
                <v-card-text>
                  <div class="d-flex align-center">
                    <v-icon
                      :color="getCurrentPermissionColor()"
                      class="mr-2"
                    >
                      {{ getCurrentPermissionIcon() }}
                    </v-icon>
                    <div>
                      <div class="text-subtitle-2">
                        {{ getCurrentPermissionText() }}
                      </div>
                      <div class="text-caption text-grey">
                        {{ getCurrentPermissionDescription() }}
                      </div>
                    </div>
                  </div>

                  <!-- 显示当前有权限的角色 -->
                  <div v-if="currentRouteRoles.length > 0" class="mt-3">
                    <div class="text-caption text-grey mb-2">当前可访问的角色:</div>
                    <v-chip-group>
                      <v-chip
                        v-for="role in currentRouteRoles"
                        :key="role.id"
                        size="small"
                        color="success"
                        variant="outlined"
                      >
                        <v-icon size="small" class="mr-1">mdi-account</v-icon>
                        {{ role.name }}
                      </v-chip>
                    </v-chip-group>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- 实时验证结果 -->
          <v-row v-if="validationResult && !validationResult.isValid">
            <v-col cols="12">
              <v-card color="error" variant="tonal">
                <v-card-title class="text-subtitle-1">
                  <v-icon class="mr-2">mdi-alert-circle</v-icon>
                  验证错误
                </v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item
                      v-for="error in validationResult.errors"
                      :key="error"
                      class="px-0"
                    >
                      <template #prepend>
                        <v-icon color="error" size="small">mdi-alert-circle</v-icon>
                      </template>
                      <v-list-item-title>{{ error }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="text"
          @click="closeDialog"
          :disabled="saving"
        >
          取消
        </v-btn>
        
        <v-btn
          color="primary"
          @click="handleSubmit"
          :loading="saving"
          :disabled="!formValid || (validationResult && !validationResult.isValid)"
        >
          <v-icon class="mr-1">mdi-content-save</v-icon>
          {{ isEditing ? '更新' : '创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import RouteManagerService, { DEFAULT_ROUTE_CONFIG, RouteType } from '../services/RouteManagerService'
import RouteValidationService from '../services/RouteValidationService'
import Message from '../utils/notification'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  route: {
    type: Object,
    default: null
  },
  parentRoutes: {
    type: Array,
    default: () => []
  },
  availableComponents: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'route-saved'])

// 响应式数据
const dialog = ref(props.modelValue)
const formRef = ref(null)
const formValid = ref(false)
const saving = ref(false)
const loadingComponents = ref(false)
const formData = ref({ ...DEFAULT_ROUTE_CONFIG })
const routeType = ref(RouteType.PAGE)
const accessType = ref('authenticated')
const validationResult = ref(null)
const fieldErrors = ref(new Map())

// 角色权限相关数据
const availableRoles = ref([])
const selectedRoles = ref([])
const currentRouteRoles = ref([])
const roleSearchText = ref('')

// 选项数据
const routeTypeOptions = [
  { title: '页面路由', value: RouteType.PAGE },
  { title: '父级菜单', value: RouteType.PARENT_MENU }
]

const accessTypeOptions = [
  { title: '公开访问', value: 'public' },
  { title: '所有登录用户', value: 'authenticated' },
  { title: '基于角色权限', value: 'role_based' }
]

// 导航分组选项
const groupOptions = [
  { title: '主菜单', value: 'main' },
  { title: '质量', value: 'qa' },
  { title: '生产', value: 'production' },
  { title: '物流', value: 'logistics' },
  { title: '维修', value: 'maintenance' },
  { title: 'EHS', value: 'ehs' },
  { title: 'GMO', value: 'gmo' },
  { title: '系统管理', value: 'admin' },
  { title: '工程', value: 'eng' },
  { title: '人事', value: 'hr' },
  { title: '其他', value: 'other' }
]

// 验证规则
const rules = {
  required: (v) => (v !== undefined && v !== null && v !== '') || '此字段为必填项',
  pathFormat: (v) => {
    if (!v) return true
    return /^\/[a-zA-Z0-9\-_/:]*$/.test(v) || '路径格式不正确'
  }
}

// 计算属性
const isEditing = computed(() => !!props.route?.id)

const availableComponents = computed(() => {
  // 优先使用传入的组件列表，如果没有则使用服务中的组件列表
  if (props.availableComponents && props.availableComponents.length > 0) {
    return props.availableComponents
  }
  return RouteManagerService.state.components || []
})

const parentOptions = computed(() => {
  const options = [{ id: null, title: '顶级路由' }]
  
  const processRoutes = (routes, prefix = '') => {
    routes.forEach(route => {
      if (route.id !== formData.value.id) {
        options.push({
          id: route.id,
          title: prefix + (route.meta?.title || route.name)
        })
        
        if (route.children) {
          processRoutes(route.children, prefix + '  ')
        }
      }
    })
  }
  
  processRoutes(props.parentRoutes)
  return options
})

// 角色相关计算属性
const filteredRoles = computed(() => {
  if (!roleSearchText.value) {
    return availableRoles.value
  }
  const search = roleSearchText.value.toLowerCase()
  return availableRoles.value.filter(role =>
    role.name.toLowerCase().includes(search) ||
    (role.description && role.description.toLowerCase().includes(search))
  )
})

// 防抖验证
const debouncedValidate = debounce(async () => {
  validationResult.value = RouteValidationService.validateRoute(formData.value, {
    existingRoutes: RouteManagerService.state.routes,
    availableComponents: availableComponents.value
  })
}, 300)

// 方法
const validateField = (fieldName) => {
  fieldErrors.value.delete(fieldName)
  debouncedValidate()
}

const getFieldErrors = (fieldName) => {
  return fieldErrors.value.get(fieldName) || []
}

const onRouteTypeChange = (type) => {
  if (type === RouteType.PARENT_MENU) {
    formData.value.path = ''
    formData.value.component = ''
    formData.value.meta.isParentMenu = true
  } else {
    formData.value.meta.isParentMenu = false
  }
  debouncedValidate()
}

const onAccessTypeChange = (type) => {
  switch (type) {
    case 'public':
      formData.value.meta.public = true
      formData.value.meta.requiresAuth = false
      formData.value.meta.allowed_roles = []
      selectedRoles.value = []
      break
    case 'authenticated':
      formData.value.meta.public = false
      formData.value.meta.requiresAuth = true
      formData.value.meta.permission = '*'
      formData.value.meta.allowed_roles = []
      selectedRoles.value = []
      break
    case 'role_based':
      formData.value.meta.public = false
      formData.value.meta.requiresAuth = true
      formData.value.meta.permission = null
      // 保持现有的角色选择
      if (formData.value.meta.allowed_roles) {
        selectedRoles.value = [...formData.value.meta.allowed_roles]
      }
      break
  }
  debouncedValidate()
}

const refreshComponents = async () => {
  loadingComponents.value = true
  try {
    await RouteManagerService.loadComponents()
  } finally {
    loadingComponents.value = false
  }
}

const handleSubmit = async () => {
  if (!formValid.value) return
  
  saving.value = true
  try {
    let result
    if (isEditing.value) {
      result = await RouteManagerService.updateRoute(formData.value.id, formData.value)
    } else {
      result = await RouteManagerService.createRoute(formData.value)
    }
    
    emit('route-saved', result)
    closeDialog()
  } catch (error) {
    console.error('保存路由失败:', error)

    // 显示错误消息给用户
    const errorMessage = error.response?.data?.detail || error.message || '保存路由失败'
    Message.error(errorMessage)
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
}

const initializeForm = () => {
  if (props.route) {
    formData.value = { ...props.route }
    routeType.value = props.route.meta?.isParentMenu ? RouteType.PARENT_MENU : RouteType.PAGE

    if (props.route.meta?.public) {
      accessType.value = 'public'
    } else if (props.route.meta?.permission === '*') {
      accessType.value = 'authenticated'
    } else {
      accessType.value = 'role_based'
    }

    // 初始化选中的角色
    if (props.route.meta?.allowed_roles) {
      selectedRoles.value = [...props.route.meta.allowed_roles]
    } else {
      selectedRoles.value = []
    }
  } else {
    formData.value = { ...DEFAULT_ROUTE_CONFIG }
    routeType.value = RouteType.PAGE
    accessType.value = 'authenticated'
    selectedRoles.value = []
  }

  // 初始化角色权限
  loadRoles()
  loadCurrentRouteRoles()
}

// 角色权限相关方法
const loadRoles = async () => {
  try {
    availableRoles.value = RouteManagerService.state.roles || []
    if (availableRoles.value.length === 0) {
      await RouteManagerService.loadRoles()
      availableRoles.value = RouteManagerService.state.roles || []
    }
  } catch (error) {
    console.error('加载角色失败:', error)
  }
}

const loadCurrentRouteRoles = async () => {
  if (!props.route?.id) {
    currentRouteRoles.value = []
    return
  }

  try {
    // 这里应该调用 API 获取当前路由的角色权限
    // 暂时使用模拟数据
    currentRouteRoles.value = availableRoles.value.filter(role =>
      formData.value.meta?.allowed_roles?.includes(role.id)
    )
  } catch (error) {
    console.error('加载当前路由角色失败:', error)
  }
}

const isRoleSelected = (roleId) => {
  return selectedRoles.value.includes(roleId)
}

const toggleRole = (roleId) => {
  const index = selectedRoles.value.indexOf(roleId)
  if (index > -1) {
    selectedRoles.value.splice(index, 1)
  } else {
    selectedRoles.value.push(roleId)
  }

  // 更新表单数据
  formData.value.meta.allowed_roles = [...selectedRoles.value]
  debouncedValidate()
}

const selectAllRoles = () => {
  selectedRoles.value = filteredRoles.value.map(role => role.id)
  formData.value.meta.allowed_roles = [...selectedRoles.value]
  debouncedValidate()
}

const clearAllRoles = () => {
  selectedRoles.value = []
  formData.value.meta.allowed_roles = []
  debouncedValidate()
}

const getCurrentPermissionColor = () => {
  if (accessType.value === 'public') return 'success'
  if (accessType.value === 'authenticated') return 'info'
  if (accessType.value === 'role_based') {
    return selectedRoles.value.length > 0 ? 'warning' : 'error'
  }
  return 'grey'
}

const getCurrentPermissionIcon = () => {
  if (accessType.value === 'public') return 'mdi-earth'
  if (accessType.value === 'authenticated') return 'mdi-account-check'
  if (accessType.value === 'role_based') return 'mdi-account-group'
  return 'mdi-help'
}

const getCurrentPermissionText = () => {
  if (accessType.value === 'public') return '公开访问'
  if (accessType.value === 'authenticated') return '需要登录'
  if (accessType.value === 'role_based') {
    return selectedRoles.value.length > 0
      ? `基于角色权限 (${selectedRoles.value.length} 个角色)`
      : '基于角色权限 (未选择角色)'
  }
  return '未设置'
}

const getCurrentPermissionDescription = () => {
  if (accessType.value === 'public') return '任何用户都可以访问此路由'
  if (accessType.value === 'authenticated') return '只有登录用户可以访问此路由'
  if (accessType.value === 'role_based') {
    return selectedRoles.value.length > 0
      ? '只有选定角色的用户可以访问此路由'
      : '请选择至少一个角色'
  }
  return '请配置访问权限'
}

// 监听器
watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
  if (newVal) {
    initializeForm()
  }
})

watch(() => props.route, initializeForm, { immediate: true })

watch(formData, debouncedValidate, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  initializeForm()
})
</script>

<style scoped>
.v-card {
  max-height: 90vh;
  overflow-y: auto;
}

.role-card {
  transition: all 0.2s ease;
  cursor: pointer;
}

.role-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.role-selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
