<template>
  <unified-page-template 
    title="系统设置"
    subtitle="个性化您的使用体验"
    icon="mdi-cog"
    color="primary"
  >
    <v-row>
      <!-- 左侧：设置分类导航 -->
      <v-col
        cols="12"
        md="3"
      >
        <v-card elevation="2">
          <v-list
            density="compact"
            nav
          >
            <v-list-subheader>设置分类</v-list-subheader>
            <v-list-item
              v-for="category in settingsCategories"
              :key="category.value"
              :value="category.value"
              :active="activeCategory === category.value"
              :prepend-icon="category.icon"
              :title="category.title"
              @click="activeCategory = category.value"
            />
          </v-list>
        </v-card>
      </v-col>
      
      <!-- 右侧：设置内容 -->
      <v-col
        cols="12"
        md="9"
      >
        <v-card elevation="2">
          <!-- 外观设置 -->
          <div v-if="activeCategory === 'appearance'">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon class="mr-2">
                mdi-palette
              </v-icon>
              外观设置
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-6">
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      主题模式
                    </h4>
                    <v-radio-group
                      v-model="settings.theme"
                      @update:model-value="updateTheme"
                    >
                      <v-radio
                        label="浅色主题"
                        value="light"
                      />
                      <v-radio
                        label="深色主题"
                        value="dark"
                      />
                      <v-radio
                        label="跟随系统"
                        value="auto"
                      />
                    </v-radio-group>
                  </v-card>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      语言设置
                    </h4>
                    <v-select
                      v-model="settings.language"
                      :items="languageOptions"
                      item-title="label"
                      item-value="value"
                      variant="outlined"
                      density="comfortable"
                      @update:model-value="updateLanguage"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </div>
          
          <!-- 通知设置 -->
          <div v-if="activeCategory === 'notifications'">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon class="mr-2">
                mdi-bell
              </v-icon>
              通知设置
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12">
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      通知偏好
                    </h4>
                    <v-switch
                      v-model="settings.notifications.email"
                      label="邮件通知"
                      color="primary"
                      @update:model-value="saveSettings"
                    />
                    <v-switch
                      v-model="settings.notifications.browser"
                      label="浏览器通知"
                      color="primary"
                      @update:model-value="saveSettings"
                    />
                    <v-switch
                      v-model="settings.notifications.system"
                      label="系统消息"
                      color="primary"
                      @update:model-value="saveSettings"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </div>
          
          <!-- 隐私设置 -->
          <div v-if="activeCategory === 'privacy'">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon class="mr-2">
                mdi-shield-account
              </v-icon>
              隐私与安全
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-6">
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      会话管理
                    </h4>
                    <v-switch
                      v-model="settings.privacy.autoLogout"
                      label="自动登出"
                      color="primary"
                      @update:model-value="saveSettings"
                    />
                    <v-select
                      v-if="settings.privacy.autoLogout"
                      v-model="settings.privacy.logoutTime"
                      :items="logoutTimeOptions"
                      item-title="label"
                      item-value="value"
                      label="自动登出时间"
                      variant="outlined"
                      density="comfortable"
                      @update:model-value="saveSettings"
                    />
                  </v-card>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      数据隐私
                    </h4>
                    <v-switch
                      v-model="settings.privacy.shareUsageData"
                      label="分享使用数据"
                      color="primary"
                      @update:model-value="saveSettings"
                    />
                    <v-switch
                      v-model="settings.privacy.allowAnalytics"
                      label="允许分析统计"
                      color="primary"
                      @update:model-value="saveSettings"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </div>
          
          <!-- 系统偏好 -->
          <div v-if="activeCategory === 'preferences'">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon class="mr-2">
                mdi-tune
              </v-icon>
              系统偏好
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-6">
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      界面设置
                    </h4>
                    <v-select
                      v-model="settings.preferences.pageSize"
                      :items="pageSizeOptions"
                      item-title="label"
                      item-value="value"
                      label="每页显示条数"
                      variant="outlined"
                      density="comfortable"
                      @update:model-value="saveSettings"
                    />
                    <v-switch
                      v-model="settings.preferences.showSidebar"
                      label="默认显示侧边栏"
                      color="primary"
                      @update:model-value="saveSettings"
                    />
                  </v-card>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      数据刷新
                    </h4>
                    <v-select
                      v-model="settings.preferences.refreshInterval"
                      :items="refreshIntervalOptions"
                      item-title="label"
                      item-value="value"
                      label="自动刷新间隔"
                      variant="outlined"
                      density="comfortable"
                      @update:model-value="saveSettings"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </div>
          
          <!-- 关于 -->
          <div v-if="activeCategory === 'about'">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon class="mr-2">
                mdi-information
              </v-icon>
              关于系统
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-6">
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      系统信息
                    </h4>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>系统名称</v-list-item-title>
                        <v-list-item-subtitle>Datalink4TJ</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>版本号</v-list-item-title>
                        <v-list-item-subtitle>v2.8.0</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>构建时间</v-list-item-title>
                        <v-list-item-subtitle>{{ buildTime }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-card
                    variant="outlined"
                    class="pa-4"
                  >
                    <h4 class="mb-3">
                      技术支持
                    </h4>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>开发者</v-list-item-title>
                        <v-list-item-subtitle>Noah.yin</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>联系邮箱</v-list-item-title>
                        <v-list-item-subtitle>noah.yin@magna.com</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>开源页面</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-btn
                            variant="text"
                            size="small"
                            color="primary"
                          >
                            查看
                          </v-btn>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </div>
          
          <!-- 保存按钮 -->
          <v-card-actions
            v-if="activeCategory !== 'about'"
            class="pa-4"
          >
            <v-spacer />
            <v-btn
              variant="outlined"
              :disabled="saving"
              @click="resetSettings"
            >
              重置默认
            </v-btn>
            <v-btn
              color="primary"
              :loading="saving"
              @click="saveSettings"
            >
              保存设置
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </unified-page-template>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import Message from '../utils/notification'

// 主题
const theme = useTheme()

// 响应式数据
const saving = ref(false)
const activeCategory = ref('appearance')

// 设置分类
const settingsCategories = [
  { value: 'appearance', title: '外观设置', icon: 'mdi-palette' },
  { value: 'notifications', title: '通知设置', icon: 'mdi-bell' },
  { value: 'privacy', title: '隐私与安全', icon: 'mdi-shield-account' },
  { value: 'preferences', title: '系统偏好', icon: 'mdi-tune' },
  { value: 'about', title: '关于系统', icon: 'mdi-information' }
]

// 设置数据
const settings = reactive({
  theme: 'light',
  language: 'zh-CN',
  notifications: {
    email: true,
    browser: true,
    system: true
  },
  privacy: {
    autoLogout: false,
    logoutTime: 30,
    shareUsageData: false,
    allowAnalytics: true
  },
  preferences: {
    pageSize: 20,
    showSidebar: true,
    refreshInterval: 30
  }
})

// 选项数据
const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

const logoutTimeOptions = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 }
]

const pageSizeOptions = [
  { label: '10条', value: 10 },
  { label: '20条', value: 20 },
  { label: '50条', value: 50 },
  { label: '100条', value: 100 }
]

const refreshIntervalOptions = [
  { label: '不自动刷新', value: 0 },
  { label: '30秒', value: 30 },
  { label: '1分钟', value: 60 },
  { label: '5分钟', value: 300 }
]

// 构建时间
const buildTime = new Date().toLocaleString()

// 初始化
onMounted(() => {
  loadSettings()
})

// 加载设置
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      Object.assign(settings, JSON.parse(savedSettings))
    }
    
    // 同步主题设置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      settings.theme = savedTheme
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    saving.value = true
    
    // 保存到本地存储
    localStorage.setItem('userSettings', JSON.stringify(settings))
    
    Message.success('设置保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
    Message.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 重置设置
const resetSettings = () => {
  Object.assign(settings, {
    theme: 'light',
    language: 'zh-CN',
    notifications: {
      email: true,
      browser: true,
      system: true
    },
    privacy: {
      autoLogout: false,
      logoutTime: 30,
      shareUsageData: false,
      allowAnalytics: true
    },
    preferences: {
      pageSize: 20,
      showSidebar: true,
      refreshInterval: 30
    }
  })
  
  Message.info('设置已重置为默认值')
}

// 更新主题
const updateTheme = (newTheme) => {
  if (newTheme === 'auto') {
    // 跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.global.name.value = prefersDark ? 'dark' : 'light'
  } else {
    theme.global.name.value = newTheme
  }
  
  localStorage.setItem('theme', newTheme)
  saveSettings()
}

// 更新语言
const updateLanguage = (newLanguage) => {
  // 这里可以添加国际化逻辑
  Message.info(`语言已切换为: ${languageOptions.find(l => l.value === newLanguage)?.label}`)
  saveSettings()
}
</script>

<style scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
