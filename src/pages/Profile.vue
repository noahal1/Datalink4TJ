<template>
  <unified-page-template 
    title="个人资料"
    subtitle="管理您的个人信息和账户设置"
    icon="mdi-account-circle"
    color="primary"
  >
    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <v-card
          class="profile-info-card"
          elevation="2"
        >
          <v-card-text class="text-center pa-6">
            <!-- 用户头像 -->
            <v-avatar
              size="120"
              color="primary"
              class="mb-4"
            >
              <span class="text-h3 text-white">{{ userInitials }}</span>
            </v-avatar>
            
            <!-- 用户基本信息 -->
            <h3 class="text-h5 mb-2">
              {{ userStore.user || '未知用户' }}
            </h3>
            <p class="text-subtitle-1 text-grey-600 mb-1">
              {{ getDepartmentName(userStore.department) }} 部门
            </p>
            <p class="text-body-2 text-grey-500 mb-4">
              用户ID: {{ userStore.userId || 'N/A' }}
            </p>
            
            <!-- 状态标签 -->
            <v-chip 
              color="success" 
              variant="flat" 
              size="small"
              prepend-icon="mdi-check-circle"
            >
              活跃用户
            </v-chip>
          </v-card-text>
        </v-card>
        
        <!-- 快捷操作 -->
        <v-card
          class="mt-4"
          elevation="2"
        >
          <v-card-title class="text-h6">
            快捷操作
          </v-card-title>
          <v-list density="compact">
            <v-list-item 
              prepend-icon="mdi-lock-reset" 
              title="修改密码"
              @click="showChangePasswordDialog = true"
            />
            <v-list-item 
              prepend-icon="mdi-theme-light-dark" 
              title="切换主题"
              @click="toggleTheme"
            />
            <v-list-item 
              prepend-icon="mdi-logout" 
              title="退出登录"
              @click="logout"
            />
          </v-list>
        </v-card>
      </v-col>
      
      <!-- 右侧：个人信息编辑 -->
      <v-col
        cols="12"
        md="8"
      >
        <v-card elevation="2">
          <v-card-title class="text-h6 d-flex align-center">
            <v-icon class="mr-2">
              mdi-account-edit
            </v-icon>
            编辑个人信息
          </v-card-title>
          <v-divider />
          
          <v-card-text class="pa-6">
            <unified-form 
              ref="profileFormRef" 
              :show-default-actions="false"
              :loading="saving"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="profileForm.name"
                    label="用户名"
                    placeholder="请输入用户名"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="profileForm.email"
                    label="邮箱地址"
                    placeholder="请输入邮箱地址"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-email"
                    :rules="[rules.email]"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="profileForm.phone"
                    label="联系电话"
                    placeholder="请输入联系电话"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-phone"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="profileForm.department_id"
                    :items="departments"
                    item-title="name"
                    item-value="id"
                    label="部门"
                    placeholder="请选择部门"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-office-building"
                    readonly
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="profileForm.description"
                    label="个人简介"
                    placeholder="请输入个人简介"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-text"
                    rows="3"
                  />
                </v-col>
              </v-row>
              
              <!-- 操作按钮 -->
              <v-row class="mt-4">
                <v-col
                  cols="12"
                  class="d-flex justify-end"
                >
                  <v-btn
                    variant="outlined"
                    color="grey"
                    class="mr-3"
                    :disabled="saving"
                    @click="resetForm"
                  >
                    重置
                  </v-btn>
                  <v-btn
                    color="primary"
                    :loading="saving"
                    @click="saveProfile"
                  >
                    保存更改
                  </v-btn>
                </v-col>
              </v-row>
            </unified-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 修改密码对话框 -->
    <v-dialog
      v-model="showChangePasswordDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h6 bg-primary text-white">
          修改密码
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form
            ref="passwordFormRef"
            :show-default-actions="false"
          >
            <v-text-field
              v-model="passwordForm.currentPassword"
              label="当前密码"
              placeholder="请输入当前密码"
              type="password"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock"
              :rules="[rules.required]"
            />
            <v-text-field
              v-model="passwordForm.newPassword"
              label="新密码"
              placeholder="请输入新密码"
              type="password"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-plus"
              :rules="[rules.required, rules.password]"
            />
            <v-text-field
              v-model="passwordForm.confirmPassword"
              label="确认新密码"
              placeholder="请再次输入新密码"
              type="password"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-check"
              :rules="[rules.required, passwordMatch]"
            />
          </unified-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="outlined"
            :disabled="changingPassword"
            @click="closePasswordDialog"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            :loading="changingPassword"
            @click="changePassword"
          >
            确认修改
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useUserStore } from '../stores/user'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import UnifiedForm from '../components/UnifiedForm.vue'
import Message from '../utils/notification'
import api from '../utils/api'

// 路由和主题
const router = useRouter()
const theme = useTheme()
const userStore = useUserStore()

// 响应式数据
const saving = ref(false)
const changingPassword = ref(false)
const showChangePasswordDialog = ref(false)
const departments = ref([])

// 表单引用
const profileFormRef = ref(null)
const passwordFormRef = ref(null)

// 个人信息表单
const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
  department_id: '',
  description: ''
})

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项',
  email: v => !v || /.+@.+\..+/.test(v) || '请输入有效的邮箱地址',
  password: v => !v || v.length >= 6 || '密码长度至少6位'
}

// 密码匹配验证
const passwordMatch = () => {
  return passwordForm.newPassword === passwordForm.confirmPassword || '两次输入的密码不一致'
}

// 用户首字母
const userInitials = computed(() => {
  if (!userStore.user) return ''
  return userStore.user.charAt(0).toUpperCase()
})

// 获取部门名称
const getDepartmentName = (departmentId) => {
  const dept = departments.value.find(d => d.id === departmentId)
  return dept?.name || '未分配'
}

// 初始化数据
onMounted(async () => {
  await loadUserProfile()
  await loadDepartments()
})

// 加载用户资料
const loadUserProfile = async () => {
  try {
    const response = await api.get('/users/me')
    const userData = response.data
    
    // 填充表单数据
    profileForm.name = userData.user_name || userStore.user || ''
    profileForm.email = userData.email || ''
    profileForm.phone = userData.phone || ''
    profileForm.department_id = userData.department || userStore.department || ''
    profileForm.description = userData.description || ''
  } catch (error) {
    console.error('加载用户资料失败:', error)
    Message.error('加载用户资料失败')
  }
}

// 加载部门列表
const loadDepartments = async () => {
  try {
    const response = await api.get('/departments')
    departments.value = response.data || []
  } catch (error) {
    console.error('加载部门列表失败:', error)
    departments.value = []
  }
}

// 保存个人资料
const saveProfile = async () => {
  try {
    // 验证表单
    const { valid } = await profileFormRef.value.validate()
    if (!valid) return
    
    saving.value = true
    
    // 提交更新
    await api.put('/users/me', {
      user_name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      description: profileForm.description
    })
    
    // 更新用户store中的信息
    userStore.setUserData({
      user: profileForm.name,
      department: profileForm.department_id
    })
    
    Message.success('个人资料更新成功')
  } catch (error) {
    console.error('保存个人资料失败:', error)
    Message.error('保存个人资料失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  loadUserProfile()
}

// 修改密码
const changePassword = async () => {
  try {
    // 验证表单
    const { valid } = await passwordFormRef.value.validate()
    if (!valid) return
    
    changingPassword.value = true
    
    // 提交密码修改
    await api.post('/users/me/change-password', {
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword
    })
    
    Message.success('密码修改成功')
    closePasswordDialog()
  } catch (error) {
    console.error('修改密码失败:', error)
    Message.error('修改密码失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    changingPassword.value = false
  }
}

// 关闭密码对话框
const closePasswordDialog = () => {
  showChangePasswordDialog.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.resetValidation()
}

// 切换主题
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  
  try {
    localStorage.setItem('theme', theme.global.name.value)
    Message.success(`已切换到${theme.global.name.value === 'dark' ? '深色' : '浅色'}主题`)
  } catch (e) {
    console.error('无法保存主题设置', e)
  }
}

// 退出登录
const logout = () => {
  userStore.logout()
  router.push('/login')
  Message.info('已退出登录')
}
</script>

<style scoped>

.profile-info-card .v-card-text {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 8px;
  margin: 16px;
}
</style>
