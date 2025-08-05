<template>
  <div>
    <v-row>
      <v-col cols="12">
        <unified-data-table
          title="用户管理"
          icon="mdi-account-group"
          :headers="headers"
          :items="users"
          :loading="loading"
          :search="search"
          :items-per-page="10"
          :hide-default-footer="false"
        >
          <template #title>
            <span>用户管理</span>
            <v-spacer />
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="搜索用户"
              single-line
              hide-details
              density="compact"
              class="ml-4"
              style="max-width: 300px"
            />
          </template>

          <template #item.department="{ item }">
            <v-chip
              v-if="item.department?.name"
              size="small"
              color="primary"
              variant="flat"
            >
              {{ item.department?.name }}
            </v-chip>
            <span
              v-else
              class="text-caption text-grey"
            >未分配</span>
          </template>

          <template #item.roles="{ item }">
            <div v-if="item.roles && item.roles.length > 0">
              <v-chip
                v-for="(role, i) in item.roles.slice(0, 2)"
                :key="i" 
                size="x-small"
                class="mr-1"
                :color="getRoleColor(role.name)"
                variant="outlined"
              >
                {{ role.name }}
              </v-chip>
              <v-chip
                v-if="item.roles.length > 2"
                size="x-small"
                color="grey"
                variant="outlined"
              >
                +{{ item.roles.length - 2 }}
              </v-chip>
            </div>
            <span
              v-else
              class="text-caption text-grey"
            >未分配角色</span>
          </template>

          <template #item.is_active="{ item }">
            <v-chip
              :color="item.is_active ? 'success' : 'error'"
              size="small"
            >
              {{ item.is_active ? '启用' : '禁用' }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              class="mr-1"
              @click="editUser(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              编辑
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="info"
              class="mr-1"
              @click="manageUserRoles(item)"
            >
              <v-icon>mdi-account-key</v-icon>
              角色
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="warning"
              class="mr-1"
              @click="resetPassword(item)"
            >
              <v-icon>mdi-lock-reset</v-icon>
              重置密码
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              :color="item.is_active ? 'error' : 'success'"
              @click="toggleUserStatus(item)"
            >
              <v-icon>{{ item.is_active ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
              {{ item.is_active ? '禁用' : '启用' }}
            </v-btn>
          </template>

          <template #actions>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showUserDialog('add')"
            >
              添加用户
            </v-btn>
            <v-btn
              class="ml-2"
              color="secondary"
              prepend-icon="mdi-refresh"
              @click="fetchUsers"
            >
              刷新
            </v-btn>
            <v-btn
              class="ml-2"
              color="info"
              prepend-icon="mdi-filter"
              @click="filterDrawer = true"
            >
              筛选
            </v-btn>
          </template>
        </unified-data-table>
      </v-col>
    </v-row>

    <!-- 用户对话框 -->
    <v-dialog
      v-model="isShowUserDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ userDialogTitle }}
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form
            ref="userFormRef"
            :show-default-actions="false"
          >
            <v-text-field
              v-model="userForm.name"
              label="用户名"
              placeholder="请输入用户名"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
            <v-text-field
              v-if="userDialogType === 'add'"
              v-model="userForm.password"
              label="密码"
              placeholder="请输入密码"
              type="password"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
            <v-select
              v-model="userForm.department_id"
              :items="departments"
              item-title="name"
              item-value="id"
              label="部门"
              placeholder="请选择部门"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
            <v-switch
              v-if="userDialogType === 'edit'"
              v-model="userForm.is_active"
              label="启用账户"
              color="success"
              hide-details
              class="mt-2"
            />
          </unified-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="isShowUserDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveUser"
          >
            确定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 重置密码对话框 -->
    <v-dialog
      v-model="isShowResetDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title class="text-h5 bg-warning text-white">
          重置密码
        </v-card-title>
        <v-card-text class="pt-4">
          <p>您确定要为用户 <strong>{{ selectedUser?.name }}</strong> 重置密码吗？</p>
          <v-text-field
            v-model="resetPasswordForm.password"
            label="新密码"
            placeholder="请输入新密码"
            type="password"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required]"
          />
          <v-text-field
            v-model="resetPasswordForm.confirmPassword"
            label="确认密码"
            placeholder="请再次输入新密码"
            type="password"
            variant="outlined"
            density="comfortable"
            :rules="[rules.required, passwordMatch]"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="isShowResetDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="warning"
            :loading="resetting"
            @click="confirmResetPassword"
          >
            确认重置
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 过滤器抽屉 -->
    <v-navigation-drawer
      v-model="filterDrawer"
      location="right"
      temporary
      width="300"
    >
      <v-card class="h-100">
        <v-card-title class="bg-primary text-white">
          <v-icon
            class="mr-2"
            color="white"
          >
            mdi-filter
          </v-icon>
          筛选条件
          <v-spacer />
          <v-btn
            icon
            variant="text"
            color="white"
            size="small"
            @click="filterDrawer = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <unified-form>
            <v-text-field
              v-model="filters.name"
              label="用户名"
              variant="outlined"
              density="comfortable"
              clearable
            />
            
            <v-select
              v-model="filters.department_id"
              :items="departments"
              item-title="name"
              item-value="id"
              label="部门"
              variant="outlined"
              density="comfortable"
              clearable
            />
            
            <v-text-field
              v-model="filters.role"
              label="角色"
              variant="outlined"
              density="comfortable"
              clearable
            />
            
            <v-select
              v-model="filters.is_active"
              :items="[
                { title: '启用', value: true },
                { title: '禁用', value: false }
              ]"
              item-title="title"
              item-value="value"
              label="状态"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </unified-form>
        </v-card-text>
        
        <v-card-actions class="py-3">
          <v-spacer />
          <v-btn
            variant="text"
            color="grey"
            @click="clearFilters"
          >
            清除筛选
          </v-btn>
          <v-btn
            color="primary"
            @click="applyFilters"
          >
            应用筛选
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <!-- 用户角色管理对话框 -->
    <user-role-dialog
      v-model="isShowUserRoleDialog"
      :user="selectedUser"
      @save="onUserRolesSaved"
      @close="isShowUserRoleDialog = false"
    />
  </div>
</template>
 
<script setup>
import { ref, onMounted } from 'vue';
import api from '../../utils/api';
import UserRoleDialog from '../../components/permissions/UserRoleDialog.vue';
import { useNotification } from '../../composables/useNotification';
import UnifiedForm from '../../components/UnifiedForm.vue';
import UnifiedDataTable from '../../components/UnifiedDataTable.vue';

const { showSuccess, showError } = useNotification();

// 表格列定义
const headers = [
  { title: '用户名', key: 'name', align: 'start', sortable: true },
  { title: '部门', key: 'department', align: 'start', sortable: true },
  { title: '角色', key: 'roles', align: 'start', sortable: false },
  { title: '状态', key: 'is_active', align: 'center', sortable: true },
  { title: '操作', key: 'actions', align: 'center', sortable: false }
];

// 状态变量
const users = ref([]);
const allUsers = ref([]); // 存储所有用户，用于过滤
const departments = ref([]);
const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);
const search = ref('');
const filterDrawer = ref(false);

// 过滤器
const filters = ref({
  name: '',
  department_id: null,
  role: '',
  is_active: null
});

// 对话框状态
const isShowUserDialog = ref(false);
const userDialogTitle = ref('');
const userDialogType = ref(''); 
const userForm = ref({
  name: '',
  password: '',
  department_id: '',
  is_active: true
});

const isShowResetDialog = ref(false);
const resetPasswordForm = ref({
  password: '',
  confirmPassword: ''
});

const isShowUserRoleDialog = ref(false);
const selectedUser = ref(null);

// 表单验证规则
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项'
};

// 密码匹配验证
const passwordMatch = () => {
  return resetPasswordForm.value.password === resetPasswordForm.value.confirmPassword || '两次输入的密码不一致';
};

// 获取用户列表 
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await api.get('/users');
    
    // 检查响应数据结构
    if (response && response.data && Array.isArray(response.data)) {
      users.value = response.data.map(user => ({
        ...user,
        roles: user.roles || []
      }));
      allUsers.value = [...users.value];
    } else if (response && Array.isArray(response)) {
      users.value = response.map(user => ({
        ...user,
        roles: user.roles || []
      }));
      allUsers.value = [...users.value];
    } else {
      console.error('用户数据格式不正确:', response);
      users.value = [];
      allUsers.value = [];
      showError('用户数据格式不正确');
    }
  } catch (error) {
    console.error('获取用户列表失败:', error); 
    showError('获取用户列表失败');
    users.value = [];
    allUsers.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取部门列表
const fetchDepartments = async () => {
  try {
    const response = await api.get('/departments/');
    
    // 检查响应数据结构
    if (response && response.data && Array.isArray(response.data)) {
      departments.value = response.data;
    } else if (response && Array.isArray(response)) {
      departments.value = response;
    } else {
      console.error('部门数据格式不正确:', response);
      departments.value = [];
      showError('部门数据格式不正确');
    }
  } catch (error) {
    console.error('获取部门列表失败:', error);
    showError('获取部门列表失败');
    departments.value = [];
  }
};

// 显示用户对话框
const showUserDialog = (type, user) => {
  userDialogType.value = type;
  userDialogTitle.value = type === 'add' ? '添加用户' : '编辑用户';
  
  if (type === 'add') {
    userForm.value = {
      name: '',
      password: '',
      department_id: '',
      is_active: true
    };
  } else if (type === 'edit' && user) {
    userForm.value = {
      id: user.id,
      name: user.name,
      department_id: user.department?.id || user.department_id || '',
      is_active: user.is_active !== undefined ? user.is_active : true
    };
  }
  
  isShowUserDialog.value = true;
};

// 编辑用户
const editUser = (user) => {
  showUserDialog('edit', user);
};

// 管理用户角色
const manageUserRoles = (user) => {
  selectedUser.value = user;
  isShowUserRoleDialog.value = true;
};

// 保存用户信息
const saveUser = async () => {
  try {
    saving.value = true;
    
    if (userDialogType.value === 'add') {
      // 创建新用户
      await api.post('/users', userForm.value);
      showSuccess('用户创建成功');
    } else {
      // 更新用户
      await api.put(`/users/${userForm.value.id}`, userForm.value);
      showSuccess('用户更新成功');
    }
    
    // 关闭对话框并刷新列表
    isShowUserDialog.value = false;
    fetchUsers();
  } catch (error) {
    console.error('保存用户失败:', error);
    showError('保存用户失败: ' + (error.response?.data?.detail || error.message));
  } finally {
    saving.value = false;
  }
};

// 重置用户密码
const resetPassword = (user) => {
  selectedUser.value = user;
  resetPasswordForm.value = {
    password: '',
    confirmPassword: ''
  };
  isShowResetDialog.value = true;
};

// 确认重置密码
const confirmResetPassword = async () => {
  if (resetPasswordForm.value.password !== resetPasswordForm.value.confirmPassword) {
    showError('两次输入的密码不一致');
    return;
  }
  
  try {
    resetting.value = true;
    
    await api.post(`/users/${selectedUser.value.id}/reset-password`, {
      password: resetPasswordForm.value.password
    });
    
    showSuccess('密码重置成功');
    isShowResetDialog.value = false;
  } catch (error) {
    console.error('重置密码失败:', error);
    showError('重置密码失败: ' + (error.response?.data?.detail || error.message));
  } finally {
    resetting.value = false;
  }
};

// 切换用户状态
const toggleUserStatus = async (user) => {
  try {
    loading.value = true;
    
    await api.put(`/users/${user.id}/status`, {
      is_active: !user.is_active
    });
    
    showSuccess(`用户${user.is_active ? '禁用' : '启用'}成功`);
    fetchUsers(); // 刷新用户列表
  } catch (error) {
    console.error('更新用户状态失败:', error);
    showError('更新用户状态失败: ' + (error.response?.data?.detail || error.message));
  } finally {
    loading.value = false;
  }
};

// 用户角色保存后的回调
const onUserRolesSaved = () => {
  fetchUsers(); // 刷新用户列表
  isShowUserRoleDialog.value = false;
};

// 应用过滤器
const applyFilters = () => {
  filterDrawer.value = false;
  
  // 应用过滤条件
  const filtered = allUsers.value.filter(user => {
    let match = true;
    
    if (filters.value.name && !user.name.toLowerCase().includes(filters.value.name.toLowerCase())) {
      match = false;
    }
    
    if (filters.value.department_id && user.department?.id !== filters.value.department_id) {
      match = false;
    }
    
    if (filters.value.role && user.roles && user.roles.length > 0) {
      const hasRole = user.roles.some(role => 
        role.name.toLowerCase().includes(filters.value.role.toLowerCase())
      );
      if (!hasRole) match = false;
    }
    
    if (filters.value.is_active !== null && user.is_active !== filters.value.is_active) {
      match = false;
    }
    
    return match;
  });
  
  users.value = filtered;
};

// 清除过滤器
const clearFilters = () => {
  filters.value = {
    name: '',
    department_id: null,
    role: '',
    is_active: null
  };
  
  // 重置为所有用户
  users.value = [...allUsers.value];
};

// 根据角色名称获取颜色
const getRoleColor = (roleName) => {
  const roleColors = {
    '超级管理员': 'red',
    '管理员': 'orange',
    '部门负责人': 'indigo',
    '班组负责人': 'cyan',
    '普通用户': 'teal'
  };
  
  return roleColors[roleName] || 'grey';
};

// 初始化
onMounted(() => {
  fetchUsers();
  fetchDepartments();
});
</script>

<style scoped>
.user-management-card {
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 600px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .v-btn {
    margin-bottom: 8px;
  }
}
</style> 