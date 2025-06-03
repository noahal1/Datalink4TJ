<template>
  <v-app>
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
          
          <!-- 右侧导航和用户区域 -->
          <v-col cols="auto" class="d-none d-md-flex">
            <div class="d-flex align-center">
              <!-- 导航按钮 -->
              <div class="nav-buttons d-flex">
                <v-btn
                  v-for="btn in visibleButtons" 
                  :key="btn.to" 
                  :to="btn.to"
                  variant="text"
                  class="nav-btn"
                >
                  <v-icon size="small" class="mr-1">{{ btn.icon }}</v-icon>
                  {{ btn.label }}
                </v-btn>
              </div>
              
              <!-- 用户信息/登录按钮 -->
              <div class="ml-4">
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
        
        <v-list-item
          v-for="btn in visibleButtons"
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
    
    <v-main>
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
    
    <!-- 全局通知组件 -->
    <GlobalNotification ref="globalNotification" />
  </v-app>
</template>

<script setup>
import { useUserStore } from './stores/user.js'
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

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
const isLoading = ref(true)

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

const visibleButtons = computed(() => {
  return buttons.filter(btn => {
    // 如果按钮对所有部门可见
    if (btn.departments.includes('*')) return true
    
    // 如果用户未登录且按钮不需要登录
    if (!user.value && !btn.requiresAuth) return true
    
    // 如果用户已登录且该按钮对用户部门可见
    if (user.value && (btn.departments.includes(userDepartment.value) || userDepartment.value === 'ADMIN')) {
      return true
    }
    
    return false
  })
})

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
  { to: '/admin', icon: 'mdi-security', label: '管理', departments: ['ADMIN'], requiresAuth: true },
]
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

.nav-buttons {
  display: flex;
  flex-wrap: nowrap;
  margin-right: 4px;
}

.nav-btn {
  padding: 0 10px;
  font-size: 0.875rem;
  height: 36px;
  margin: 0 2px;
  border-radius: 4px;
}

.nav-btn:hover {
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

/* 响应式调整 */
@media (max-width: 960px) {
  .app-header .v-container {
    padding: 0 8px;
  }
}

/* 页面容器样式 */
.v-main {
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
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
