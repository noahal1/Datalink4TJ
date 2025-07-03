<template>
  <v-dialog
    v-model="localDialog"
    max-width="700px"
    persistent
    @click:outside="closeDialog"
  >
    <v-card>
      <v-card-title class="text-h5">
        <span>为 {{ user.name }} 分配角色</span>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pt-4">
        <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <div v-else>
          <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">
            {{ errorMessage }}
          </v-alert>
          
          <v-card class="pa-2 mb-4" variant="outlined">
            <v-card-title class="text-subtitle-1">用户信息</v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <div><strong>用户名:</strong> {{ user.name }}</div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div><strong>部门:</strong> {{ user.department?.name || '未分配' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          
          <div class="mb-2">
            <strong>当前拥有角色:</strong>
            <v-chip-group class="mt-2">
              <v-chip
                v-for="role in userRoles"
                :key="role.id"
                :color="getRoleColor(role.name)"
                variant="outlined"
              >
                {{ role.name }}
              </v-chip>
              <div v-if="userRoles.length === 0" class="text-grey">
                未分配任何角色
              </div>
            </v-chip-group>
          </div>
          
          <v-divider class="my-4"></v-divider>
          
          <v-card-title class="text-subtitle-1 px-0">
            分配角色
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="搜索角色"
              single-line
              hide-details
              density="compact"
              style="max-width: 200px;"
            ></v-text-field>
          </v-card-title>
          
          <v-data-table
            :headers="headers"
            :items="roles"
            :search="search"
            :loading="loadingRoles"
            density="comfortable"
            class="elevation-1"
            item-value="id"
            :items-per-page="10"
            v-model="selectedRoleIds"
            show-select
          >
            <template v-slot:item.description="{ item }">
              <div class="text-truncate" style="max-width: 300px;" :title="item.description">
                {{ item.description || '无描述' }}
              </div>
            </template>
            
            <template v-slot:item.permissions_count="{ item }">
              <v-chip
                :color="getPermissionCountColor(item.permissions?.length || 0)"
                text-color="white"
                size="small"
              >
                {{ item.permissions?.length || 0 }}
              </v-chip>
            </template>
          </v-data-table>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions>
        <small class="text-grey">已选择 {{ selectedRoleIds.length }} 个角色</small>
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="closeDialog"
          :disabled="saving"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          @click="saveUserRoles"
          :loading="saving"
          :disabled="saving"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '../../utils/api'
import Message from '../../utils/notification'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      roles: []
    })
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

// 本地状态
const localDialog = ref(props.modelValue)
const search = ref('')
const roles = ref([])
const selectedRoleIds = ref([])
const userRoles = ref([])
const loading = ref(false)
const loadingRoles = ref(false)
const saving = ref(false)
const errorMessage = ref('')

// 表头定义
const headers = [
  { title: '角色名称', key: 'name', sortable: true },
  { title: '描述', key: 'description', sortable: true },
  { title: '权限数量', key: 'permissions_count', sortable: true },
]

// 监听dialog prop变化
watch(() => props.modelValue, (newVal) => {
  localDialog.value = newVal
  if (newVal) {
    initializeDialog()
  }
})

// 监听localDialog变化
watch(() => localDialog.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听user prop变化
watch(() => props.user, (newVal) => {
  if (newVal && newVal.roles) {
    userRoles.value = [...(newVal.roles || [])]
    selectedRoleIds.value = newVal.roles?.map(role => role.id) || []
  } else {
    userRoles.value = []
    selectedRoleIds.value = []
  }
})

// 初始化对话框
const initializeDialog = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    // 加载所有角色
    await loadRoles()
    
    // 设置已选择的角色
    if (props.user && props.user.roles) {
      userRoles.value = [...(props.user.roles || [])]
      selectedRoleIds.value = props.user.roles?.map(role => role.id) || []
    }
  } catch (error) {
    console.error('初始化用户角色对话框失败:', error)
    errorMessage.value = '加载数据失败: ' + (error.message || '未知错误')
  } finally {
    loading.value = false
  }
}

// 加载所有角色
const loadRoles = async () => {
  loadingRoles.value = true
  try {
    console.log('开始加载角色列表');
    const response = await api.get('/roles');
    console.log('角色列表响应:', response);
    
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        roles.value = response.data;
        console.log('成功加载角色列表:', roles.value.length, '个角色');
      } else {
        console.warn('角色数据不是数组:', response.data);
        roles.value = [];
      }
    } else {
      console.warn('角色响应格式不正确:', response);
      roles.value = [];
    }
  } catch (error) {
    console.error('加载角色列表失败:', error);
    
    // 详细记录错误信息
    if (error.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但没有收到响应');
      console.error('请求详情:', error.request);
    } else {
      console.error('请求设置错误:', error.message);
    }
    
    roles.value = [];
    errorMessage.value = '无法加载角色列表: ' + (error.message || '未知错误');
    throw error;
  } finally {
    loadingRoles.value = false;
  }
};

// 保存用户角色
const saveUserRoles = async () => {
  if (!props.user || !props.user.id) {
    errorMessage.value = '无效的用户信息'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    // 确保用户ID是整数
    const userId = Number(props.user.id)
    if (isNaN(userId) || userId <= 0) {
      throw new Error(`无效的用户ID: ${props.user.id}`)
    }

    // 确保角色ID都是整数
    const roleIds = selectedRoleIds.value.map(id => {
      const roleId = Number(id)
      if (isNaN(roleId) || roleId <= 0) {
        throw new Error(`无效的角色ID: ${id}`)
      }
      return roleId
    })

    // 调用API保存用户角色
    await api.post(`/users/${userId}/roles`, {
      user_id: userId,
      role_ids: roleIds
    })
    
    Message.success('角色分配成功')
    emit('save', {
      userId: props.user.id,
      roleIds: selectedRoleIds.value
    })
    closeDialog()
  } catch (error) {
    console.error('保存用户角色失败:', error)
    errorMessage.value = '保存失败: ' + (error.response?.data?.detail || error.message || '未知错误')
    Message.error(errorMessage.value)
  } finally {
    saving.value = false
  }
}

// 关闭对话框
const closeDialog = () => {
  emit('close')
  localDialog.value = false
}

// 获取角色颜色
const getRoleColor = (roleName) => {
  const roleColors = {
    '超级管理员': 'red',
    '管理员': 'deep-orange',
    '部门负责人': 'indigo',
    '班组负责人': 'cyan',
    '普通用户': 'teal'
  }
  
  return roleColors[roleName] || 'grey'
}

// 获取权限数量颜色
const getPermissionCountColor = (count) => {
  if (count === 0) return 'grey'
  if (count < 3) return 'blue'
  if (count < 6) return 'green'
  if (count < 10) return 'amber'
  return 'red' // 大量权限，可能是超级管理员
}
</script>

<style scoped>
.user-role-dialog {
  margin-bottom: 20px;
}
</style> 