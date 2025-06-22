<template>
  <v-dialog
    v-model="localDialog"
    max-width="600px"
    persistent
    @click:outside="closeDialog"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ isNew ? '创建新路由权限' : '编辑路由权限' }}
      </v-card-title>
      
      <v-card-text>
        <v-container>
          <v-form
            ref="form"
            v-model="formValid"
            lazy-validation
          >
            <v-row>
              <!-- 权限代码 -->
              <v-col cols="12">
                <v-text-field
                  v-model="localPermission.permission_code"
                  label="权限代码*"
                  required
                  :rules="[v => !!v || '权限代码不能为空']"
                  hint="权限代码，例如：access_dashboard、manage_users"
                  persistent-hint
                ></v-text-field>
              </v-col>
              
              <!-- 路由选择 -->
              <v-col cols="12" sm="6">
                <v-select
                  v-model="localPermission.route_id"
                  :items="routeOptions"
                  item-title="text"
                  item-value="value"
                  label="关联路由"
                  hint="将权限与路由关联"
                  persistent-hint
                  clearable
                ></v-select>
              </v-col>
              
              <!-- 角色选择 -->
              <v-col cols="12" sm="6">
                <v-select
                  v-model="localPermission.role_id"
                  :items="roleOptions"
                  item-title="text"
                  item-value="value"
                  label="关联角色"
                  hint="将权限分配给角色"
                  persistent-hint
                  clearable
                ></v-select>
              </v-col>
              
              <!-- 权限描述 -->
              <v-col cols="12">
                <v-text-field
                  v-model="localPermission.description"
                  label="描述"
                  hint="权限的详细描述"
                  persistent-hint
                ></v-text-field>
              </v-col>
              
              <!-- 权限说明 -->
              <v-col cols="12">
                <v-alert
                  color="info"
                  type="info"
                  variant="tonal"
                  class="permission-description"
                >
                  <strong>权限说明：</strong>
                  <p>{{ permissionDescription }}</p>
                </v-alert>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="closeDialog"
          :disabled="loading"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          @click="savePermission"
          :loading="loading"
          :disabled="!formValid || loading"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { PermissionDescriptions } from '../../utils/permissionConstants'
import api from '../../utils/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  permission: {
    type: Object,
    default: () => ({
      id: null,
      permission_code: '',
      description: '',
      route_id: null,
      role_id: null
    })
  },
  isNew: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:permission', 'save', 'close'])

// 本地表单数据
const localDialog = ref(props.modelValue)
const localPermission = ref({...props.permission})
const formValid = ref(false)
const form = ref(null)
const routes = ref([])
const roles = ref([])

// 监听dialog prop变化
watch(() => props.modelValue, (newVal) => {
  localDialog.value = newVal
})

// 监听localDialog变化
watch(() => localDialog.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听permission prop变化
watch(() => props.permission, (newVal) => {
  localPermission.value = {...newVal}
})

// 路由选项
const routeOptions = computed(() => {
  const options = []
  
  routes.value.forEach(route => {
    options.push({
      text: `${route.name} (${route.path})`,
      value: route.id
    })
  })
  
  return options
})

// 角色选项
const roleOptions = computed(() => {
  const options = []
  
  roles.value.forEach(role => {
    options.push({
      text: role.name,
      value: role.id
    })
  })
  
  return options
})

// 权限描述
const permissionDescription = computed(() => {
  if (!localPermission.value.permission_code) {
    return '请输入权限代码'
  }
  
  // 获取权限描述
  const permDesc = PermissionDescriptions.getDescription(localPermission.value.permission_code)
  
  // 获取路由信息
  let routeDesc = '任何路由'
  if (localPermission.value.route_id) {
    const route = routes.value.find(r => r.id === localPermission.value.route_id)
    routeDesc = route ? `路由 "${route.name}"` : `路由ID: ${localPermission.value.route_id}`
  }
  
  // 获取角色信息
  let roleDesc = '未分配给角色'
  if (localPermission.value.role_id) {
    const role = roles.value.find(r => r.id === localPermission.value.role_id)
    roleDesc = role ? `角色 "${role.name}"` : `角色ID: ${localPermission.value.role_id}`
  }
  
  return `此权限代码 "${localPermission.value.permission_code}" 表示 ${permDesc}，关联到${routeDesc}，${roleDesc}。`
})

// 关闭对话框
const closeDialog = () => {
  localDialog.value = false
  emit('close')
}

// 保存权限
const savePermission = () => {
  if (!form.value.validate()) return
  
  emit('update:permission', localPermission.value)
  emit('save')
}

// 加载路由列表
const loadRoutes = async () => {
  try {
    const response = await api.get('/routes')
    if (response && response.data) {
      routes.value = response.data
    }
  } catch (error) {
    console.error('加载路由列表失败:', error)
  }
}

// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await api.get('/roles')
    if (response && response.data) {
      roles.value = response.data
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadRoutes()
  loadRoles()
})
</script>

<style scoped>
.permission-description {
  margin-top: 10px;
}
</style> 