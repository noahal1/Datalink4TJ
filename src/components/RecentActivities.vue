<template>
  <v-card
    height="100%"
    class="activities-card d-flex flex-column"
  >
    <v-card-title class="d-flex align-center flex-shrink-0">
      <v-icon
        class="mr-2"
        :color="titleIconColor"
      >
        {{ titleIcon }}
      </v-icon>
      {{ title }}
      <v-spacer />
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :disabled="isLoading"
        :loading="isLoading"
        class="refresh-btn"
        @click="refreshActivities"
      />
    </v-card-title>
    <v-divider class="flex-shrink-0" />
    <loading-overlay :loading="isLoading" />
    
    <v-card-text class="activities-container flex-grow-1 pa-0">
      <v-list
        v-if="filteredActivities.slice(0, limit).length > 0"
        class="py-0"
      >
        <v-list-item 
          v-for="activity in filteredActivities.slice(0, limit)" 
          :key="activity.id" 
          link
          class="activity-item mb-2"
          @click="showActivityDetails(activity)"
        >
          <template #prepend>
            <v-avatar
              :color="`${activity.color || 'grey'}-lighten-4`"
              size="40"
              class="me-3"
            >
              <v-icon
                :icon="activity.icon || 'mdi-history'"
                :color="activity.color || 'grey'"
              />
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-medium activity-title">
            {{ activity.title || activity.action }}
          </v-list-item-title>
          <v-list-item-subtitle class="activity-subtitle">
            <span class="text-caption d-flex align-center">
              <v-icon
                size="x-small"
                color="grey"
                class="mr-1"
              >mdi-account</v-icon>
              {{ activity.user }}
            </span>
            <span class="mx-1 d-none d-sm-inline">•</span>
            <span class="text-caption">{{ activity.action || activity.details }}</span>
          </v-list-item-subtitle>
          <v-list-item-subtitle class="text-caption text-grey d-flex align-center">
            <v-icon
              size="x-small"
              color="grey"
              class="mr-1"
            >
              mdi-clock-outline
            </v-icon>
            {{ activity.time }}
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon
                  size="x-small"
                  color="grey"
                  class="ml-2"
                  v-bind="props"
                >
                  mdi-calendar
                </v-icon>
              </template>
              <span>{{ formatFullDateTime(activity.timestamp) }}</span>
            </v-tooltip>
            <v-tooltip
              v-if="activity.details"
              location="bottom"
            >
              <template #activator="{ props }">
                <v-icon
                  size="x-small"
                  color="grey"
                  class="ml-2"
                  v-bind="props"
                >
                  mdi-information-outline
                </v-icon>
              </template>
              <span>{{ activity.details }}</span>
            </v-tooltip>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        class="ma-4"
        border="start"
      >
        <div class="text-center">
          <v-icon
            size="large"
            color="error"
            class="mb-2"
          >
            mdi-alert-circle
          </v-icon>
          <div class="text-subtitle-1">
            {{ error }}
          </div>
          <v-btn
            color="error"
            variant="text"
            class="mt-2"
            @click="refreshActivities"
          >
            <v-icon start>
              mdi-refresh
            </v-icon>
            重试
          </v-btn>
        </div>
      </v-alert>
      
      <v-alert
        v-else-if="!isLoading"
        type="info"
        variant="tonal"
        class="ma-4"
        border="start"
      >
        <div class="text-center">
          <v-icon
            size="large"
            color="info"
            class="mb-2"
          >
            mdi-information
          </v-icon>
          <div class="text-subtitle-1">
            暂无活动记录
          </div>
        </div>
      </v-alert>
    </v-card-text>
    
    <!-- 活动详情对话框 -->
    <v-dialog
      v-model="showDialog"
      max-width="600"
    >
      <v-card
        v-if="selectedActivity"
        class="activity-details-card"
      >
        <v-toolbar
          :color="selectedActivity.color || 'primary'"
          dark
          flat
        >
          <v-toolbar-title>活动详情</v-toolbar-title>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showDialog = false"
          />
        </v-toolbar>
        <v-card-text class="pt-4">
          <h2 class="text-h5 mb-3 d-flex align-center activity-detail-title">
            <v-icon
              :color="selectedActivity.color || 'primary'"
              class="mr-2"
            >
              {{ selectedActivity.icon || 'mdi-history' }}
            </v-icon>
            {{ selectedActivity.title || selectedActivity.action }}
          </h2>
          
          <v-list density="compact">
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">
                  mdi-account
                </v-icon>
              </template>
              <v-list-item-title>操作人员</v-list-item-title>
              <v-list-item-subtitle>{{ selectedActivity.user }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">
                  mdi-office-building
                </v-icon>
              </template>
              <v-list-item-title>所属部门</v-list-item-title>
              <v-list-item-subtitle>{{ selectedActivity.department }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">
                  mdi-clock-outline
                </v-icon>
              </template>
              <v-list-item-title>操作时间</v-list-item-title>
              <v-list-item-subtitle>{{ formatFullDateTime(selectedActivity.timestamp) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">
                  mdi-tag
                </v-icon>
              </template>
              <v-list-item-title>操作类型</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  :color="selectedActivity.color || 'primary'"
                  size="small"
                >
                  {{ selectedActivity.type }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="selectedActivity.details">
              <template #prepend>
                <v-icon color="primary">
                  mdi-text-box
                </v-icon>
              </template>
              <v-list-item-title>操作描述</v-list-item-title>
              <v-list-item-subtitle>{{ selectedActivity.details }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="selectedActivity.action && selectedActivity.title && selectedActivity.action !== selectedActivity.title">
              <template #prepend>
                <v-icon color="primary">
                  mdi-text-box-outline
                </v-icon>
              </template>
              <v-list-item-title>操作动作</v-list-item-title>
              <v-list-item-subtitle>{{ selectedActivity.action }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          
          <v-divider class="my-3" />
          
          <div
            v-if="selectedActivity.changes"
            class="mt-4"
          >
            <h3 class="text-subtitle-1 mb-2">
              数据变更记录
            </h3>
            
            <v-tabs
              v-model="activeTab"
              density="comfortable"
              class="changes-tabs"
            >
              <v-tab value="before">
                变更前
              </v-tab>
              <v-tab value="after">
                变更后
              </v-tab>
              <v-tab value="diff">
                对比
              </v-tab>
            </v-tabs>
            
            <v-window
              v-model="activeTab"
              class="mt-2"
            >
              <v-window-item value="before">
                <v-card
                  variant="outlined"
                  class="pa-2 changes-card"
                >
                  <pre class="text-caption changes-content">{{ formatChanges(selectedActivity.changes).before }}</pre>
                </v-card>
              </v-window-item>
              
              <v-window-item value="after">
                <v-card
                  variant="outlined"
                  class="pa-2 changes-card"
                >
                  <pre class="text-caption changes-content">{{ formatChanges(selectedActivity.changes).after }}</pre>
                </v-card>
              </v-window-item>
              
              <v-window-item value="diff">
                <v-card
                  variant="outlined"
                  class="pa-2 changes-card"
                >
                  <div class="d-flex flex-column flex-sm-row">
                    <div class="flex-grow-1 mr-0 mr-sm-2 mb-2 mb-sm-0">
                      <div class="text-caption text-center mb-1">
                        变更前
                      </div>
                      <v-card
                        variant="tonal"
                        color="grey-lighten-3"
                        class="pa-2"
                      >
                        <pre class="text-caption changes-content">{{ formatChanges(selectedActivity.changes).before }}</pre>
                      </v-card>
                    </div>
                    <div class="flex-grow-1">
                      <div class="text-caption text-center mb-1">
                        变更后
                      </div>
                      <v-card
                        variant="tonal"
                        color="primary-lighten-5"
                        class="pa-2"
                      >
                        <pre class="text-caption changes-content">{{ formatChanges(selectedActivity.changes).after }}</pre>
                      </v-card>
                    </div>
                  </div>
                </v-card>
              </v-window-item>
            </v-window>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDialog = false"
          >
            关闭
          </v-btn>
          <v-btn
            v-if="selectedActivity.target"
            color="primary"
            variant="tonal"
            :to="selectedActivity.target"
          >
            <v-icon class="mr-1">
              mdi-arrow-right
            </v-icon>
            前往相关页面
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useActivityStore } from '../stores/activity'
import { format } from 'date-fns'
import Message from '../utils/notification'

const props = defineProps({
  title: {
    type: String,
    default: '最近活动'
  },
  titleIcon: {
    type: String,
    default: 'mdi-history'
  },
  titleIconColor: {
    type: String,
    default: 'primary'
  },
  limit: {
    type: Number,
    default: 5
  },
  department: {
    type: String,
    default: null
  },
  userId: {
    type: Number,
    default: null
  },
  type: {
    type: String,
    default: null
  },
  autoRefresh: {
    type: Boolean,
    default: false
  },
  refreshInterval: {
    type: Number,
    default: 60000 // 默认1分钟刷新一次
  }
})

const activityStore = useActivityStore()
const showDialog = ref(false)
const selectedActivity = ref(null)
const activeTab = ref('after')
let refreshTimer = null
const error = ref(null)

// 计算属性：筛选后的活动列表
const filteredActivities = computed(() => {
  let result = activityStore.activities;
  
  // 如果指定了部门，则按部门筛选
  if (props.department) {
    result = activityStore.activitiesByDepartment(props.department);
  }
  
  // 如果指定了用户ID，则按用户筛选
  if (props.userId) {
    result = activityStore.activitiesByUser(props.userId);
  }
  
  // 如果指定了类型，则按类型筛选
  if (props.type) {
    result = activityStore.activitiesByType(props.type);
  }
  
  // 查看活动数据
  console.log('筛选前的活动记录:', result);
  
  // 过滤掉无效的活动记录
  return result.filter(activity => {
    return activity && 
           activity.id && 
           (activity.title || activity.action) && 
           activity.user;
  });
});

// 计算属性：是否正在加载
const isLoading = computed(() => {
  return activityStore.isLoading;
});

// 格式化完整的日期时间
const formatFullDateTime = (timestamp) => {
  if (!timestamp) return '未知时间';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '无效日期';
    }
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    console.error('日期格式化错误:', e);
    return '日期格式错误';
  }
};

// 刷新活动数据
const refreshActivities = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // 使用活动数据存储获取数据
    await activityStore.fetchActivities();
    
    // 检查数据是否正确获取
    if (activityStore.activities.length === 0) {
      console.warn('未获取到活动数据');
    } else {
      console.log('获取到活动数据:', activityStore.activities.length, '条');
    }
  } catch (e) {
    console.error('获取活动数据失败:', e);
    error.value = '获取数据失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
};

// 显示活动详情
const showActivityDetails = (activity) => {
  selectedActivity.value = activity;
  showDialog.value = true;
};

// 格式化变更数据为可读文本
const formatChanges = (changes) => {
  if (!changes) return { before: '无变更记录', after: '无变更记录' };
  
  try {
    // 处理字符串格式的before/after字段
    let beforeData = changes.before;
    let afterData = changes.after;
    
    // 如果是字符串格式，尝试解析为JSON对象
    if (typeof beforeData === 'string') {
      try {
        beforeData = JSON.parse(beforeData);
      } catch (e) {
        console.log('before数据不是有效的JSON字符串:', e);
        // 保持原样
      }
    }
    
    if (typeof afterData === 'string') {
      try {
        afterData = JSON.parse(afterData);
      } catch (e) {
        console.log('after数据不是有效的JSON字符串:', e);
        // 保持原样
      }
    }
    
    const before = beforeData ? JSON.stringify(beforeData, null, 2) : '无数据';
    const after = afterData ? JSON.stringify(afterData, null, 2) : '无数据';
    return { before, after };
  } catch (e) {
    console.error('格式化变更数据错误:', e);
    return { before: '数据格式错误', after: '数据格式错误' };
  }
};

// 设置自动刷新
const setupAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    clearAutoRefresh();
    refreshTimer = setInterval(refreshActivities, props.refreshInterval);
  }
};

// 清除自动刷新
const clearAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

onMounted(async () => {
  // 初始加载活动数据
  error.value = null;
  try {
    if (activityStore.activities.length === 0) {
      await refreshActivities();
    }
    
    // 设置自动刷新
    setupAutoRefresh();
  } catch (e) {
    console.error('初始加载活动数据失败:', e);
    error.value = '加载活动数据失败，请稍后重试';
  }
});

// 组件卸载时清除自动刷新
onUnmounted(() => {
  clearAutoRefresh();
});
</script>

<style scoped>
.activities-card {
  border-radius: 8px;
  transition: box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.activities-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.activities-container {
  min-height: 0;
}

.activity-item {
  transition: all 0.25s ease;
  border-radius: 6px;
  margin: 4px 8px;
  border-left: 3px solid transparent;
}

.activity-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
}

.activity-item:nth-child(1) {
  border-left-color: var(--v-error-base, #f44336);
}

.activity-item:nth-child(2) {
  border-left-color: var(--v-warning-base, #fb8c00);
}

.activity-item:nth-child(3) {
  border-left-color: var(--v-info-base, #2196f3);
}

.activity-item:nth-child(4) {
  border-left-color: var(--v-success-base, #4caf50);
}

.activity-item:nth-child(5) {
  border-left-color: var(--v-secondary-base, #9c27b0);
}

.activity-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.activity-subtitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.refresh-btn {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.refresh-btn:hover {
  opacity: 1;
}

.activity-details-card {
  border-radius: 8px;
  overflow: hidden;
}

.activity-detail-title {
  border-left: 4px solid var(--v-primary-base, #1976d2);
  padding-left: 12px;
}

.changes-tabs {
  border-radius: 4px;
  overflow: hidden;
}

.changes-card {
  border-radius: 6px;
}

.changes-content {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

@media (max-width: 600px) {
  .activity-title {
    font-size: 0.9rem;
  }
  
  .changes-content {
    max-height: 150px;
  }
}
</style>