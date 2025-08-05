<template>
  <v-container
    fluid
    class="unified-page-container pa-0"
  >
    <v-card
      class="unified-page-card"
      elevation="0"
    >
      <!-- 页面标题栏 -->
      <v-card-title class="unified-page-header d-flex align-center py-5 px-8">
        <!-- 图标容器 -->
        <div
          v-if="icon"
          class="icon-container mr-3"
        >
          <v-icon
            :color="color"
            size="28"
            class="page-icon"
          >
            {{ icon }}
          </v-icon>
        </div>

        <!-- 标题容器 -->
        <div class="title-container">
          <h2 class="page-title">
            {{ title }}
          </h2>
          <div
            v-if="subtitle"
            class="page-subtitle"
          >
            {{ subtitle }}
          </div>
        </div>

        <v-spacer />

        <!-- 操作按钮区域 -->
        <div class="header-actions">
          <slot name="header-actions" />
        </div>
      </v-card-title>

      <!-- 页面内容区 -->
      <v-card-text class="unified-page-content pa-8">
        <!-- 面包屑导航 -->
        <v-breadcrumbs
          v-if="showBreadcrumbs"
          :items="breadcrumbs"
          class="pa-0 mb-6 custom-breadcrumbs"
        >
          <template #divider>
            <v-icon
              icon="mdi-chevron-right"
              size="small"
              class="breadcrumb-divider"
            />
          </template>
          <template #item="{ item }">
            <v-breadcrumbs-item
              :href="item.href"
              :disabled="item.disabled"
              class="breadcrumb-item"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>

        <!-- 主要内容区 -->
        <div class="page-content-wrapper">
          <slot />
        </div>
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
  subtitle: {
    type: String,
    default: ''
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
/* 页面容器 - 现代化设计 */
.unified-page-container {
  min-height: 100vh;
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.02) 0%,
    rgba(147, 197, 253, 0.03) 25%,
    rgba(255, 255, 255, 0.98) 50%,
    rgba(236, 254, 255, 0.05) 75%,
    rgba(248, 250, 252, 0.08) 100%
  );
  position: relative;
  margin-bottom: var(--spacing-lg);
}

.unified-page-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.unified-page-card {
  border-radius: 24px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.08),
    0 4px 20px rgba(59, 130, 246, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  position: relative;
}

.unified-page-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    var(--primary-500) 0%,
    var(--secondary-500) 50%,
    var(--primary-500) 100%
  );
  opacity: 0.8;
}

/* 页面头部 */
.unified-page-header {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  backdrop-filter: blur(25px);
  position: relative;
  overflow: hidden;
}

.unified-page-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.2) 50%,
    transparent 100%
  );
}

/* 图标容器 */
.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(147, 197, 253, 0.08) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-container:hover {
  transform: scale(1.05);
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.15) 0%,
    rgba(147, 197, 253, 0.12) 100%
  );
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
}

.page-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 标题容器 */
.title-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--grey-900);
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg,
    var(--grey-900) 0%,
    var(--grey-700) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--grey-600);
  opacity: 0.8;
}

/* 操作按钮区域 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 页面内容 */
.unified-page-content {
  background: transparent;
  position: relative;
  min-height: 400px;
}

.page-content-wrapper {
  position: relative;
  z-index: 1;
}

/* 面包屑样式 - 现代化 */
.custom-breadcrumbs {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(248, 250, 252, 0.6) 100%
  );
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.v-breadcrumbs) {
  padding: 0;
}

.breadcrumb-item {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--grey-600);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  padding: 4px 8px;
}

.breadcrumb-item:hover {
  color: var(--primary-600);
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}

.breadcrumb-divider {
  color: var(--grey-400);
  margin: 0 8px;
  transition: color 0.2s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-page-card {
    border-radius: 16px;
    margin: 8px;
  }

  .unified-page-header {
    padding: 16px 20px !important;
  }

  .unified-page-content {
    padding: 20px !important;
  }

  .icon-container {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .custom-breadcrumbs {
    padding: 8px 12px;
    border-radius: 8px;
  }
}

@media (max-width: 600px) {
  .unified-page-card {
    border-radius: 12px;
    margin: 4px;
  }

  .unified-page-header {
    padding: 12px 16px !important;
  }

  .unified-page-content {
    padding: 16px !important;
  }

  .icon-container {
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .header-actions {
    gap: 8px;
  }
}
</style>