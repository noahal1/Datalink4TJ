<template>
  <v-app>
    <!-- 顶部应用栏 -->
    <v-app-bar app elevation="2" class="app-header">
      <v-container fluid>
        <v-row align="center" justify="space-between" no-gutters>
          <!-- 左侧Logo区域 -->
          <v-col cols="auto">
            <div class="d-flex align-center">
              <img src="@/assets/logo.png" alt="Logo" class="app-logo">
              <span class="text-h6 font-weight-medium ml-2 app-title d-none d-sm-flex">
                数据上报系统
              </span>
            </div>
          </v-col>
          
          <!-- 右侧用户区域 -->
          <v-col cols="auto">
            <div class="d-flex align-center">
              <!-- 用户信息/登录按钮 -->
              <div>
                <div v-if="user">
                  <v-menu 
                    close-on-content-click
                    location="bottom" 
                    :close-on-back="true"
                    transition="slide-y-transition"
                    content-class="user-menu-content"
                  >
                    <template v-slot:activator="{ props }">
                      <v-btn 
                        variant="text" 
                        v-bind="props"
                        class="user-menu-btn"
                        density="comfortable"
                      >
                        <v-avatar size="32" color="primary" class="mr-2">
                          <span class="text-white">{{ userInitials }}</span>
                        </v-avatar>
                        <span class="d-none d-sm-flex">{{ user }}</span>
                        <v-icon size="small" class="ml-1">mdi-chevron-down</v-icon>
                      </v-btn>
                    </template>
                    <v-card min-width="200" elevation="4" rounded="lg">
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title class="text-subtitle-2 text-grey-darken-1">
                            {{ userStore.department }} 部门
                          </v-list-item-title>
                        </v-list-item>
                        <v-divider></v-divider>
                        <v-list-item link @click="logout" class="logout-item">
                          <template v-slot:prepend>
                            <v-icon size="small" color="error">mdi-logout</v-icon>
                          </template>
                          <v-list-item-title class="text-error">
                            登出
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-menu>
                </div>
                
                <v-btn v-else variant="text" to="/login" prepend-icon="mdi-login">
                  登录
                </v-btn>
              </div>
            </div>
          </v-col>
            
          <!-- 移动端菜单按钮 -->
          <v-app-bar-nav-icon 
            class="d-md-none" 
            @click="drawer = !drawer"
          ></v-app-bar-nav-icon>
        </v-row>
      </v-container>
    </v-app-bar>
    
    <!-- 左侧导航栏 (桌面端) -->
    <v-navigation-drawer
      v-model="sideNav"
      app
      permanent
      class="d-none d-md-flex left-nav"
      width="240"
    >
      <!-- 使用动态导航组件 -->
      <dynamic-navigation>
        <!-- 底部操作按钮 -->
        <template #bottom-actions>
          <v-list-item @click="logout" v-if="user">
          <template v-slot:prepend>
              <v-icon>mdi-logout</v-icon>
          </template>
            <v-list-item-title>登出</v-list-item-title>
        </v-list-item>
          
          <v-list-item to="/login" v-else>
                <template v-slot:prepend>
              <v-icon>mdi-login</v-icon>
            </template>
            <v-list-item-title>登录</v-list-item-title>
            </v-list-item>
        </template>
      </dynamic-navigation>
    </v-navigation-drawer>
    
    <!-- 移动端侧边导航 -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      class="d-md-none"
    >
      <!-- 移动端导航使用相同的动态导航组件 -->
      <dynamic-navigation>
        <!-- 底部操作按钮 -->
        <template #bottom-actions>
        <v-list-item @click="logout" v-if="user">
          <template v-slot:prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>登出</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/login" v-else>
          <template v-slot:prepend>
            <v-icon>mdi-login</v-icon>
          </template>
          <v-list-item-title>登录</v-list-item-title>
        </v-list-item> 
        </template>
      </dynamic-navigation>
    </v-navigation-drawer>
    
    <v-main class="main-content">
      <div v-if="isLoading" class="fill-height d-flex align-center justify-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>
      <v-container v-else fluid class="px-md-4 py-md-3 px-2 py-2">
        <router-view></router-view>
      </v-container>
    </v-main>
    
    <!-- 右下角通知组件 -->
    <div class="notification-container">
      <!-- 全局通知组件 -->
      <GlobalNotification ref="globalNotification" />
      <!-- 全局轻提示组件 -->
      <GlobalSnackbar ref="globalSnackbar" />
    </div>
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

const app = getCurrentInstance()?.appContext.app
const userStore = useUserStore()
const user = computed(() => userStore.user)
const userDepartment = computed(() => userStore.department)
const router = useRouter()
const route = useRoute()

// 用户首字母
const userInitials = computed(() => {
  if (!user.value) return '?'
  return user.value.charAt(0).toUpperCase()
})

// 活动标签和抽屉状态
const activeTab = ref(null)
const drawer = ref(false)
const sideNav = ref(true) // 桌面端侧边导航状态
const isLoading = ref(true)

// 是否显示管理菜单
const showAdminMenu = computed(() => {
  return userDepartment.value === 'ADMIN'
})

// 页面过渡效果
const pageTransition = computed(() => {
  // 根据路由深度决定过渡动画方向
  const fromPath = route.from?.path || ''
  const toPath = route.path

  // 默认使用淡入淡出
  if (!fromPath) return 'fade'
  
  // 计算路由层级深度
  const fromDepth = fromPath.split('/').length
  const toDepth = toPath.split('/').length
  
  // 如果层级增加，使用向左滑动；如果层级减少，向右滑动
  if (fromDepth < toDepth) {
    return 'slide-left'
  } else if (fromDepth > toDepth) {
    return 'slide-right'
  } else {
    // 同级别页面使用淡入淡出
    return 'fade'
  }
})

// 监听路由变化，更新活动标签
watch(() => route.path, (newPath) => {
  activeTab.value = newPath
})

// 恢复用户登录状态
onMounted(async () => {
  try {
    // 尝试恢复用户会话状态
    await userStore.initialize()
    
    // 设置应用已加载状态
    isLoading.value = false
    
    // 更新全局组件引用
    app?.config.globalProperties?.$updateGlobalComponents?.()
  } catch (e) {
    isLoading.value = false
  }
})

// 监听用户登录状态变化
watch(() => user.value, (newVal) => {
  // 如果没有用户登录且当前路由需要权限，重定向到登录页
  if (!newVal && route.meta.requiresAuth) {
    router.push('/login')
  }
})

// 登出方法
const logout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    // 处理错误
  }
}

const mainNavButtons = computed(() => {
  return [
    { to: '/dashboard', icon: 'mdi-view-dashboard', label: '首页', departments: ['*'], requiresAuth: false },
    { to: '/events', icon: 'mdi-calendar-text', label: '重要事件', departments: ['*'], requiresAuth: true },
  ].filter(filterVisibleButtons)
})

const qaNavButtons = computed(() => {
  return [
    { to: '/quality', icon: 'mdi-checkbox-multiple-marked-circle-outline', label: 'GP12', departments: ['QA', 'ADMIN'], requiresAuth: true },
    { to: '/qa_others', icon: 'mdi-account-group-outline', label: '质量杂项', departments: ['QA', 'ADMIN'], requiresAuth: true },
  ].filter(filterVisibleButtons)
})
const matNavButtons = computed(() => {
  return [
    { to: '/maintenance', icon: 'mdi-wrench', label: '维修', departments: ['MAT', 'ADMIN'], requiresAuth: true },
    ].filter(filterVisibleButtons)
  })

const assyNavButtons = computed(() => {
  return [
  { to: '/assy', icon: 'mdi-hammer-wrench', label: '生产', departments: ['ASSY', 'ADMIN'], requiresAuth: true }
  ].filter(filterVisibleButtons)
})

const pclNavButtons = computed(() => {
  return [
  { to: '/pcl', icon: 'mdi-truck', label: '物流', departments: ['PCL', 'ADMIN'], requiresAuth: true }
  ].filter(filterVisibleButtons)
  })
  
const ehsNavButtons = computed(() => {
  return [
  { to: '/ehs', icon: 'mdi-security', label: 'EHS', departments: ['EHS', 'ADMIN'], requiresAuth: true }
  ].filter(filterVisibleButtons)
})
// 按钮可见性过滤函数
const filterVisibleButtons = (btn) => {
  // 如果按钮对所有部门可见
  if (btn.departments.includes('*')) return true
  
  // 如果用户未登录且按钮不需要登录
  if (!user.value && !btn.requiresAuth) return true
  
  // 如果用户已登录且该按钮对用户部门可见
  if (user.value && (btn.departments.includes(userDepartment.value) || userDepartment.value === 'ADMIN')) {
    return true
  }
  
  return false
}

// 原始按钮数据
const buttons = [
  { to: '/dashboard', icon: 'mdi-view-dashboard', label: '首页', departments: ['*'], requiresAuth: false },
  { to: '/assy', icon: 'mdi-hammer-wrench', label: '生产', departments: ['ASSY', 'ADMIN'], requiresAuth: true },
  { to: '/quality', icon: 'mdi-checkbox-multiple-marked-circle-outline', label: 'GP12', departments: ['QA', 'ADMIN'], requiresAuth: true },
  { to: '/qa_others', icon: 'mdi-account-group-outline', label: '质量杂项', departments: ['QA', 'ADMIN'], requiresAuth: true },
  { to: '/maintenance', icon: 'mdi-wrench', label: '维修', departments: ['MAT', 'ADMIN'], requiresAuth: true },
  { to: '/pcl', icon: 'mdi-truck', label: '物流', departments: ['PCL', 'ADMIN'], requiresAuth: true },
  { to: '/ehs', icon: 'mdi-security', label: 'EHS', departments: ['EHS', 'ADMIN'], requiresAuth: true },
  { to: '/gmo', icon: 'mdi-earth', label: 'GMO', departments: ['GMO', 'ADMIN'], requiresAuth: true },
  { to: '/events', icon: 'mdi-calendar-text', label: '重要事件', departments: ['*'], requiresAuth: true },
  { to: '/admin', icon: 'mdi-cog', label: '管理', departments: ['ADMIN'], requiresAuth: true },
]

// 为了向后兼容，保留原有的 visibleButtons 计算属性
const visibleButtons = computed(() => {
  return buttons.filter(filterVisibleButtons)
})

// 注册全局通知组件
app.component('GlobalNotification', GlobalNotification)
app.component('GlobalSnackbar', GlobalSnackbar)
</script>

<style>
.app-logo {
  height: 32px;
  width: auto;
  transition: all 0.3s ease;
}

.app-title {
  letter-spacing: 0.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  transition: all 0.3s ease;
}

.app-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95) !important;
  transition: all 0.3s ease;
}

/* 左侧导航样式 */
.left-nav {
  top: 64px !important; 
  height: calc(100% - 64px) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.98) !important;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.nav-list-item {
  margin: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-list-subitem {
  margin: 3px 0 3px 8px;
  padding-left: 12px !important;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-group-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  padding: 0 16px;
  margin-top: 12px;
  letter-spacing: 0.5px;
}

.nav-list-item.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.12);
  color: #1976d2;
  font-weight: 500;
  box-shadow: 0 3px 8px rgba(25, 118, 210, 0.1);
}

.nav-list-item:hover, .nav-list-subitem:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateX(2px);
}

.user-menu-content {
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}

.logout-item:hover {
  background-color: rgba(244, 67, 54, 0.08) !important;
}

.user-menu-btn {
  min-width: auto;
  height: 48px;
  border-radius: 24px;
  transition: all 0.2s ease;
}

.user-menu-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.slide-left-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* 主内容区域样式 */
.main-content {
  margin-left: 0px; 
  background-color: #f8f9fc;
  min-height: calc(100vh - 64px);
  padding: 16px;
  transition: all 0.3s ease;
}

/* 通知容器样式 */
.notification-container {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
}

/* 响应式调整 */
@media (max-width: 960px) {
  .app-header .v-container {
    padding: 0 12px;
  }
  
  .main-content {
    margin-left: 0;
    padding: 12px;
  }
}

/* 改进的响应式样式 */
@media (max-width: 600px) {
  .app-logo {
    height: 28px;
  }
  
  .v-main {
    padding-top: 8px !important;
  }
  
  .main-content {
    padding: 8px;
  }
  
  .nav-list-item {
    margin: 4px 6px;
  }
}

/* 暗色主题适配 */
.v-theme--dark .app-header {
  background-color: rgba(30, 30, 30, 0.95) !important;
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.v-theme--dark .left-nav {
  background-color: rgba(30, 30, 30, 0.98) !important;
  border-right-color: rgba(255, 255, 255, 0.08);
}

.v-theme--dark .main-content {
  background-color: #121212;
}

.v-theme--dark .nav-list-item.v-list-item--active {
  background-color: rgba(64, 150, 255, 0.15);
  box-shadow: 0 3px 8px rgba(64, 150, 255, 0.1);
}
</style>
