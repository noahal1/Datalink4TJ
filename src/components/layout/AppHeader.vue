<template>
  <!-- 顶部应用栏 -->
  <v-app-bar
    app
    elevation="2"
    class="app-header"
  >
    <v-container fluid>
      <v-row
        align="center"
        justify="space-between"
        no-gutters
      >
        <!-- 左侧Logo区域 -->
        <v-col cols="auto">
          <div class="d-flex align-center">
            <img
              src="@/assets/logo.png"
              alt="Logo"
              class="app-logo"
            >
            <span class="text-h6 font-weight-medium ml-2 app-title d-none d-sm-flex">
              麦格纳(天津)数据管理系统
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
                  <template #activator="{ props }">
                    <v-btn 
                      variant="text" 
                      v-bind="props"
                      class="user-menu-btn"
                    >
                      <v-avatar
                        size="32"
                        color="primary"
                        class="mr-2"
                      >
                        <span class="text-white text-subtitle-2">{{ userInitials }}</span>
                      </v-avatar>
                      <span class="d-none d-sm-flex user-name">{{ userStore.user }}</span>
                      <v-icon
                        size="small"
                        class="ml-1"
                      >
                        mdi-chevron-down
                      </v-icon>
                    </v-btn>
                  </template>
                  <v-card
                    min-width="240"
                    elevation="4"
                    rounded="lg"
                    class="user-menu-card"
                  >
                    <!-- 用户信息头部 -->
                    <div class="pa-4 user-menu-header">
                      <div class="text-h6">
                        {{ userStore.user }}
                      </div>
                      <div class="text-subtitle-2">
                        {{ getDepartmentName(userStore.department) }} 部门
                      </div>
                    </div>
                    
                    <v-divider />
                    
                    <!-- 快捷菜单选项 -->
                    <v-list density="compact">
                      <v-list-item
                        to="/profile"
                        prepend-icon="mdi-account-circle"
                        title="个人资料"
                      />
                      <v-list-item
                        to="/settings"
                        prepend-icon="mdi-cog"
                        title="设置"
                      />
                      <v-list-item
                        prepend-icon="mdi-theme-light-dark"
                        title="切换主题"
                        @click="toggleTheme"
                      />
                    </v-list>
                    
                    <v-divider />
                    
                    <v-list density="compact">
                      <v-list-item
                        link
                        class="logout-item"
                        @click="logout"
                      >
                        <template #prepend>
                          <v-icon
                            size="small"
                            color="error"
                          >
                            mdi-logout
                          </v-icon>
                        </template>
                        <v-list-item-title class="text-error">
                          登出
                        </v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-menu>
              </div>
              
              <v-btn
                v-else
                variant="text"
                to="/login"
                prepend-icon="mdi-login"
              >
                登录
              </v-btn>
            </div>
          </div>
        </v-col>
          
        <!-- 移动端菜单按钮 -->
        <v-app-bar-nav-icon 
          class="d-md-none" 
          @click="toggleDrawer"
        />
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
/* 应用头部 - 现代化设计 */
.app-header {
  border-bottom: 1px solid rgba(59, 130, 246, 0.1) !important;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  ) !important;
  backdrop-filter: blur(25px) !important;
  box-shadow:
    0 2px 16px rgba(0, 0, 0, 0.04),
    0 1px 8px rgba(59, 130, 246, 0.05) !important;
  position: relative;
}

.app-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.3) 50%,
    transparent 100%
  );
}

.app-logo {
  height: 36px;
  width: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: all 0.3s ease;
}

.app-logo:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.app-title {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg,
    var(--primary-600) 0%,
    var(--primary-700) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
}

.user-menu-btn {
  border-radius: 28px;
  padding: 8px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 48px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.user-menu-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.1) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

.user-menu-btn:hover::before {
  left: 100%;
}

.user-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--grey-700);
}

.user-menu-btn:hover {
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(147, 197, 253, 0.06) 100%
  );
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.user-menu-content {
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(59, 130, 246, 0.1);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.user-menu-card {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  backdrop-filter: blur(25px);
}

.user-menu-header {
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(147, 197, 253, 0.06) 100%
  );
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
}

.user-menu-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(59, 130, 246, 0.3) 50%,
    transparent 100%
  );
}

:deep(.v-list-item) {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-list-item:hover) {
  background: linear-gradient(135deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(147, 197, 253, 0.06) 100%
  );
  transform: translateX(4px);
}

.logout-item:hover {
  background: linear-gradient(135deg,
    rgba(244, 67, 54, 0.08) 0%,
    rgba(255, 138, 128, 0.06) 100%
  ) !important;
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .app-title {
    font-size: 1rem;
  }

  .user-menu-btn {
    height: 44px;
    padding: 6px 12px;
  }

  .app-logo {
    height: 32px;
  }
}
</style>