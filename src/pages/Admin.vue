<template>
  <unified-page-template 
    title="系统管理"
    icon="mdi-shield-account"
    color="secondary"
  >
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
  </unified-page-template>
</template>
 
<script setup>
import { ref, onMounted } from 'vue';
import Message from '../utils/notification';
import ActivityHistory from '../components/admin/ActivityHistory.vue';
import { get, post, put, del } from '../utils/api'; // 导入api工具
import UserRoleDialog from '../components/permissions/UserRoleDialog.vue'; // 导入用户角色对话框组件
 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const users = ref([]);
const departments = ref([]);
const loading = ref(false);

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
  loading.value = true;
  try {
    const response = await get('/departments/');
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
  } finally {
    loading.value = false;
  }
};
 
// 展示用户对话框 
const showUserDialog = (type, row = {}) => {
  if (type === 'add') {
    userDialogTitle.value  = '添加用户';
    userDialogType.value  = 'add';
    userForm.value  = {
      name: '',
      password: '',
      department_id: '',
    };
  } else if (type === 'edit') {
    userDialogTitle.value  = '编辑用户';
    userDialogType.value  = 'edit';
    userForm.value  = {
      name: row.name, 
      department_id: row.department?.id  || '',
      id: row.id  
    };
  }
  isShowUserDialog.value  = true;
};
 
// 保存用户 
const saveUser = async () => {
  try {
    // 简单验证
    if (!userForm.value.name) {
      Message.warning('请输入用户名');
      return;
    }
    
    if (userDialogType.value === 'add' && !userForm.value.password) {
      Message.warning('请输入密码');
      return;
    }
    
    if (!userForm.value.department_id) {
      Message.warning('请选择部门');
      return;
    }
    
    let response;
    
    if (userDialogType.value === 'add') {
      // 使用api工具发送请求
      response = await post('/users', {
        name: userForm.value.name,
        password: userForm.value.password,
        department_id: parseInt(userForm.value.department_id)
      });
      
      Message.success('添加用户成功');
    } else {
      // 使用api工具发送请求
      response = await put(`/users/${userForm.value.id}`, {
        name: userForm.value.name,
        department_id: parseInt(userForm.value.department_id)
      });
      
      Message.success('更新用户成功');
    }
    
    // 刷新用户列表
    fetchUsers();
    
    // 关闭对话框
    isShowUserDialog.value = false;
    
  } catch (error) {
    console.error(error);
    Message.error('操作失败: ' + (error.response?.data?.detail || error.message));
  }
};
 
// 删除用户 
const deleteUser = async (user) => {
  if (confirm(`确定要删除用户 ${user.name} 吗？`)) {
    try {
      await del(`/users/${user.id}`);
      Message.success('用户删除成功');
      fetchUsers();  // 重新获取用户列表
    } catch (error) {
      console.error('删除用户失败:', error);
      Message.error('删除用户失败');
    }
  }
};
 
// 打开用户角色管理对话框
const manageUserRoles = (user) => {
  selectedUser.value = user;
  isShowUserRoleDialog.value = true;
};

// 编辑用户 
const editUser = (row) => {
  showUserDialog('edit', row);
};

// 处理用户角色保存
const onUserRolesSaved = async (data) => {
  try {
    // 重新加载用户列表以更新角色信息
    await fetchUsers();
    Message.success('用户角色已更新');
  } catch (error) {
    console.error('更新用户角色后刷新列表失败:', error);
  }
};

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
};

// 页面加载时获取数据 
onMounted(() => {
  fetchUsers();
  fetchDepartments();
});
</script>
 
<style scoped>
.v-btn:not(.v-btn--text):not(.v-btn--icon):not(.v-btn--fab):not(.v-btn--extended):not(.v-btn--block) {
  margin-right: 8px;
}
</style>