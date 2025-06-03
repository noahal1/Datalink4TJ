<template>
  <v-card class="upcoming-events-card d-flex flex-column">
    <v-card-title class="d-flex align-center flex-shrink-0">
      <v-icon color="warning" class="mr-2">mdi-calendar-alert</v-icon>
      即将开始的重要事件
      <v-spacer></v-spacer>
      <v-btn
        variant="text"
        size="small"
        to="/events"
        color="primary"
      >
        查看全部
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </v-card-title>
    <v-divider class="flex-shrink-0"></v-divider>
    
    <v-card-text class="events-container flex-grow-1 pa-0">
      <loading-overlay :loading="isLoading" />
      
      <v-list v-if="importantEvents.length > 0" density="comfortable" class="py-0 h-100 overflow-auto">
        <v-list-item
          v-for="event in importantEvents"
          :key="event.id"
          :ripple="true"
          class="upcoming-event py-2 mb-2"
          @click="showEventDetails(event)"
        >
          <v-list-item-title class="d-flex align-center">
            <v-avatar :color="`${event.statusColor}-lighten-4`" size="40" class="me-3">
              <v-icon :color="event.statusColor" size="medium">
                {{ isToday(parseISO(event.start_time)) ? 'mdi-calendar-today' : 'mdi-calendar-clock' }}
              </v-icon>
            </v-avatar>
            
            <div class="flex-grow-1">
              <div class="font-weight-medium text-subtitle-1 event-title">
                {{ event.name }}
                <v-chip
                  :color="event.statusColor"
                  size="x-small"
                  class="ml-2"
                >
                  {{ event.status }}
                </v-chip>
              </div>
              <div class="text-caption d-flex align-center flex-wrap">
                <span class="d-flex align-center mr-2">
                  <v-icon size="x-small" color="grey" class="mr-1">mdi-office-building</v-icon>
                  {{ event.department }}
                </span>
                <v-divider vertical class="mx-2 d-none d-sm-block" style="height: 12px"></v-divider>
                <span class="d-flex align-center">
                  <v-icon size="x-small" color="grey" class="mr-1">mdi-calendar-range</v-icon>
                  {{ formatDateRange(event.start_time, event.end_time) }}
                </span>
                <v-tooltip v-if="event.daysRemaining !== undefined" location="bottom">
                  <template v-slot:activator="{ props }">
                    <span class="ml-2 text-caption countdown-badge" v-bind="props">
                      <v-icon size="x-small" :color="event.statusColor" class="mr-1">mdi-clock-outline</v-icon>
                      {{ event.daysRemaining === 0 ? '今天' : `还剩${event.daysRemaining}天` }}
                    </span>
                  </template>
                  <span>{{ formatDate(event.start_time, 'yyyy年MM月dd日') }}开始</span>
                </v-tooltip>
              </div>
            </div>
          </v-list-item-title>
        </v-list-item>
      </v-list>
      
      <v-alert
        v-else-if="!isLoading"
        type="info"
        variant="tonal"
        class="ma-4"
      >
        <div class="text-center">
          <v-icon size="large" color="info" class="mb-2">mdi-calendar-blank</v-icon>
          <div class="text-subtitle-1">暂无即将开始的事件</div>
          <v-btn
            color="info"
            variant="text"
            class="mt-2"
            to="/events"
            prepend-icon="mdi-plus"
          >
            添加新事件
          </v-btn>
        </div>
      </v-alert>
    </v-card-text>
    
    <!-- 事件详情对话框 -->
    <v-dialog v-model="showDialog" max-width="500">
      <v-card v-if="selectedEvent" class="event-details-card">
        <v-toolbar :color="selectedEvent.statusColor" dark flat>
          <v-toolbar-title>事件详情</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <h2 class="text-h5 mb-3 event-detail-title">{{ selectedEvent.name }}</h2>
          
          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-office-building</v-icon>
              </template>
              <v-list-item-title>所属部门</v-list-item-title>
              <v-list-item-subtitle>{{ selectedEvent.department }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-calendar-start</v-icon>
              </template>
              <v-list-item-title>开始时间</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedEvent.start_time, 'yyyy年MM月dd日') }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="selectedEvent.end_time">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-calendar-end</v-icon>
              </template>
              <v-list-item-title>结束时间</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedEvent.end_time, 'yyyy年MM月dd日') }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon :color="selectedEvent.statusColor">mdi-flag</v-icon>
              </template>
              <v-list-item-title>状态</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="selectedEvent.statusColor" size="small">{{ selectedEvent.status }}</v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="selectedEvent.description">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-text-box</v-icon>
              </template>
              <v-list-item-title>事件描述</v-list-item-title>
              <v-list-item-subtitle>{{ selectedEvent.description }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showDialog = false">
            关闭
          </v-btn>
          <v-btn color="primary" variant="tonal" :to="`/events?edit=${selectedEvent.id}`">
            <v-icon class="mr-1">mdi-pencil</v-icon>
            编辑事件
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { format, addDays, isAfter, parseISO, isToday, isBefore, differenceInDays, isValid } from 'date-fns'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const props = defineProps({
  limit: {
    type: Number,
    default: 3
  }
})

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const events = ref([])
const isLoading = ref(false)
const showDialog = ref(false)
const selectedEvent = ref(null)

// 获取即将开始的重要事件
const fetchImportantEvents = async () => {
  isLoading.value = true;
  try {
    // 检查用户是否已登录
    if (!userStore.token) {
      console.error('用户未登录或令牌无效');
      const app = getCurrentInstance();
      if (app && app.proxy.$notify) {
        app.proxy.$notify.error('请先登录再进行操作！');
      }
      isLoading.value = false;
      return;
    }

    const response = await fetch(`${API_BASE_URL}/events/?upcoming=true&limit=${props.limit}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    });
    
    if (response.ok) {
      const allEvents = await response.json();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 重置时间部分，只比较日期
      
      // 处理事件数据，添加状态和颜色
      events.value = allEvents.map(event => {
        const startDate = parseISO(event.start_time);
        let status, statusColor, daysRemaining;
        
        // 检查日期是否有效
        if (!isValid(startDate)) {
          status = '日期无效';
          statusColor = 'grey';
          daysRemaining = 0;
          return {
            ...event,
            status,
            statusColor,
            daysRemaining
          };
        }
        
        if (isToday(startDate)) {
          // 如果是今天
          status = '今日开始';
          statusColor = 'error';
          daysRemaining = 0;
        } else if (isBefore(startDate, today)) {
          // 如果日期已经过去
          status = '已开始';
          statusColor = 'grey';
          daysRemaining = 0;
        } else {
          // 未来日期 - 使用自定义计算，避免differenceInDays的问题
          const startTime = startDate.getTime();
          const todayTime = today.getTime();
          const diffTime = startTime - todayTime;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          daysRemaining = diffDays;
          
          if (diffDays <= 3) {
            status = `${diffDays}天后`;
            statusColor = 'error';
          } else if (diffDays <= 7) {
            status = `${diffDays}天后`;
            statusColor = 'warning';
          } else {
            status = `${diffDays}天后`;
            statusColor = 'info';
          }
        }
        
        return {
          ...event,
          status,
          statusColor,
          daysRemaining
        };
      });
    } else {
      console.error('获取事件失败');
      const app = getCurrentInstance();
      if (app && app.proxy.$notify) {
        app.proxy.$notify.error('获取事件列表失败');
      }
    }
  } catch (error) {
    console.error('获取事件错误:', error);
    const app = getCurrentInstance();
    if (app && app.proxy.$notify) {
      app.proxy.$notify.error('获取事件失败: ' + error.message);
    }
  } finally {
    isLoading.value = false;
  }
}

// 计算属性：重要事件列表
const importantEvents = computed(() => {
  return events.value;
});

// 显示事件详情
const showEventDetails = (event) => {
  selectedEvent.value = event;
  showDialog.value = true;
}

// 格式化日期
const formatDate = (dateString, formatStr = 'MM/dd') => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  if (!isValid(date)) return '';
  return format(date, formatStr);
}

// 格式化日期范围
const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  
  if (!endDate) return start;
  
  const end = formatDate(endDate);
  return `${start} 至 ${end}`;
}

onMounted(async () => {
  await fetchImportantEvents();
})
</script>

<style scoped>
.upcoming-events-card {
  height: 100%;
  border-radius: 8px;
  transition: box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.upcoming-events-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.events-container {
  overflow-y: auto;
  scrollbar-width: thin;
  min-height: 0;
}

.upcoming-event {
  transition: all 0.25s ease;
  border-left: 3px solid transparent;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 8px;
}

.upcoming-event:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
}

.event-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.countdown-badge {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
}

.event-details-card {
  border-radius: 8px;
  overflow: hidden;
}

.event-detail-title {
  border-left: 4px solid var(--v-primary-base, #1976d2);
  padding-left: 12px;
}

.upcoming-event:nth-child(1) {
  border-left-color: var(--v-error-base, #f44336);
}

.upcoming-event:nth-child(2) {
  border-left-color: var(--v-warning-base, #fb8c00);
}

.upcoming-event:nth-child(3) {
  border-left-color: var(--v-info-base, #2196f3);
}

.upcoming-event:nth-child(4) {
  border-left-color: var(--v-success-base, #4caf50);
}

.upcoming-event:nth-child(5) {
  border-left-color: var(--v-secondary-base, #9c27b0);
}

@media (max-width: 600px) {
  .event-title {
    font-size: 0.9rem;
  }
}
</style> 