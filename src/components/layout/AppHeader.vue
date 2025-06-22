<template>
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
              <div v-if="userStore.isLogin">
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
                    >
                      <v-avatar size="32" color="primary" class="mr-2">
                        <span class="text-white text-subtitle-2">{{ userInitials }}</span>
                      </v-avatar>
                      <span class="d-none d-sm-flex user-name">{{ userStore.user }}</span>
                      <v-icon size="small" class="ml-1">mdi-chevron-down</v-icon>
                    </v-btn>
                  </template>
                  <v-card min-width="240" elevation="4" rounded="lg" class="user-menu-card">
                    <!-- 用户信息头部 -->
                    <div class="pa-4 user-menu-header">
                      <div class="text-h6">{{ userStore.user }}</div>
                      <div class="text-subtitle-2">{{ getDepartmentName(userStore.department) }} 部门</div>
                    </div>
                    
                    <v-divider></v-divider>
                    
                    <!-- 快捷菜单选项 -->
                    <v-list density="compact">
                      <v-list-item to="/profile" prepend-icon="mdi-account-circle" title="个人资料"></v-list-item>
                      <v-list-item to="/settings" prepend-icon="mdi-cog" title="设置"></v-list-item>
                      <v-list-item @click="toggleTheme" prepend-icon="mdi-theme-light-dark" title="切换主题"></v-list-item>
                    </v-list>
                    
                    <v-divider></v-divider>
                    
                    <v-list density="compact">
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
          @click="toggleDrawer"
        ></v-app-bar-nav-icon>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from 'vuetify'

const props = defineProps({
  drawer: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:drawer']);

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const theme = useTheme();

// 切换移动端抽屉菜单
const toggleDrawer = () => {
  // 切换抽屉状态
  const newState = !props.drawer;
  emit('update:drawer', newState);
  
  // 在移动设备上点击按钮时记住用户的选择
  try {
    localStorage.setItem('sideNavState', newState.toString());
  } catch (e) {
    console.error('无法保存侧边栏状态', e);
  }
};

// 添加一个方法专门用于打开侧边栏
const openDrawer = () => {
  emit('update:drawer', true);
  try {
    localStorage.setItem('sideNavState', 'true');
  } catch (e) {
    console.error('无法保存侧边栏状态', e);
  }
};

// 用户首字母
const userInitials = computed(() => {
  if (!userStore.user) return '';
  return userStore.user.charAt(0).toUpperCase();
});

// 获取部门名称
const getDepartmentName = (departmentId) => {
  // 应从部门数据中获取或使用缓存
  return departmentId || '未分配';
};

// 登出
const logout = () => {
  userStore.logout();
  router.push('/login');
};

// 切换主题
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
  
  // 保存主题设置
  try {
    localStorage.setItem('theme', theme.global.name.value);
  } catch (e) {
    console.error('无法保存主题设置', e);
  }
};

// 组件挂载时加载主题
onMounted(() => {
  // 从本地存储加载主题设置
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      theme.global.name.value = savedTheme;
    }
  } catch (e) {
    console.error('无法加载主题设置', e);
  }
});
</script>

<style scoped>
.app-header {
  border-bottom: 1px solid var(--v-border-color);
  background-color: #fff;
}

.app-logo {
  height: 32px;
  width: auto;
}

.app-title {
  color: var(--v-primary-base);
  font-weight: 500;
}

.user-menu-btn {
  border-radius: 24px;
  padding: 6px 12px;
  transition: all 0.2s ease;
  height: 40px;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.user-menu-content {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.user-menu-header {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.logout-item:hover {
  background-color: rgba(244, 67, 54, 0.08);
}
</style> 