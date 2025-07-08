<template>
  <v-app>
    <div v-if="isLoading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4">加载中...</div>
    </div>
    
    <template v-else>
      <app-header v-model:drawer="drawer" />
      <v-navigation-drawer
        v-model="drawer"
        app
        :width="260"
        elevation="4"
        class="navigation-drawer"
        :height="'100vh'"
      >
        <dynamic-navigation 
          :show-bottom-actions="true" 
          :show-search="true"
          v-model:drawer="drawer"
        >
          <template v-slot:bottom-actions>        
            <v-list-item @click="forceRefresh" class="refresh-item" rounded="lg">
              <template v-slot:prepend>
                <v-icon>mdi-refresh</v-icon>
              </template>
              <v-list-item-title>刷新应用</v-list-item-title>
            </v-list-item>
          </template>
        </dynamic-navigation>
      </v-navigation-drawer>
      
      <v-main>
        <router-view v-slot="{ Component }">
          <transition :name="pageTransition" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-main>
      <global-snackbar />
    </template>
  </v-app>
</template>

<script setup>
import { useUserStore } from './stores/user.js'
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentInstance } from 'vue'
import GlobalNotification from './components/GlobalNotification.vue'
import GlobalSnackbar from './components/GlobalSnackbar.vue'
import DynamicNavigation from './components/DynamicNavigation.vue'
import AppHeader from './components/layout/AppHeader.vue'

const app = getCurrentInstance()?.appContext.app
const userStore = useUserStore()
const user = computed({
  get: () => userStore.user,
  set: (value) => {
    // 这个setter只用于特殊情况下强制更新
    console.log('强制设置用户状态:', value);
  }
})
const userDepartment = computed(() => userStore.department)
const router = useRouter()
const route = useRoute()

// 活动标签和抽屉状态
const activeTab = ref(null)
const drawer = ref(localStorage.getItem('sideNavState') === 'true' || window.innerWidth >= 1264)
const isLoading = ref(true)
const isDebugMode = ref(false) 
const showHelpDialog = ref(false)

const pageTransition = computed(() => {
  const fromPath = route.from?.path || ''
  const toPath = route.path
  if (!fromPath) return 'fade'
  
  // 计算路由层级深度
  const fromDepth = fromPath.split('/').length
  const toDepth = toPath.split('/').length

  if (fromDepth < toDepth) {
    return 'slide-left'
  } else if (fromDepth > toDepth) {
    return 'slide-right'
  } else {
    return 'fade'
  }
})

watch(() => route.path, (newPath) => {
  activeTab.value = newPath
  
  // 仅在移动设备(小于600px)上自动关闭菜单，而不是960px
  if (window.innerWidth < 600) {
    drawer.value = false
  }
})

watch(() => drawer.value, (isOpen) => {
  try {
    localStorage.setItem('sideNavState', isOpen.toString());
  } catch (e) {
    console.error('无法保存侧边栏状态', e);
  }
})

const toggleHelp = () => {
  showHelpDialog.value = !showHelpDialog.value
}

const forceRefresh = () => {
  try {
    localStorage.removeItem('recentlyUsedRoutes')
    sessionStorage.removeItem('redirectPath')
    
    // 清除其他可能的缓存
    const cacheKeys = ['sideNavState', 'theme', 'lastVisitedRoutes']
    cacheKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error(`清除缓存${key}失败`, e)
      }
    })
  } catch (e) {
    console.error('清除缓存失败', e)
  }

  window.location.reload()
}

onMounted(async () => {
  try {
    isLoading.value = true
    
    console.log('挂载时的用户状态:', {
      user: userStore.user,
      isLogin: userStore.isLogin,
      department: userStore.department,
      roles: userStore.roles
    })
    if (!userStore.isLogin) {
      await userStore.restoreSession()
    }
  } catch (error) {
    console.error('登录状态恢复失败:', error)
  } finally {
    // 延迟一点以防闪烁
    setTimeout(() => {
      isLoading.value = false
    }, 300)
  }
  window.addEventListener('resize', handleResize);
})

const handleResize = () => {
  // 在大屏幕上(>=1264px)，如果侧边栏是隐藏的，则显示它
  if (window.innerWidth >= 1264 && !drawer.value) {
    drawer.value = true;
  }
}
</script>

<style>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.navigation-drawer {
  border-right: none !important;
  height: 100vh !important;
  max-height: 100vh !important;
  overflow: hidden !important;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  ) !important;
  backdrop-filter: blur(25px) !important;
  box-shadow:
    4px 0 24px rgba(0, 0, 0, 0.08),
    2px 0 12px rgba(59, 130, 246, 0.05) !important;
}

.navigation-drawer::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(59, 130, 246, 0.2) 50%,
    transparent 100%
  );
}

.navigation-drawer .v-navigation-drawer__content {
  height: 100% !important;
  overflow: hidden !important;
  background: transparent !important;
}

.help-item, .refresh-item {
  margin: 4px 0;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.help-item:hover, .refresh-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: translateX(4px);
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-left-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-left-leave-to,
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
</style>
