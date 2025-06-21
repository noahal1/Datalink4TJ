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
                      density="comfortable"
                    >
                      <v-avatar size="32" color="primary" class="mr-2">
                        <span class="text-white">{{ userInitials }}</span>
                      </v-avatar>
                      <span class="d-none d-sm-flex">{{ userStore.user }}</span>
                      <v-icon size="small" class="ml-1">mdi-chevron-down</v-icon>
                    </v-btn>
                  </template>
                  <v-card min-width="200" elevation="4" rounded="lg">
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title class="text-subtitle-2 text-grey-darken-1">
                          {{ getDepartmentName(userStore.department) }} 部门
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
          @click="toggleDrawer"
        ></v-app-bar-nav-icon>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  drawer: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:drawer']);

const userStore = useUserStore();
const router = useRouter();

// 切换移动端抽屉菜单
const toggleDrawer = () => {
  emit('update:drawer', !props.drawer);
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
  transition: background-color 0.2s;
}

.user-menu-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.user-menu-content {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.logout-item:hover {
  background-color: rgba(244, 67, 54, 0.08);
}
</style> 