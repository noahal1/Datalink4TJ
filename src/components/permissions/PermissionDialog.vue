<template>
  <v-dialog
    v-model="localDialog"
    max-width="600px"
    persistent
    @click:outside="closeDialog"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ isNew ? '创建新权限' : '编辑权限' }}
      </v-card-title>
      
      <v-card-text>
        <v-container>
          <v-form
            ref="form"
            v-model="formValid"
            lazy-validation
          >
            <v-row>
              <!-- 模块选择 -->
              <v-col cols="12" sm="6">
                <v-select
                  v-model="localPermission.module"
                  :items="moduleOptions"
                  item-title="text"
                  item-value="value"
                  label="模块*"
                  required
                  :rules="[v => !!v || '请选择模块']"
                  hint="选择权限所属模块"
                  persistent-hint
                  return-object
                ></v-select>
              </v-col>
              
              <!-- 权限等级选择 -->
              <v-col cols="12" sm="6">
                <v-select
                  v-model="localPermission.level"
                  :items="levelOptions"
                  item-title="text"
                  item-value="value"
                  label="权限等级*"
                  required
                  :rules="[v => !!v || '请选择权限等级']"
                  hint="选择权限等级"
                  persistent-hint
                  return-object
                ></v-select>
              </v-col>
              
              <!-- 部门选择 -->
              <v-col cols="12">
                <v-select
                  v-model="localPermission.department_id"
                  :items="departmentOptions"
                  item-title="text"
                  item-value="value"
                  label="适用部门"
                  hint="限制权限适用的部门，不选择表示适用于所有部门"
                  persistent-hint
                  clearable
                ></v-select>
              </v-col>
              
              <!-- 权限描述 -->
              <v-col cols="12">
                <v-alert
                  color="info"
                  type="info"
                  variant="tonal"
                  class="permission-description"
                >
                  <strong>权限描述：</strong>
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
import { Module, PermissionLevel, PermissionDescriptions } from '../../utils/permissionConstants'
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
      module: '',
      level: '',
      department_id: null
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
const departments = ref([])

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

// 模块选项
const moduleOptions = computed(() => {
  return Object.keys(Module).map(key => ({
    text: PermissionDescriptions.modules[Module[key]] || Module[key],
    value: Module[key]
  }))
})

// 权限等级选项
const levelOptions = computed(() => {
  return Object.keys(PermissionLevel).map(key => ({
    text: PermissionDescriptions.levels[PermissionLevel[key]] || PermissionLevel[key],
    value: PermissionLevel[key]
  }))
})

// 部门选项
const departmentOptions = computed(() => {
  const options = [
    { text: '所有部门', value: null }
  ]
  
  departments.value.forEach(dept => {
    options.push({
      text: dept.name,
      value: dept.id
    })
  })
  
  return options
})

// 权限描述
const permissionDescription = computed(() => {
  if (!localPermission.value.module || !localPermission.value.level) {
    return '请选择模块和权限等级'
  }
  
  const moduleDesc = PermissionDescriptions.modules[localPermission.value.module] || localPermission.value.module
  const levelDesc = PermissionDescriptions.levels[localPermission.value.level] || localPermission.value.level
  
  let departmentDesc = '所有部门'
  if (localPermission.value.department_id) {
    const department = departments.value.find(d => d.id === localPermission.value.department_id)
    departmentDesc = department ? department.name : `部门ID: ${localPermission.value.department_id}`
  }
  
  return `此权限允许用户对${moduleDesc}模块进行${levelDesc}操作，适用于${departmentDesc}。`
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

// 加载部门列表
const loadDepartments = async () => {
  try {
    const response = await api.get('/departments')
    if (response && response.data) {
      departments.value = response.data
    }
  } catch (error) {
    console.error('加载部门列表失败:', error)
  }
}

// 组件挂载时加载部门数据
onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.permission-description {
  margin-top: 10px;
}
</style> 