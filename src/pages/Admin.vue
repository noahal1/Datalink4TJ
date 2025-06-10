<template>
  <unified-page-template 
    title="系统管理"
    icon="mdi-shield-account"
    color="secondary"
  >
    <v-row>
      <v-col cols="12" md="6">
        <unified-data-table
          title="用户管理"
          icon="mdi-account-group"
          :headers="[
            { title: '用户名', key: 'name', align: 'start' },
            { title: '部门', key: 'department', align: 'start' },
            { title: '操作', key: 'actions', align: 'center', sortable: false }
          ]"
          :items="users"
          :loading="loading"
        >
          <template v-slot:item.department="{ item }">
            {{ item.department?.name }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn size="small" variant="text" color="primary" class="mr-2" @click="editUser(item)">
              <v-icon>mdi-pencil</v-icon>
              编辑
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
      
      <v-col cols="12" md="6">
        <unified-data-table
          title="部门管理"
          icon="mdi-office-building"
          :headers="[
            { title: '部门名称', key: 'name', align: 'start' },
            { title: '操作', key: 'actions', align: 'center', sortable: false }
          ]"
          :items="departments"
          :loading="loading"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn size="small" variant="text" color="primary" class="mr-2" @click="editDepartment(item)">
              <v-icon>mdi-pencil</v-icon>
              编辑
            </v-btn>
            <v-btn size="small" variant="text" color="error" @click="deleteDepartment(item)">
              <v-icon>mdi-delete</v-icon>
              删除
            </v-btn>
          </template>
          <template #actions>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showDepartmentDialog('add')">
              添加部门
            </v-btn>
          </template>
        </unified-data-table>
      </v-col>
      
      <v-col cols="12">
        <activity-history></activity-history>
      </v-col>
    </v-row>
 
    <!-- 用户对话框 -->
    <v-dialog v-model="isShowUserDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ userDialogTitle }}
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form ref="userFormRef">
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
 
    <!-- 部门对话框 -->
    <v-dialog v-model="isShowDepartmentDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ departmentDialogTitle }}
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form ref="departmentFormRef">
            <v-text-field
              v-model="departmentForm.name"
              label="部门名称"
              placeholder="请输入部门名称"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            ></v-text-field>
          </unified-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isShowDepartmentDialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveDepartment">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>
 
<script setup>
import { ref, onMounted } from 'vue';
import Message from '../utils/notification';
import ActivityHistory from '../components/admin/ActivityHistory.vue';
 
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
 
// 部门相关 
const isShowDepartmentDialog = ref(false);
const departmentDialogTitle = ref('');
const departmentForm = ref({
  name: '',
  id: ''
});
const departmentFormRef = ref(null);
 
// 获取用户列表 
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok)  {
      throw new Error('获取用户列表失败');
    }
    users.value  = await response.json(); 
  } catch (error) {
    console.error(error); 
    Message.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};
 
// 获取部门列表 
const fetchDepartments = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/departments`);
    if (!response.ok)  {
      throw new Error('获取部门列表失败');
    }
    departments.value  = await response.json(); 
  } catch (error) {
    console.error(error); 
    Message.error('获取部门列表失败');
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
    if (userDialogType.value  === 'add') {
      response = await fetch(`${API_BASE_URL}/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm.value) 
      });
      
      if (response.ok) {
        Message.success('用户添加成功');
      }
    } else if (userDialogType.value  === 'edit') {
      response = await fetch(`${API_BASE_URL}/users/${userForm.value.id}`,  {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: userForm.value.name, 
          departmentId: userForm.value.department_id  
        })
      });
    }
 
    if (!response.ok)  {
      throw new Error('保存用户失败');
    }
    const data = await response.json(); 
 
    if (userDialogType.value  === 'add') {
      users.value.push(data); 
    } else {
      const index = users.value.findIndex(user  => user.id  === data.id); 
      if (index > -1) {
        users.value.splice(index,  1, data);
      }
    }
 
    isShowUserDialog.value  = false;
  } catch (error) {
    Message.error('保存失败');
    console.error(error); 
  }
};
 
// 展示部门对话框 
const showDepartmentDialog = (type, row = {}) => {
  if (type === 'add') {
    departmentDialogTitle.value  = '添加部门';
    departmentForm.value  = {
      name: '',
      id: ''
    };
  } else if (type === 'edit') {
    departmentDialogTitle.value  = '编辑部门';
    departmentForm.value  = {
      name: row.name, 
      id: row.id  
    };
  }
  isShowDepartmentDialog.value  = true;
};
 
// 保存部门 
const saveDepartment = async () => {
  try {
    // 简单验证
    if (!departmentForm.value.name) {
      Message.warning('请输入部门名称');
      return;
    }
 
    let response;
    if (departmentForm.value.id)  {
      response = await fetch(`${API_BASE_URL}/departments/${departmentForm.value.id}`,  {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({  name: departmentForm.value.name  })
      });
    } else {
      response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({  name: departmentForm.value.name  })
      });
    }
 
    if (!response.ok)  {
      throw new Error('保存部门失败');
    }
    const data = await response.json(); 
 
    if (departmentForm.value.id)  {
      const index = departments.value.findIndex(department  => department.id  === data.id); 
      if (index > -1) {
        departments.value.splice(index,  1, data);
      }
    } else {
      departments.value.push(data); 
    }
 
    isShowDepartmentDialog.value  = false;
    Message.success('保存成功');
  } catch (error) {
    Message.error('保存失败');
    console.error(error); 
  }
};
 
// 编辑用户 
const editUser = (row) => {
  showUserDialog('edit', row);
};
 
// 删除用户 
const deleteUser = async (row) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${row.id}`,  {
      method: 'DELETE'
    });
    if (!response.ok)  {
      throw new Error('删除用户失败');
    }
    const index = users.value.findIndex(user  => user.id  === row.id); 
    if (index > -1) {
      users.value.splice(index,  1);
    }
    Message.success('删除成功');
  } catch (error) {
    Message.error('删除失败');
    console.error(error); 
  }
};
 
// 编辑部门 
const editDepartment = (row) => {
  showDepartmentDialog('edit', row);
};
 
// 删除部门 
const deleteDepartment = async (row) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${row.id}`,  {
      method: 'DELETE'
    });
    if (!response.ok)  {
      throw new Error('删除部门失败');
    }
    const index = departments.value.findIndex(department  => department.id  === row.id); 
    if (index > -1) {
      departments.value.splice(index,  1);
    }
    Message.success('删除成功');
  } catch (error) {
    Message.error('删除失败');
    console.error(error); 
  }
};
 
// 初始化数据
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