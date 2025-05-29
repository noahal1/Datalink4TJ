<template>
  <div class="enhanced-data-table">
    <!-- 表格标题和功能按钮区 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5 font-weight-medium" v-if="title">{{ title }}</h2>
      
      <div class="d-flex align-center">
        <!-- 搜索框 -->
        <v-text-field
          v-if="showSearch"
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="搜索..."
          density="compact"
          hide-details
          class="search-field mr-3"
          variant="outlined"
          @update:model-value="debouncedSearch"
        ></v-text-field>

        <!-- 刷新按钮 -->
        <v-btn
          v-if="showRefresh"
          variant="text"
          icon="mdi-refresh"
          @click="refreshData"
          :loading="loading"
          class="mr-2"
        ></v-btn>
        
        <!-- 自定义工具栏按钮插槽 -->
        <slot name="toolbar-buttons"></slot>
      </div>
    </div>
    
    <!-- 表格主体 -->
    <v-card class="data-table-card position-relative">
      <!-- 加载遮罩 -->
      <loading-overlay :loading="loading" />
      
      <!-- 使用Vuetify数据表格 -->
      <v-data-table
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="localItems"
        :search="searchQuery"
        :loading="loading"
        :items-per-page-options="itemsPerPageOptions"
        class="elevation-1"
      >
        <!-- 空状态 -->
        <template v-slot:no-data>
          <div class="text-center pa-5">
            <v-icon size="large" color="grey lighten-1" class="mb-2">
              mdi-database-off
            </v-icon>
            <div class="text-subtitle-1 text-grey">{{ noDataText }}</div>
          </div>
        </template>
        
        <!-- 自定义列插槽 - 动态处理 -->
        <template v-for="(_, slotName) in $slots" #[slotName]="slotData">
          <slot :name="slotName" v-bind="slotData"></slot>
        </template>
        
        <!-- 脚注插槽 -->
        <template v-slot:bottom>
          <slot name="footer"></slot>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { debounce } from 'lodash-es';
import LoadingOverlay from './LoadingOverlay.vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  headers: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  noDataText: {
    type: String,
    default: '没有数据'
  },
  itemsPerPageOptions: {
    type: Array,
    default: () => [5, 10, 15, 25, 50]
  }
});

const emit = defineEmits(['refresh', 'search']);

// 本地状态
const searchQuery = ref('');
const itemsPerPage = ref(10);
const localItems = ref([]);

// 监听items变化
watch(() => props.items, (newItems) => {
  localItems.value = [...newItems];
}, { deep: true });

// 初始化时设置数据
onMounted(() => {
  localItems.value = [...props.items];
});

// 搜索处理
const debouncedSearch = debounce(() => {
  emit('search', searchQuery.value);
}, 300);

// 刷新数据方法
const refreshData = () => {
  emit('refresh');
};

// 暴露方法给父组件
defineExpose({
  refreshData,
  clearSearch: () => {
    searchQuery.value = '';
  }
});
</script>

<style scoped>
.enhanced-data-table {
  width: 100%;
}

.search-field {
  max-width: 240px;
}

.data-table-card {
  overflow: hidden;
  position: relative;
}
</style> 