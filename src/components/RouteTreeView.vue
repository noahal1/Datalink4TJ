<template>
  <div class="route-tree-view">
    <v-treeview
      :items="treeItems"
      item-title="title"
      item-value="id"
      item-children="children"
      density="compact"
      open-strategy="multiple"
      :open-all="false"
    >
      <template #prepend="{ item }">
        <v-icon 
          :color="item.meta?.isParentMenu ? 'info' : 'default'"
          size="small"
        >
          {{ item.meta?.icon || (item.meta?.isParentMenu ? 'mdi-folder' : 'mdi-file') }}
        </v-icon>
      </template>

      <template #append="{ item }">
        <div class="d-flex align-center">
          <!-- 权限标识 -->
          <v-chip
            v-if="item.meta?.public"
            size="x-small"
            color="success"
            variant="outlined"
            class="mr-1"
          >
            公开
          </v-chip>
          <v-chip
            v-else-if="item.meta?.requiresAuth"
            size="x-small"
            color="warning"
            variant="outlined"
            class="mr-1"
          >
            认证
          </v-chip>

          <!-- 操作按钮 -->
          <v-btn-group density="compact" variant="text">
            <v-btn @click="editRoute(item)" icon size="x-small">
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="bottom">编辑</v-tooltip>
            </v-btn>
            <v-btn @click="deleteRoute(item)" icon size="x-small" color="error">
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="bottom">删除</v-tooltip>
            </v-btn>
          </v-btn-group>
        </div>
      </template>

      <template #title="{ item }">
        <div class="d-flex align-center">
          <span class="font-weight-medium">{{ item.meta?.title || item.name }}</span>
          <v-chip
            v-if="item.meta?.hideInMenu"
            size="x-small"
            color="grey"
            variant="outlined"
            class="ml-2"
          >
            隐藏
          </v-chip>
        </div>
        <div class="text-caption text-grey">
          {{ item.path || '无路径' }}
          <span v-if="item.component" class="ml-2">
            → {{ item.component }}
          </span>
        </div>
      </template>
    </v-treeview>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  routes: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['route-selected', 'route-deleted', 'route-moved'])

// 计算属性
const treeItems = computed(() => {
  return props.routes.map(route => ({
    ...route,
    title: route.meta?.title || route.name,
    children: route.children || []
  }))
})

// 方法
const editRoute = (route) => {
  emit('route-selected', route)
}

const deleteRoute = (route) => {
  emit('route-deleted', route)
}
</script>

<style scoped>
.route-tree-view {
  min-height: 400px;
}

.v-treeview {
  background: transparent;
}

:deep(.v-treeview-item) {
  margin-bottom: 4px;
}

:deep(.v-treeview-item__content) {
  padding: 8px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

:deep(.v-treeview-item__content:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
