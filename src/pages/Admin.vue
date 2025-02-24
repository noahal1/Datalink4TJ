<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-account-group</v-icon>
            用户管理 
          </v-card-title>
          <v-card-text>
            <el-table :data="users" style="width: 100%">
              <el-table-column prop="name" label="用户名" width="150"></el-table-column>
              <el-table-column prop="department.name"  label="部门" width="120"></el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" @click="editUser(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </v-card-text>
          <v-card-actions>
            <v-btn color="black" @click="showUserDialog('add')">添加用户</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-office-building</v-icon>
            部门管理 
          </v-card-title>
          <v-card-text>
            <el-table :data="departments" style="width: 100%">
              <el-table-column prop="name" label="部门名称" width="150"></el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" @click="editDepartment(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteDepartment(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="showDepartmentDialog('add')">添加部门</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
 
    <!-- 用户对话框 -->
    <el-dialog :title="userDialogTitle" v-model="isShowUserDialog">
      <el-form :model="userForm" ref="userFormRef" label-width="80px">
        <el-form-item label="用户名" prop="name">
          <el-input v-model="userForm.name"  placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="userDialogType === 'add'">
          <el-input type="password" v-model="userForm.password"  placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-select v-model="userForm.department_id"  placeholder="请选择部门">
            <el-option 
              v-for="department in departments"
              :key="department.id" 
              :label="department.name" 
              :value="department.id" 
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isShowUserDialog = false">取 消</el-button>
          <el-button type="primary" @click="saveUser">确 定</el-button>
        </span>
      </template>
    </el-dialog>
 
    <!-- 部门对话框 -->
    <el-dialog :title="departmentDialogTitle" v-model="isShowDepartmentDialog">
      <el-form :model="departmentForm" ref="departmentFormRef" label-width="80px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="departmentForm.name"  placeholder="请输入部门名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isShowDepartmentDialog = false">取 消</el-button>
          <el-button type="primary" @click="saveDepartment">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </v-container>
</template>
 
<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
 
// 数据初始化 
const users = ref([]);
const departments = ref([]);
 
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
  try {
    const response = await fetch('http://127.0.0.1:8000/users');
    if (!response.ok)  {
      throw new Error('获取用户列表失败');
    }
    users.value  = await response.json(); 
  } catch (error) {
    console.error(error); 
  }
};
 
// 获取部门列表 
const fetchDepartments = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/departments');
    if (!response.ok)  {
      throw new Error('获取部门列表失败');
    }
    departments.value  = await response.json(); 
  } catch (error) {
    console.error(error); 
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
    const isValid = await validateUserForm();
    if (!isValid) return;
 
    let response;
    if (userDialogType.value  === 'add') {
      response = await fetch('http://127.0.0.1:8000/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm.value) 
      });
    } else if (userDialogType.value  === 'edit') {
      response = await fetch(`http://127.0.0.1:8000/users/${userForm.value.id}`,  {
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
    ElMessage({
      type: 'success',
      message: '保存成功'
    });
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '保存失败'
    });
    console.error(error); 
  }
};
 
// 验证用户表单 
const validateUserForm = () => {
  return new Promise((resolve) => {
    if (userFormRef.value)  {
      userFormRef.value.validate((valid)  => {
        resolve(valid);
      });
    } else {
      resolve(false);
    }
  });
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
    const isValid = await validateDepartmentForm();
    if (!isValid) return;
 
    let response;
    if (departmentForm.value.id)  {
      response = await fetch(`http://127.0.0.1:8000/departments/${departmentForm.value.id}`,  {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({  name: departmentForm.value.name  })
      });
    } else {
      response = await fetch('http://127.0.0.1:8000/departments', {
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
    ElMessage({
      type: 'success',
      message: '保存成功'
    });
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '保存失败'
    });
    console.error(error); 
  }
};
 
// 验证部门表单 
const validateDepartmentForm = () => {
  return new Promise((resolve) => {
    if (departmentFormRef.value)  {
      departmentFormRef.value.validate((valid)  => {
        resolve(valid);
      });
    } else {
      resolve(false);
    }
  });
};
 
// 编辑用户 
const editUser = (row) => {
  showUserDialog('edit', row);
};
 
// 删除用户 
const deleteUser = async (row) => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/users/${row.id}`,  {
      method: 'DELETE'
    });
    if (!response.ok)  {
      throw new Error('删除用户失败');
    }
    const index = users.value.findIndex(user  => user.id  === row.id); 
    if (index > -1) {
      users.value.splice(index,  1);
    }
    ElMessage({
      type: 'success',
      message: '删除成功'
    });
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '删除失败'
    });
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
    const response = await fetch(`/departments/${row.id}`,  {
      method: 'DELETE'
    });
    if (!response.ok)  {
      throw new Error('删除部门失败');
    }
    const index = departments.value.findIndex(department  => department.id  === row.id); 
    if (index > -1) {
      departments.value.splice(index,  1);
    }
    ElMessage({
      type: 'success',
      message: '删除成功'
    });
  } catch (error) {
    ElMessage({
      type: 'error',
      message: '删除失败'
    });
    console.error(error); 
  }
};
 
// 初始化数据 1
onMounted(() => {
  fetchUsers();
  fetchDepartments();
});
</script>
 
<style scoped>
.el-table {
  border-radius: 4px;
  overflow: hidden;
}
.v-card {
  padding: 16px;
}
.v-btn:not(.v-btn--text):not(.v-btn--icon):not(.v-btn--fab):not(.v-btn--extended):not(.v-btn--block) {
  margin-right: 8px;
}
</style>