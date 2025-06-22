<template>
  <v-card class="permission-list-card">
    <v-card-title class="d-flex align-center">
      <span>路由权限列表</span>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="搜索权限"
        single-line
        hide-details
        density="compact"
        class="ml-2"
        style="max-width: 300px;"
      ></v-text-field>
      <v-btn color="primary" class="ml-2" @click="$emit('add-permission')">
        <v-icon left>mdi-plus</v-icon>
        添加权限
      </v-btn>
    </v-card-title>
    
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="permissions"
      :items-length="totalPermissions"
      :loading="loading"
      :search="search"
      class="elevation-1"
      @update:options="loadItems"
    >
      <!-- 权限代码列 -->
      <template v-slot:item.permission_code="{ item }">
        <v-chip
          color="info"
          text-color="white"
          size="small"
        >
          {{ item.permission_code }}
        </v-chip>
      </template>
      
      <!-- 路由列 -->
      <template v-slot:item.route="{ item }">
        <span v-if="item.route">
          <v-chip color="purple" size="small" class="mr-1">
            {{ item.route.name }}
          </v-chip>
          <span class="text-caption">{{ item.route.path }}</span>
        </span>
        <span v-else class="text-grey">未指定路由</span>
      </template>
      
      <!-- 角色列 -->
      <template v-slot:item.role="{ item }">
        <span v-if="item.role">{{ item.role.name }}</span>
        <span v-else class="text-grey">未指定角色</span>
      </template>
      
      <!-- 描述列 -->
      <template v-slot:item.description="{ item }">
        <span v-if="item.description">{{ item.description }}</span>
        <span v-else class="text-grey">无描述</span>
      </template>
      
      <!-- 操作列 -->
      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          variant="text"
          density="compact"
          color="info"
          @click="$emit('edit-permission', item)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          density="compact"
          color="error"
          @click="$emit('delete-permission', item)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PermissionHelper, PermissionDescriptions } from '../../utils/permissionConstants'

const props = defineProps({
  permissions: {
    type: Array,
    default: () => []
  },
  totalPermissions: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-permission', 'edit-permission', 'delete-permission', 'load-items'])

// 数据表格配置
const search = ref('')
const itemsPerPage = ref(10)

// 表头定义
const headers = [
  { title: '权限代码', key: 'permission_code', sortable: true },
  { title: '路由', key: 'route', sortable: false },
  { title: '角色', key: 'role', sortable: true },
  { title: '描述', key: 'description', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
]

// 加载数据
const loadItems = (options) => {
  emit('load-items', options)
}

// 获取权限描述
const getPermissionDescription = (permissionCode) => {
  return PermissionDescriptions.getDescription(permissionCode)
}
</script>

<style scoped>
.permission-list-card {
  margin-bottom: 20px;
}
</style> 