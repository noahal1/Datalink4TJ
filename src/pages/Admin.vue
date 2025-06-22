<template>
  <v-container fluid>
    <v-card class="admin-page-card" elevation="3">
      <!-- 页面标题栏 -->
      <v-card-title class="admin-page-header d-flex align-center py-4 px-6">
        <v-icon class="mr-2" color="secondary">mdi-shield-account</v-icon>
        <div class="text-h5 font-weight-medium">系统管理</div>
      </v-card-title>
      
      <v-card-text class="admin-page-content pa-6">
        <!-- 管理页面导航 -->
        <v-tabs
          v-model="activeTab"
          color="primary"
          align-tabs="start"
          class="mb-4"
        >
          <v-tab :to="'/admin/users'" value="users">
            <v-icon start>mdi-account-group</v-icon>
            用户管理
          </v-tab>
          <v-tab :to="'/admin/departments'" value="departments">
            <v-icon start>mdi-domain</v-icon>
            部门管理
          </v-tab>
          <v-tab :to="'/admin/activities'" value="activities">
            <v-icon start>mdi-history</v-icon>
            操作记录
          </v-tab>
          <v-tab :to="'/admin/routes'" value="routes">
            <v-icon start>mdi-routes</v-icon>
            路由管理
          </v-tab>
          <v-tab :to="'/admin/permissions'" value="permissions">
            <v-icon start>mdi-shield-account</v-icon>
            权限管理
          </v-tab>
        </v-tabs>
        
        <!-- 子路由视图 -->
        <router-view v-if="$route.path !== '/admin/users'" />
        
        <!-- 用户管理视图 -->
        <div v-if="$route.path === '/admin/users'">
          <v-row>
            <v-col cols="12">
              <unified-data-table
                title="用户管理"
                icon="mdi-account-group"
                :headers="[
                  { title: '用户名', key: 'name', align: 'start' },
                  { title: '部门', key: 'department', align: 'start' },
                  { title: '角色', key: 'roles', align: 'start' },
                  { title: '操作', key: 'actions', align: 'center', sortable: false }
                ]"
                :items="users"
                :loading="loading"
              >
                <template v-slot:item.department="{ item }">
                  {{ item.department?.name }}
                </template>
                <template v-slot:item.roles="{ item }">
                  <div v-if="item.roles && item.roles.length > 0">
                    <v-chip v-for="(role, i) in item.roles.slice(0, 2)" :key="i" 
                           size="x-small" class="mr-1" :color="getRoleColor(role.name)" variant="outlined">
                      {{ role.name }}
                    </v-chip>
                    <v-chip v-if="item.roles.length > 2" size="x-small" color="grey" variant="outlined">
                      +{{ item.roles.length - 2 }}
                    </v-chip>
                  </div>
                  <span v-else class="text-caption text-grey">未分配角色</span>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn size="small" variant="text" color="primary" class="mr-1" @click="editUser(item)">
                    <v-icon>mdi-pencil</v-icon>
                    编辑
                  </v-btn>
                  <v-btn size="small" variant="text" color="info" class="mr-1" @click="manageUserRoles(item)">
                    <v-icon>mdi-account-key</v-icon>
                    角色
                  </v-btn>
                  <v-btn size="small" variant="text" color="error" @click="deleteUser(item)">
                    <v-icon>mdi-delete</v-icon>
                    删除
                  </v-btn>
                </template>
                <template #actions>
                  <v-btn color="primary" prepend-icon="mdi-plus" @click="showUserDialog('add')">
                    添加用户
                  </v-btn>
                </template>
              </unified-data-table>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- 用户对话框 -->
    <v-dialog v-model="isShowUserDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ userDialogTitle }}
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form ref="userFormRef" :showDefaultActions="false">
            <v-text-field
              v-model="userForm.name"
              label="用户名"
              placeholder="请输入用户名"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            ></v-text-field>
            <v-text-field
              v-if="userDialogType === 'add'"
              v-model="userForm.password"
              label="密码"
              placeholder="请输入密码"
              type="password"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            ></v-text-field>
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
            ></v-select>
          </unified-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isShowUserDialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveUser">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
 
    <!-- 用户角色管理对话框 -->
    <user-role-dialog
      v-model="isShowUserRoleDialog"
      :user="selectedUser"
      @save="onUserRolesSaved"
      @close="isShowUserRoleDialog = false"
    />
  </v-container>
</template>
 
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import Message from '../utils/notification';
import ActivityHistory from '../components/admin/ActivityHistory.vue';
import { get, post, put, del } from '../utils/api'; // 导入api工具
import UserRoleDialog from '../components/permissions/UserRoleDialog.vue'; // 导入用户角色对话框组件

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const route = useRoute();
const users = ref([]);
const departments = ref([]);
const loading = ref(false);

// 当前活动标签
const activeTab = ref(null);

// 根据路由路径设置活动标签
const setActiveTabFromRoute = () => {
  const path = route.path;
  if (path === '/admin' || path === '/admin/users') {
    activeTab.value = 'users';
  } else if (path.includes('/admin/')) {
    activeTab.value = path.split('/').pop();
  }
};

// 监听路由变化
onMounted(() => {
  setActiveTabFromRoute();
  
  // 如果是用户管理页面，加载用户数据
  if (route.path === '/admin/users') {
    fetchUsers();
    fetchDepartments();
  }
});

// 表单验证规则
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项'
};
 
// 用户相关 
const isShowUserDialog = ref(false);
const userDialogTitle = ref('');
const userDialogType = ref(''); 
const userForm = ref({
  name: '',
  password: '',
  department_id: ''
});
const userFormRef = ref(null);

const isShowUserRoleDialog = ref(false); // 用户角色对话框
const selectedUser = ref(null); // 当前选中的用户

// 根据角色名称获取颜色
const getRoleColor = (roleName) => {
  const roleColors = {
    '超级管理员': 'red',
    '管理员': 'orange',
    '普通用户': 'blue',
    '只读用户': 'green'
  };
  
  return roleColors[roleName] || 'grey';
};

// 获取用户列表 
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await get('/users');
    console.log('用户数据响应:', response);
    
    // 检查响应数据结构
    if (response && response.data && Array.isArray(response.data)) {
      // 确保每个用户对象都有roles属性
      users.value = response.data.map(user => ({
        ...user,
        roles: user.roles || []
      }));
    } else if (response && Array.isArray(response)) {
      users.value = response.map(user => ({
        ...user,
        roles: user.roles || []
      }));
    } else {
      console.error('用户数据格式不正确:', response);
      users.value = [];
      Message.warning('用户数据格式不正确');
    }
  } catch (error) {
    console.error('获取用户列表失败:', error); 
    Message.error('获取用户列表失败');
    users.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取部门列表
const fetchDepartments = async () => {
  try {
    const response = await get('/departments');
    console.log('部门数据响应:', response);
    
    // 检查响应数据结构
    if (response && response.data && Array.isArray(response.data)) {
      departments.value = response.data;
    } else if (response && Array.isArray(response)) {
      departments.value = response;
    } else {
      console.error('部门数据格式不正确:', response);
      departments.value = [];
      Message.warning('部门数据格式不正确');
    }
  } catch (error) {
    console.error('获取部门列表失败:', error);
    Message.error('获取部门列表失败');
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
      department_id: ''
    };
  } else if (type === 'edit' && user) {
    userForm.value = {
      id: user.id,
      name: user.name,
      department_id: user.department?.id || user.department_id || ''
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
  // TODO: 添加表单验证
  
  try {
    loading.value = true;
    
    if (userDialogType.value === 'add') {
      // 创建新用户
      await post('/users', userForm.value);
      Message.success('用户创建成功');
    } else {
      // 更新用户
      await put(`/users/${userForm.value.id}`, userForm.value);
      Message.success('用户更新成功');
    }
    
    // 关闭对话框并刷新列表
    isShowUserDialog.value = false;
    fetchUsers();
  } catch (error) {
    console.error('保存用户失败:', error);
    Message.error('保存用户失败: ' + (error.response?.data?.detail || error.message));
  } finally {
    loading.value = false;
  }
};

// 删除用户
const deleteUser = async (user) => {
  if (!window.confirm(`确定要删除用户 "${user.name}" 吗？`)) {
    return;
  }
  
  try {
    loading.value = true;
    await del(`/users/${user.id}`);
    Message.success('用户删除成功');
    fetchUsers(); // 刷新用户列表
  } catch (error) {
    console.error('删除用户失败:', error);
    Message.error('删除用户失败: ' + (error.response?.data?.detail || error.message));
  } finally {
    loading.value = false;
  }
};

// 用户角色保存后的回调
const onUserRolesSaved = () => {
  fetchUsers(); // 刷新用户列表
  isShowUserRoleDialog.value = false;
};
</script>

<style scoped>
.admin-page-card {
  border-radius: 12px;
  overflow: hidden;
}

.admin-page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: white;
}

.admin-page-content {
  min-height: 300px;
}

@media (max-width: 600px) {
  .admin-page-header {
    padding: 12px 16px !important;
  }
  
  .admin-page-content {
    padding: 16px !important;
  }
}
</style>