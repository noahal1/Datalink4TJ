<template>
  <div class="page-header">
    <div class="header-content">
      <div class="title-area">
        <h1 class="text-h4 font-weight-bold">{{ title }}</h1>
        <p v-if="subtitle" class="text-subtitle-1 text-medium-emphasis">{{ subtitle }}</p>
      </div>
      
      <div class="actions-area">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <v-breadcrumbs v-if="showBreadcrumbs" :items="breadcrumbs" class="pa-0 mb-4">
      <template v-slot:divider>
        <v-icon icon="mdi-chevron-right" size="small"></v-icon>
      </template>
      <template v-slot:title="{ item }">
        <v-breadcrumbs-item
          :title="item.title"
          :href="item.href"
        ></v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
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

// 根据当前路由自动生成面包屑
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
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title-area {
  flex-grow: 1;
}

.actions-area {
  display: flex;
  gap: 8px;
  align-items: center;
}

h1 {
  margin-bottom: 8px;
  line-height: 1.2;
}

/* 移动端响应式样式 */
@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .actions-area {
    width: 100%;
    justify-content: flex-start;
  }
  
  h1 {
    font-size: 1.5rem !important;
  }
}
</style> 