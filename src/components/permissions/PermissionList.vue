<template>
  <v-card class="permission-list-card">
    <v-card-title class="d-flex align-center">
      <span>权限列表</span>
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
      <!-- 模块列 -->
      <template v-slot:item.module="{ item }">
        <v-chip
          :color="getModuleColor(item.module)"
          text-color="white"
          size="small"
        >
          {{ getModuleLabel(item.module) }}
        </v-chip>
      </template>

      <!-- 权限等级列 -->
      <template v-slot:item.level="{ item }">
        <v-chip
          :color="getLevelColor(item.level)"
          text-color="white"
          size="small"
        >
          {{ getLevelLabel(item.level) }}
        </v-chip>
      </template>
      
      <!-- 部门列 -->
      <template v-slot:item.department="{ item }">
        <span v-if="item.department">{{ item.department.name }}</span>
        <span v-else class="text-grey">所有部门</span>
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
import { Module, PermissionLevel, PermissionDescriptions } from '../../utils/permissionConstants'

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
  { title: '模块', key: 'module', sortable: true },
  { title: '权限等级', key: 'level', sortable: true },
  { title: '部门', key: 'department', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
]

// 加载数据
const loadItems = (options) => {
  emit('load-items', options)
}

// 获取模块显示文本
const getModuleLabel = (moduleCode) => {
  return PermissionDescriptions.modules[moduleCode] || moduleCode
}

// 获取模块颜色
const getModuleColor = (moduleCode) => {
  const moduleColors = {
    [Module.USER]: 'indigo',
    [Module.DEPARTMENT]: 'purple',
    [Module.EHS]: 'green',
    [Module.QA]: 'amber',
    [Module.EVENT]: 'red',
    [Module.MAINT]: 'blue',
    [Module.ACTIVITY]: 'cyan',
    [Module.ROUTE]: 'pink',
    [Module.ALL]: 'deep-purple'
  }
  return moduleColors[moduleCode] || 'grey'
}

// 获取权限等级显示文本
const getLevelLabel = (levelCode) => {
  return PermissionDescriptions.levels[levelCode] || levelCode
}

// 获取权限等级颜色
const getLevelColor = (levelCode) => {
  const levelColors = {
    [PermissionLevel.READ]: 'green',
    [PermissionLevel.WRITE]: 'amber',
    [PermissionLevel.ADMIN]: 'orange',
    [PermissionLevel.SUPER_ADMIN]: 'red'
  }
  return levelColors[levelCode] || 'grey'
}
</script>

<style scoped>
.permission-list-card {
  margin-bottom: 20px;
}
</style> 