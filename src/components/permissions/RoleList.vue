<template>
  <v-card
    class="role-list-card"
    elevation="2"
  >
    <v-card-title class="d-flex align-center bg-primary text-white">
      <v-icon class="mr-2">
        mdi-account-group
      </v-icon>
      <span>角色列表</span>
      <v-spacer />
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="搜索角色"
        single-line
        hide-details
        density="compact"
        variant="outlined"
        bg-color="white"
        class="ml-2"
        style="max-width: 300px;"
        clearable
      />
      <v-btn
        color="white"
        variant="outlined"
        class="ml-2"
        @click="$emit('add-role')"
      >
        <v-icon class="mr-1">
          mdi-plus
        </v-icon>
        添加角色
      </v-btn>
    </v-card-title>

    <!-- 快速统计 -->
    <v-card-subtitle class="d-flex align-center py-2">
      <v-chip
        size="small"
        color="info"
        variant="outlined"
        class="mr-2"
      >
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-account-group
        </v-icon>
        总计: {{ totalRoles }}
      </v-chip>
      <v-chip
        size="small"
        color="success"
        variant="outlined"
        class="mr-2"
      >
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-account-check
        </v-icon>
        有权限: {{ rolesWithPermissions }}
      </v-chip>
      <v-chip
        size="small"
        color="warning"
        variant="outlined"
      >
        <v-icon
          size="small"
          class="mr-1"
        >
          mdi-account-alert
        </v-icon>
        无权限: {{ rolesWithoutPermissions }}
      </v-chip>
    </v-card-subtitle>
    
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
      <template #item.name="{ item }">
        <div class="d-flex align-center">
          <v-avatar
            size="32"
            :color="getRoleColor(item)"
            class="mr-3"
          >
            <v-icon
              color="white"
              size="small"
            >
              mdi-account
            </v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-bold">
              {{ item.name }}
            </div>
            <div class="text-caption text-grey">
              ID: {{ item.id }}
            </div>
          </div>
        </div>
      </template>

      <!-- 权限数量列 -->
      <template #item.permissions_count="{ item }">
        <div class="d-flex align-center">
          <v-chip
            :color="getPermissionCountColor(item.permissions?.length || 0)"
            text-color="white"
            size="small"
            class="mr-2"
          >
            {{ item.permissions?.length || 0 }}
          </v-chip>
          <v-tooltip
            v-if="item.permissions?.length > 0"
            location="bottom"
          >
            <template #activator="{ props }">
              <v-icon
                v-bind="props"
                size="small"
                color="info"
              >
                mdi-information
              </v-icon>
            </template>
            <div class="pa-2">
              <div class="text-subtitle-2 mb-1">
                权限列表:
              </div>
              <div
                v-for="permission in item.permissions?.slice(0, 5)"
                :key="permission.id"
                class="text-caption"
              >
                • {{ permission.module }}.{{ permission.level }}
              </div>
              <div
                v-if="item.permissions?.length > 5"
                class="text-caption text-grey"
              >
                ... 还有 {{ item.permissions.length - 5 }} 个权限
              </div>
            </div>
          </v-tooltip>
        </div>
      </template>

      <!-- 描述列 -->
      <template #item.description="{ item }">
        <div
          class="text-truncate"
          style="max-width: 300px;"
          :title="item.description"
        >
          {{ item.description || '无描述' }}
        </div>
      </template>

      <!-- 状态列 -->
      <template #item.status="{ item }">
        <v-chip
          :color="item.permissions?.length > 0 ? 'success' : 'warning'"
          size="small"
          variant="outlined"
        >
          <v-icon
            size="small"
            class="mr-1"
          >
            {{ item.permissions?.length > 0 ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          {{ item.permissions?.length > 0 ? '活跃' : '待配置' }}
        </v-chip>
      </template>
      
      <!-- 操作列 -->
      <template #item.actions="{ item }">
        <v-btn-group
          density="compact"
          variant="outlined"
        >
          <v-btn
            size="small"
            color="primary"
            @click="$emit('edit-role', item)"
          >
            <v-icon size="small">
              mdi-pencil
            </v-icon>
            <v-tooltip
              activator="parent"
              location="bottom"
            >
              编辑角色
            </v-tooltip>
          </v-btn>
          <v-btn
            size="small"
            color="info"
            @click="$emit('manage-routes', item)"
          >
            <v-icon size="small">
              mdi-routes
            </v-icon>
            <v-tooltip
              activator="parent"
              location="bottom"
            >
              管理路由权限
            </v-tooltip>
          </v-btn>
          <v-btn
            size="small"
            color="error"
            :disabled="item.permissions?.length > 0"
            @click="$emit('delete-role', item)"
          >
            <v-icon size="small">
              mdi-delete
            </v-icon>
            <v-tooltip
              activator="parent"
              location="bottom"
            >
              {{ item.permissions?.length > 0 ? '有权限的角色不能删除' : '删除角色' }}
            </v-tooltip>
          </v-btn>
        </v-btn-group>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

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

const emit = defineEmits(['add-role', 'edit-role', 'delete-role', 'manage-routes', 'load-items'])

// 数据表格配置
const search = ref('')
const itemsPerPage = ref(10)

// 计算属性
const rolesWithPermissions = computed(() => {
  return props.roles.filter(role => role.permissions?.length > 0).length
})

const rolesWithoutPermissions = computed(() => {
  return props.roles.filter(role => !role.permissions || role.permissions.length === 0).length
})

// 表头定义
const headers = [
  { title: '角色信息', key: 'name', sortable: true, width: '25%' },
  { title: '描述', key: 'description', sortable: true, width: '30%' },
  { title: '权限数量', key: 'permissions_count', sortable: true, width: '15%' },
  { title: '状态', key: 'status', sortable: true, width: '15%' },
  { title: '操作', key: 'actions', sortable: false, align: 'center', width: '15%' }
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

// 获取角色颜色
const getRoleColor = (role) => {
  const permissionCount = role.permissions?.length || 0
  if (permissionCount === 0) return 'grey'
  if (permissionCount < 3) return 'blue'
  if (permissionCount < 6) return 'green'
  if (permissionCount < 10) return 'orange'
  return 'red'
}
</script>

<style scoped>
.role-list-card {
  margin-bottom: 20px;
}
</style> 