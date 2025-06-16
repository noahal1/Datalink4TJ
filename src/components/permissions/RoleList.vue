<template>
  <v-card class="role-list-card">
    <v-card-title class="d-flex align-center">
      <span>角色列表</span>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="搜索角色"
        single-line
        hide-details
        density="compact"
        class="ml-2"
        style="max-width: 300px;"
      ></v-text-field>
      <v-btn color="primary" class="ml-2" @click="$emit('add-role')">
        <v-icon left>mdi-plus</v-icon>
        添加角色
      </v-btn>
    </v-card-title>
    
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="roles"
      :items-length="totalRoles"
      :loading="loading"
      :search="search"
      class="elevation-1"
      @update:options="loadItems"
    >
      <!-- 角色名称列 -->
      <template v-slot:item.name="{ item }">
        <div class="font-weight-bold">{{ item.name }}</div>
      </template>
      
      <!-- 权限数量列 -->
      <template v-slot:item.permissions_count="{ item }">
        <v-chip
          :color="getPermissionCountColor(item.permissions?.length || 0)"
          text-color="white"
          size="small"
        >
          {{ item.permissions?.length || 0 }}
        </v-chip>
      </template>
      
      <!-- 描述列 -->
      <template v-slot:item.description="{ item }">
        <div class="text-truncate" style="max-width: 300px;" :title="item.description">
          {{ item.description || '无描述' }}
        </div>
      </template>
      
      <!-- 操作列 -->
      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          variant="text"
          density="compact"
          color="info"
          @click="$emit('edit-role', item)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          density="compact"
          color="info"
          @click="$emit('manage-permissions', item)"
        >
          <v-icon>mdi-shield-account</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          density="compact"
          color="error"
          @click="$emit('delete-role', item)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  roles: {
    type: Array,
    default: () => []
  },
  totalRoles: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-role', 'edit-role', 'delete-role', 'manage-permissions', 'load-items'])

// 数据表格配置
const search = ref('')
const itemsPerPage = ref(10)

// 表头定义
const headers = [
  { title: '角色名称', key: 'name', sortable: true },
  { title: '描述', key: 'description', sortable: true },
  { title: '权限数量', key: 'permissions_count', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
]

// 加载数据
const loadItems = (options) => {
  emit('load-items', options)
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
.role-list-card {
  margin-bottom: 20px;
}
</style> 