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
                  <v-menu offset-y>
                    <template v-slot:activator="{ props }">
                      <v-btn 
                        variant="text" 
                        v-bind="props"
                        class="user-menu-btn"
                      >
                        <v-avatar size="32" color="primary" class="mr-2">
                          <span class="text-white">{{ userInitials }}</span>
                        </v-avatar>
                        <span class="d-none d-sm-flex">{{ user.name }}</span>
                        <v-icon size="small" class="ml-1">mdi-chevron-down</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item>
                        <v-list-item-title class="text-subtitle-2 text-grey">
                          {{ userStore.department }} 部门
                        </v-list-item-title>
                      </v-list-item>
                      <v-divider></v-divider>
                      <v-list-item @click="logout">
                        <v-list-item-title>
                          <v-icon size="small" class="mr-2">mdi-logout</v-icon>
                          登出
                        </v-list-item-title>
                      </v-list-item>
                    </v-list>
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
      <v-list>
        <!-- 主要导航组 -->
        <v-list-subheader class="nav-group-title">ALL</v-list-subheader>
        <v-list-item
          v-for="btn in mainNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          :active="activeTab && activeTab === btn.to"
          class="nav-list-item"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>
        
        <v-divider class="my-2"></v-divider>
        <v-list-subheader class="nav-group-title">质量</v-list-subheader>
        <v-list-item
          v-for="btn in qaNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          :active="activeTab && activeTab === btn.to"
          class="nav-list-item"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>
        
        <v-divider class="my-2"></v-divider>
        <v-list-subheader class="nav-group-title">生产</v-list-subheader>
        <v-list-item
          v-for="btn in assyNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          :active="activeTab && activeTab === btn.to"
          class="nav-list-item"
        >
        <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>
        <v-list-subheader class="nav-group-title">维修</v-list-subheader>
        <v-list-item
          v-for="btn in matNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          :active="activeTab && activeTab === btn.to"
          class="nav-list-item"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>
        <v-list-subheader class="nav-group-title">PC&L</v-list-subheader>
        <v-list-item
          v-for="btn in pclNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          :active="activeTab && activeTab === btn.to"
          class="nav-list-item"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>
        <v-list-subheader class="nav-group-title">EHS</v-list-subheader>
        <v-list-item
          v-for="btn in ehsNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          :active="activeTab && activeTab === btn.to"
          class="nav-list-item"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>

        <!-- 系统管理组 -->
        <template v-if="showAdminMenu">
          <v-divider class="my-2"></v-divider>
          <v-list-subheader class="nav-group-title">系统管理</v-list-subheader>
          
          <!-- 管理菜单项 -->
          <v-list-group value="admin">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :active="activeTab && activeTab.startsWith('/admin')"
                class="nav-list-item"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-cog</v-icon>
                </template>
                <v-list-item-title>管理</v-list-item-title>
              </v-list-item>
            </template>
            
            <!-- 管理子菜单 -->
            <v-list-item
              to="/admin"
              :active="activeTab && activeTab === '/admin'"
              class="nav-list-subitem"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-account-group</v-icon>
              </template>
              <v-list-item-title>用户管理</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              to="/admin/departments"
              :active="activeTab && activeTab === '/admin/departments'"
              class="nav-list-subitem"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-office-building</v-icon>
              </template>
              <v-list-item-title>部门管理</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              to="/admin/activities"
              :active="activeTab && activeTab === '/admin/activities'"
              class="nav-list-subitem"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-history</v-icon>
              </template>
              <v-list-item-title>操作记录</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>
      </v-list>
    </v-navigation-drawer>
    
    <!-- 移动端侧边导航 -->
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item>
          <template v-slot:prepend>
            <v-avatar size="40" color="primary">
              <span class="text-white">{{ userInitials }}</span>
            </v-avatar>
          </template>
          <v-list-item-title>{{ user?.name || '访客' }}</v-list-item-title>
          <v-list-item-subtitle v-if="user?.department">
            {{ user.department }} 部门
          </v-list-item-subtitle>
        </v-list-item>
        
        <v-divider class="mb-2"></v-divider>
        
        <!-- 主要导航组 -->
        <v-list-subheader>ALL</v-list-subheader>
        <v-list-item
          v-for="btn in mainNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>
        
        <v-divider class="my-2"></v-divider>
        <v-list-subheader>质量</v-list-subheader>
        <v-list-item
          v-for="btn in qaNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>
        
        <v-divider class="my-2"></v-divider>
        <v-list-subheader>生产</v-list-subheader>
        <v-list-item
          v-for="btn in assyNavButtons"
          :key="btn.to"
          :to="btn.to"
          :value="btn.to"
          @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon>{{ btn.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ btn.label }}</v-list-item-title>
        </v-list-item>
        <!-- 系统管理组 -->
        <template v-if="showAdminMenu">
          <v-divider class="my-2"></v-divider>
          <v-list-subheader>系统管理</v-list-subheader>
          
          <!-- 管理菜单项 -->
          <v-list-group value="admin">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-cog</v-icon>
                </template>
                <v-list-item-title>管理</v-list-item-title>
              </v-list-item>
            </template>
            
            <!-- 管理子菜单 -->
            <v-list-item
              to="/admin"
              :active="activeTab && activeTab === '/admin'"
              class="nav-list-subitem"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-account-group</v-icon>
              </template>
              <v-list-item-title>用户管理</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              to="/admin/departments"
              :active="activeTab && activeTab === '/admin/departments'"
              class="nav-list-subitem"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-office-building</v-icon>
              </template>
              <v-list-item-title>部门管理</v-list-item-title>
            </v-list-item>
            
            <v-list-item
              to="/admin/activities"
              :active="activeTab && activeTab === '/admin/activities'"
              class="nav-list-subitem"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-history</v-icon>
              </template>
              <v-list-item-title>操作记录</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </template>
        
        <v-divider class="my-2"></v-divider>
        
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
      </v-list>
    </v-navigation-drawer>
    
    <v-main class="main-content">
      <transition name="fade" mode="out-in">
        <div v-if="isLoading" class="fill-height d-flex align-center justify-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </div>
        <router-view v-else v-slot="{ Component, route }">
          <transition :name="pageTransition" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </transition>
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

const app = getCurrentInstance()?.appContext.app
const userStore = useUserStore()
const user = computed(() => userStore.user)
const userDepartment = computed(() => userStore.department)
const router = useRouter()
const route = useRoute()

// 用户首字母
const userInitials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name.charAt(0).toUpperCase()
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
  
  // 向前导航 (更深层级) 使用左滑
  if (toDepth > fromDepth) {
    return 'slide-left'
  }
  // 后退导航 (更浅层级) 使用右滑
  else if (fromDepth > toDepth) {
    return 'slide-right'
  }
  // 同级导航使用淡入淡出
  return 'fade'
})

// 监听路由变化，更新活动标签
watch(() => route.path, (newPath) => {
  activeTab.value = newPath
})

// 加载用户信息
onMounted(async () => {
  try {
    const initialized = await userStore.initialize()
    if (initialized) {
      console.log('用户状态已恢复，当前部门:', userDepartment.value)
    }
    activeTab.value = route.path
    
    // 初始化全局组件引用
    if (app.config && app.config.globalProperties) {
      app.config.globalProperties.$updateGlobalComponents?.()
    }
  } catch (error) {
    console.error('初始化用户信息失败:', error)
  } finally {
    isLoading.value = false
  }
})

const logout = () => {
  userStore.logout()
  router.replace('/login')
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
}

.app-title {
  letter-spacing: 0.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.app-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* 左侧导航样式 */
.left-nav {
  top: 64px !important; 
  height: calc(100% - 64px) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-list-item {
  margin: 6px 0;
  border-radius: 0 28px 28px 0;
}

.nav-list-subitem {
  margin: 2px 0;
  padding-left: 12px !important;
  border-radius: 0 28px 28px 0;
}

.nav-group-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  padding: 0 16px;
  margin-top: 8px;
}

.nav-list-item.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.nav-list-item:hover, .nav-list-subitem:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.user-menu-btn {
  min-width: auto;
  height: 48px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 主内容区域样式 */
.main-content {
  margin-left: 0px; 
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
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
    padding: 0 8px;
  }
}

@media (max-width: 960px) {
  .main-content {
    margin-left: 0;
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
}
</style>
