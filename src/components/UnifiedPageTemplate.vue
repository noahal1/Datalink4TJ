<template>
  <v-container fluid class="unified-page-container pa-0">
    <v-card class="unified-page-card" elevation="3">
      <!-- 页面标题栏 -->
      <v-card-title class="unified-page-header d-flex align-center py-4 px-6">
        <v-icon v-if="icon" class="mr-2" :color="color">{{ icon }}</v-icon>
        <div style="font-size: 1.25rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; line-height: normal; letter-spacing: normal; word-break: keep-all; word-spacing: normal;">
          {{ title }}
        </div>
        <v-spacer></v-spacer>
        <slot name="header-actions"></slot>
      </v-card-title>
      
      <!-- 页面内容区 -->
      <v-card-text class="unified-page-content pa-6">
        <!-- 面包屑导航 -->
        <v-breadcrumbs v-if="showBreadcrumbs" :items="breadcrumbs" class="pa-0 mb-4">
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right" size="small"></v-icon>
          </template>
        </v-breadcrumbs>
        
        <!-- 主要内容区 -->
        <slot></slot>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'primary'
  },
  showBreadcrumbs: {
    type: Boolean,
    default: true
  },
  customBreadcrumbs: {
    type: Array,
    default: () => []
  }
});

// 获取当前路由
const route = useRoute();

// 计算面包屑
const breadcrumbs = computed(() => {
  if (props.customBreadcrumbs.length > 0) {
    return props.customBreadcrumbs;
  }

  // 默认的首页面包屑
  const defaultBreadcrumbs = [
    {
      title: '首页',
      href: '/',
      disabled: false
    }
  ];

  // 如果是在首页，则只显示首页
  if (route.path === '/') {
    return defaultBreadcrumbs;
  }

  // 根据路由路径生成面包屑
  const pathSegments = route.path.split('/').filter(segment => segment);
  let currentPath = '';

  const routeBreadcrumbs = pathSegments.map((segment, index) => {
    currentPath += `/${segment}`;
    
    // 尝试获取匹配的路由
    const matchedRoute = route.matched[index];
    let title = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // 如果有匹配的路由且有meta.title，则使用meta.title
    if (matchedRoute && matchedRoute.meta.title) {
      title = matchedRoute.meta.title;
    }

    return {
      title,
      href: currentPath,
      disabled: index === pathSegments.length - 1 // 最后一个是当前页，不可点击
    };
  });

  return [...defaultBreadcrumbs, ...routeBreadcrumbs];
});
</script>

<style scoped>
.unified-page-container {
  margin-bottom: var(--spacing-lg);
}

.unified-page-card {
  border-radius: 12px;
  overflow: hidden;
}

.unified-page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: white;
}

.unified-page-content {
  min-height: 300px;
}

@media (max-width: 600px) {
  .unified-page-header {
    padding: 12px 16px !important;
  }
  
  .unified-page-content {
    padding: 16px !important;
  }
}
</style> 