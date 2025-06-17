<template>
  <div class="dynamic-nav">
    <!-- 主导航区域 -->
    <v-list density="compact">
      <!-- 加载状态显示 -->
      <div v-if="loading" class="pa-4 d-flex justify-center align-center">
        <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
        <span class="ml-2 text-body-2">加载导航菜单...</span>
      </div>
      
      <!-- 加载失败显示 -->
      <div v-else-if="loadError" class="pa-4 text-center">
        <v-icon color="error" icon="mdi-alert-circle-outline"></v-icon>
        <div class="text-body-2 text-error mt-2">加载菜单失败</div>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          class="mt-2"
          @click="retryLoadRoutes"
        >
          重试
        </v-btn>
      </div>
      
      <!-- 路由分组部分 -->
      <template v-else v-for="(group, groupIndex) in navigationGroups" :key="groupIndex">
        <!-- 分组标题 -->
        <v-list-subheader v-if="group.title" class="nav-group-title">
          {{ group.title }}
        </v-list-subheader>
        
        <!-- 组内路由项 -->
        <template v-for="(route, routeIndex) in group.routes" :key="route.path || routeIndex">
          <!-- 常规菜单项 -->
          <v-list-item
            v-if="!route.children || route.children.length === 0"
            :to="route.path"
            :value="route.path"
            :active="isActiveRoute(route.path)"
            class="nav-list-item"
          >
            <template v-slot:prepend>
              <v-icon>{{ route.meta?.icon || 'mdi-link' }}</v-icon>
            </template>
            <v-list-item-title>{{ route.meta?.title || route.name || '未命名' }}</v-list-item-title>
          </v-list-item>
          
          <!-- 有子菜单的菜单项 -->
          <div v-else class="nav-group-wrapper">
            <!-- 父菜单项 -->
            <v-list-item
              @click="toggleGroup(route.path || routeIndex)"
              :active="isActiveGroupRoute(route)"
              class="nav-list-item nav-group-header"
            >
              <template v-slot:prepend>
                <v-icon>{{ route.meta?.icon || 'mdi-folder' }}</v-icon>
              </template>
              <v-list-item-title>{{ route.meta?.title || route.name || '未命名' }}</v-list-item-title>
              <template v-slot:append>
                <v-icon :icon="openGroups.includes(route.path || routeIndex) ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
              </template>
            </v-list-item>
            
            <!-- 子菜单项 -->
            <v-expand-transition>
              <div v-show="openGroups.includes(route.path || routeIndex)" class="nav-child-items">
                <div class="nav-group-indicator"></div>
                <v-list-item
                  v-for="(childRoute, childIndex) in route.children"
                  :key="childRoute.path || childIndex"
                  :to="childRoute.path"
                  :value="childRoute.path"
                  :active="isActiveRoute(childRoute.path)"
                  class="nav-list-subitem"
                >
                  <template v-slot:prepend>
                    <v-icon size="small">{{ childRoute.meta?.icon || 'mdi-link' }}</v-icon>
                  </template>
                  <v-list-item-title>{{ childRoute.meta?.title || childRoute.name || '未命名' }}</v-list-item-title>
                </v-list-item>
              </div>
            </v-expand-transition>
          </div>
        </template>
        
        <!-- 分组间分隔线 -->
        <v-divider v-if="groupIndex < navigationGroups.length - 1" class="my-2"></v-divider>
      </template>
      
      <!-- 底部固定菜单项 -->
      <template v-if="showBottomActions && !loading && !loadError">
        <v-divider class="my-2"></v-divider>
        <slot name="bottom-actions"></slot>
      </template>
    </v-list>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePermissionStore } from '../stores/permission'
import { useUserStore } from '../stores/user'
import routeService from '../services/routeService'

const props = defineProps({
  // 导航分组配置
  groupConfig: {
    type: Array,
    default: () => [
      { id: 'main', title: '主菜单', filter: route => !route.meta?.group || route.meta.group === 'main' },
      { id: 'qa', title: '质量', filter: route => route.meta?.group === 'qa' },
      { id: 'assy', title: '生产', filter: route => route.meta?.group === 'assy' },
      { id: 'mat', title: '维修', filter: route => route.meta?.group === 'mat' },
      { id: 'pcl', title: '物流', filter: route => route.meta?.group === 'pcl' },
      { id: 'ehs', title: 'EHS', filter: route => route.meta?.group === 'ehs' },
      { id: 'admin', title: '系统管理', filter: route => route.meta?.group === 'admin' }
    ]
  },
  // 是否显示底部操作区
  showBottomActions: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()
const userStore = useUserStore()
const loading = ref(true)
const loadError = ref(false)
const navRoutes = ref([])
const openGroups = ref([]) // 当前展开的菜单组

// 当前活动路由
const activeRoute = computed(() => route.path)

// 检查路由是否激活
const isActiveRoute = (path) => {
  if (!path) return false
  // 使用完全匹配或者路径前缀匹配
  return activeRoute.value === path || 
         (path !== '/' && activeRoute.value.startsWith(`${path}/`))
}

// 检查分组路由是否激活
const isActiveGroupRoute = (routeObj) => {
  if (!routeObj) return false
  
  // 检查当前路径是否以分组路径开头
  if (routeObj.path && routeObj.path !== '/' && activeRoute.value.startsWith(routeObj.path)) {
    return true
  }
  
  // 检查子路由是否激活
  if (routeObj.children && routeObj.children.length > 0) {
    return routeObj.children.some(child => {
      if (!child.path) return false
      return isActiveRoute(child.path)
    })
  }
  
  return false
}

// 切换菜单组展开状态
const toggleGroup = (groupId) => {
  const index = openGroups.value.indexOf(groupId)
  if (index > -1) {
    // 如果已经打开，则关闭
    openGroups.value.splice(index, 1)
  } else {
    // 否则关闭所有其他菜单，只打开当前菜单
    openGroups.value = [groupId]
  }
}

// 导航分组
const navigationGroups = computed(() => {
  // 按分组配置将路由分类
  const groups = props.groupConfig.map(group => {
    return {
      id: group.id,
      title: group.title,
      routes: navRoutes.value.filter(route => group.filter(route))
    }
  })
  
  // 只返回有路由的分组
  return groups.filter(group => group.routes.length > 0)
})

// 自动展开包含当前活动路由的分组
const updateActiveGroups = () => {
  const newOpenGroups = []
  
  navigationGroups.value.forEach(group => {
    group.routes.forEach((route, index) => {
      if (route.children && route.children.length > 0) {
        const groupKey = route.path || `group-${group.id}-${index}`
        if (isActiveGroupRoute(route)) {
          newOpenGroups.push(groupKey)
        }
      }
    })
  })
  
  // 更新打开的组
  if (newOpenGroups.length > 0) {
    openGroups.value = newOpenGroups
  }
}

// 重置重试计数
const resetRetryCount = () => {
  if (window._navRetryCount) {
    window._navRetryCount = 0
  }
}

// 重试加载路由
const retryLoadRoutes = () => {
  resetRetryCount()
  loadRoutes()
}

// 初始加载路由
const loadRoutes = async () => {
  loading.value = true
  loadError.value = false
  
  try {
    // 确保权限已初始化
    if (!permissionStore.roles.length) {
      await permissionStore.initialize()
    }

    // 获取当前用户可见的导航菜单
    const routes = await routeService.getNavigationMenu()
    
    // 确保所有路由都有有效的path属性
    const validateRoutes = (routeList) => {
      return routeList.map(route => {
        // 确保路由有有效的path
        if (!route.path) {
          route.path = route.name ? `/${route.name.toLowerCase().replace(/\s+/g, '-')}` : null
        }
        
        // 递归处理子路由
        if (route.children && route.children.length > 0) {
          route.children = validateRoutes(route.children)
        }
        
        return route
      }).filter(route => route.path) // 过滤掉没有path的路由
    }
    
    navRoutes.value = validateRoutes(routes)
    resetRetryCount()
    
    // 加载完路由后，自动展开当前活动路由所在的组
    updateActiveGroups()
  } catch (error) {
    loadError.value = true
    
    // 失败后尝试再次加载，最多重试3次
    if (!window._navRetryCount) {
      window._navRetryCount = 1;
    } else if (window._navRetryCount < 3) {
      window._navRetryCount++;
    } else {
      return;
    }
    
    setTimeout(() => loadRoutes(), 1000 * window._navRetryCount);
  } finally {
    loading.value = false
  }
}

// 监听路由变化，更新活动分组
watch(() => route.path, () => {
  updateActiveGroups()
})

// 监听用户登录状态变化
watch(() => userStore.isLogin, (newLoginState) => {
  if (newLoginState) {
    // 用户登录后，重新加载路由
    loadRoutes()
  } else {
    // 用户登出后，清空路由
    navRoutes.value = []
  }
}, { immediate: true })

// 监听权限变化
watch(() => permissionStore.roles.length, (newLength) => {
  if (userStore.isLogin && newLength > 0) {
    // 权限初始化后，重新加载路由
    loadRoutes()
  }
})

// 组件挂载时加载路由
onMounted(() => {
  loadRoutes()
})
</script>

<style scoped>
.dynamic-nav {
  width: 100%;
}

.nav-group-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--v-primary-base, #1976d2);
  letter-spacing: 0.1em;
  padding-left: 16px;
  opacity: 0.8;
}

.nav-list-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.nav-list-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: var(--v-primary-base, #1976d2);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-list-item.v-list-item--active::before {
  opacity: 1;
}

.nav-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: translateX(2px);
}

.nav-list-item.nav-group-header {
  font-weight: 500;
}

.nav-list-item.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: var(--v-primary-base, #1976d2);
  font-weight: 500;
}

.nav-group-header {
  cursor: pointer;
}

.nav-group-indicator {
  position: absolute;
  left: 22px;
  width: 2px;
  height: calc(100% - 12px);
  background-color: rgba(var(--v-theme-primary), 0.2);
  border-radius: 1px;
}

.nav-child-items {
  padding-top: 4px;
  padding-bottom: 4px;
  position: relative;
  overflow: hidden;
}

.nav-list-subitem {
  border-radius: 6px;
  margin: 2px 8px 2px 20px;
  padding-left: 28px !important;
  transition: all 0.2s ease-in-out;
}

.nav-list-subitem:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: translateX(2px);
}

.nav-group-wrapper {
  margin: 4px 0;
  position: relative;
}

/* 动画效果增强 */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>