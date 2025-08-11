<template>
  <v-card
    class="unified-data-table"
    :elevation="elevation"
  >
    <!-- 表格标题 -->
    <v-card-title
      v-if="title || $slots.title"
      class="unified-data-table-title d-flex align-center"
    >
      <v-icon
        v-if="icon"
        class="mr-2"
        :color="iconColor"
      >
        {{ icon }}
      </v-icon>
      <slot name="title">
        {{ title }}
      </slot>
      <v-spacer />
      <slot name="actions" />
    </v-card-title>
    
    <v-divider v-if="title || $slots.title" />
    
    <!-- 表格内容 -->
    <v-card-text :class="computedContentClass">
      <slot name="pre-table" />
      
      <v-data-table
        :headers="safeHeaders"
        :items="safeItems"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :hide-default-footer="hideDefaultFooter"
        :hide-no-data="hideNoData"
        :density="density"
        :hover="hover"
        :search="search"
        :class="tableClass"
        v-bind="$attrs"
      >
        <!-- 自定义加载器 -->
        <template #loading>
          <slot name="loading">
            <v-skeleton-loader
              type="table-row-divider@3"
              class="pa-4"
            />
          </slot>
        </template>
        
        <!-- 没有数据时的显示 -->
        <template #no-data>
          <slot name="no-data">
            <div class="d-flex flex-column align-center py-6">
              <v-icon
                size="48"
                color="grey-lighten-1"
                class="mb-2"
              >
                mdi-database-off
              </v-icon>
              <div class="text-subtitle-1 text-medium-emphasis">
                暂无数据
              </div>
            </div>
          </slot>
        </template>
        
        <!-- 转发所有插槽 -->
        <template
          v-for="(_, name) in $slots"
          :key="name"
          #[name]="slotData"
        >
          <slot
            :name="name"
            v-bind="slotData"
          />
        </template>
      </v-data-table>
      
      <slot name="post-table" />
    </v-card-text>
    
    <!-- 表格底部 -->
    <v-card-actions
      v-if="$slots.footer"
      class="unified-data-table-footer"
    >
      <slot name="footer" />
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconColor: {
    type: String,
    default: 'primary'
  },
  headers: {
    type: Array,
    default: () => []
  },
  items: {
    type: Array,
    default: () => [] // 提供默认空数组
  },
  loading: {
    type: Boolean,
    default: false
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  hideDefaultFooter: {
    type: Boolean,
    default: false
  },
  hideNoData: {
    type: Boolean,
    default: false
  },
  density: {
    type: String,
    default: 'comfortable'
  },
  hover: {
    type: Boolean,
    default: true
  },
  search: {
    type: String,
    default: ''
  },
  elevation: {
    type: [Number, String],
    default: 1
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  tableClass: {
    type: String,
    default: ''
  },
  contentClass: {
    type: String,
    default: ''
  }
});

// 监听items属性，确保它始终是数组
watch(() => props.items, (newItems) => {
  if (newItems && !Array.isArray(newItems)) {
    console.error('UnifiedDataTable: items属性必须是数组，但收到了:', newItems);
  }
}, { immediate: true });

// 计算内容区的样式类
const computedContentClass = computed(() => {
  const userClass = (/** @type {any} */ (props)).contentClass || '';
  return [props.noPadding ? 'pa-0' : '', userClass].filter(Boolean).join(' ');
});

// 确保headers和items是数组的计算属性
const safeHeaders = computed(() => {
  return Array.isArray(props.headers) ? props.headers : [];
});

// 确保items是数组的计算属性
const safeItems = computed(() => {
  return Array.isArray(props.items) ? props.items : [];
});
</script>

<style scoped>
.unified-data-table {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.unified-data-table-title {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-lg);
  font-weight: 500;
  background-color: rgba(0, 0, 0, 0.02);
}

.unified-data-table-footer {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--grey-50);
}

/* 表格行悬停效果 - 优化版，避免闪烁 */
:deep(.v-data-table__tr) {
  transition: background-color 0.15s ease !important;
  position: relative;
}

:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

/* 确保表格行悬停效果优先级最高 */
:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
}

:deep(.v-data-table__th) {
  text-transform: none !important;
  white-space: nowrap;
  font-weight: 600 !important;
  color: var(--grey-700) !important;
  background-color: var(--grey-100);
}

:deep(.v-data-table__td) {
  padding: 0.5rem 1rem !important;
}

@media (max-width: 600px) {
  .unified-data-table-title {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  :deep(.v-data-table__td),
  :deep(.v-data-table__th) {
    padding: 0.4rem 0.75rem !important;
  }
}
</style> 