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
              <el-table-column prop="role" label="角色" width="120"></el-table-column>
              <el-table-column prop="department" label="部门" width="120"></el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" @click="editUser(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="addUser">添加用户</v-btn>
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
            <v-btn color="primary" @click="addDepartment">添加部门</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const users = ref([
  { name: '用户A', role: 'admin', department: 'qa' },
  { name: '用户B', role: 'user', department: 'assy' },
  // 更多用户
])

const departments = ref([
  { name: '质量' },
  { name: '生产' },
  // 更多部门
])

const addUser = () => {
  console.log('添加用户')
  // 添加用户逻辑
}

const editUser = (user) => {
  console.log('编辑用户', user)
  // 编辑用户逻辑
}

const deleteUser = (user) => {
  console.log('删除用户', user)
  // 删除用户逻辑
}

const addDepartment = () => {
  console.log('添加部门')
  // 添加部门逻辑
}

const editDepartment = (department) => {
  console.log('编辑部门', department)
  // 编辑部门逻辑
}

const deleteDepartment = (department) => {
  console.log('删除部门', department)
  // 删除部门逻辑
}
</script>

<style scoped>
/* 添加一些基本样式 */
</style>