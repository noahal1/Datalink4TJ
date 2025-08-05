<template>
  <unified-data-table
    title="即将开始的重要事件"
    icon="mdi-calendar-clock"
    :headers="[]"
    :items="[]"
    hide-default-footer
    :loading="isLoading"
    no-padding
  >
    <template #actions>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        color="primary"
        :disabled="isLoading"
        :loading="isLoading"
        class="mr-2"
        @click="refreshEvents"
      />
      <v-btn
        variant="text"
        size="small"
        to="/events"
        color="primary"
      >
        查看全部
        <v-icon end>
          mdi-chevron-right
        </v-icon>
      </v-btn>
    </template>
    
    <template #pre-table>
      <loading-overlay :loading="isLoading" />
      
      <v-list
        v-if="filteredEvents.length > 0"
        class="py-0"
      >
        <v-list-item
          v-for="event in filteredEvents.slice(0, limit)" 
          :key="event.id"
          :to="`/events/${event.id}`"
          link
          class="event-item"
        >
          <template #prepend>
            <v-avatar
              :color="getEventColor(event.type || event.department) + '-lighten-4'"
              size="42"
              class="me-3"
            >
              <v-icon
                :icon="getEventIcon(event.type || event.department)"
                :color="getEventColor(event.type || event.department)"
              />
            </v-avatar>
          </template>
          
          <v-list-item-title class="font-weight-medium d-flex align-center">
            {{ event.title || event.name }}
            <v-chip
              v-if="getDaysRemaining(event) !== null"
              size="x-small"
              :color="getDaysRemainingColor(event)"
              class="ml-2"
              variant="elevated"
            >
              {{ getDaysRemainingText(event) }}
            </v-chip>
          </v-list-item-title>
          
          <v-list-item-subtitle class="d-flex align-center flex-wrap">
            <span class="d-flex align-center">
              <v-icon
                size="x-small"
                color="grey"
                class="mr-1"
              >mdi-calendar</v-icon>
              {{ formatDate(event.start_date || event.start_time) }}
            </span>
            <span class="mx-1">•</span>
            <span class="d-flex align-center">
              <v-icon
                size="x-small"
                color="grey"
                class="mr-1"
              >mdi-clock-outline</v-icon>
              {{ formatTime(event.start_time) }}
            </span>
            <v-chip
              size="x-small"
              :color="getEventColor(event.type || event.department)"
              class="ml-2"
              variant="tonal"
            >
              {{ event.type || event.department || '其他' }}
            </v-chip>
          </v-list-item-subtitle>
          
          <v-list-item-subtitle
            v-if="event.location"
            class="d-flex align-center text-caption"
          >
            <v-icon
              size="x-small"
              color="grey"
              class="mr-1"
            >
              mdi-map-marker
            </v-icon>
            {{ event.location }}
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
            @click="refreshEvents"
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
            mdi-calendar-blank
          </v-icon>
          <div class="text-subtitle-1">
            暂无即将开始的事件
          </div>
          <div class="text-body-2 mt-1">
            您可以前往事件页面创建新的事件
          </div>
          <v-btn
            color="primary"
            variant="text"
            class="mt-2"
            to="/events"
          >
            <v-icon start>
              mdi-calendar-plus
            </v-icon>
            管理事件
          </v-btn>
        </div>
      </v-alert>
    </template>
  </unified-data-table>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useEventStore } from '../stores/event'
import { format } from 'date-fns'
import Message from '../utils/notification'

const props = defineProps({
  limit: {
    type: Number,
    default: 5
  }
})

const eventStore = useEventStore()
const isLoading = ref(false)
const error = ref(null)

// 获取即将开始的事件
const fetchUpcomingEvents = async () => {
  isLoading.value = true
  error.value = null
  try {
    await eventStore.fetchUpcomingEvents(props.limit * 2) // 获取更多数据，以便有效过滤后仍有足够的数据显示
    // 成功获取数据后清除错误
    error.value = null
  } catch (error) {
    console.error('获取即将开始的事件失败:', error)
    error.value = '获取事件数据失败，请稍后重试'
    Message.error('获取事件数据失败')
  } finally {
    isLoading.value = false
  }
}

// 计算属性：筛选有效的事件列表
const filteredEvents = computed(() => {
  // 筛选掉不完整或无效的事件数据
  return eventStore.upcomingEvents.filter(event => {
    // 检查必要字段是否存在
    return event && 
           (event.title || event.name) && 
           (event.start_date || event.start_time) && 
           // 确保时间信息有意义
           (new Date(event.start_date || event.start_time).toString() !== 'Invalid Date')
  });
})

// 格式化日期
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '日期未知'
    }
    return format(date, 'yyyy-MM-dd')
  } catch (e) {
    console.error('日期格式化错误:', e)
    return '日期错误'
  }
}

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '全天'
  
  try {
    // 尝试标准化时间格式
    if (typeof timeString === 'string') {
      if (timeString.length <= 5) { // 如 "09:30"
        return timeString
      } else if (timeString.includes('T')) {
        // 如果是ISO格式，尝试提取时间部分
        const timePart = timeString.split('T')[1]
        if (timePart) {
          const hourMinute = timePart.substring(0, 5)
          return hourMinute
        }
      }
    }
    
    // 防止无效的时间格式导致错误
    console.log('处理时间格式:', timeString)
    return '全天'
  } catch (e) {
    console.error('时间格式化错误:', e)
    return '全天' // 如果解析失败，返回全天
  }
}

// 获取事件剩余天数
const getDaysRemaining = (event) => {
  try {
    const startDate = new Date(event.start_date || event.start_time)
    if (isNaN(startDate.getTime())) {
      return null
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 今天开始
    if (startDate.toDateString() === today.toDateString()) {
      return 0
    }
    
    // 已过期的事件
    if (startDate < today) {
      return -1
    }
    
    // 计算剩余天数
    const timeDiff = startDate.getTime() - today.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  } catch (e) {
    console.error('计算剩余天数错误:', e)
    return null
  }
}

// 获取剩余天数显示文本
const getDaysRemainingText = (event) => {
  const days = getDaysRemaining(event)
  
  if (days === null) {
    return ''
  } else if (days === 0) {
    return '今天'
  } else if (days === -1) {
    return '已开始'
  } else {
    return `${days}天后`
  }
}

// 获取剩余天数显示颜色
const getDaysRemainingColor = (event) => {
  const days = getDaysRemaining(event)
  
  if (days === null) {
    return 'grey'
  } else if (days === 0) {
    return 'error'
  } else if (days === -1) {
    return 'grey'
  } else if (days <= 3) {
    return 'error'
  } else if (days <= 7) {
    return 'warning'
  } else {
    return 'info'
  }
}

// 根据事件类型获取颜色
const getEventColor = (type) => {
  if (!type) return 'primary'
  
  const colorMap = {
    '会议': 'primary',
    '培训': 'info',
    '审核': 'warning',
    '拜访': 'success',
    '其他': 'grey',
    'QA': 'purple',
    'ASSY': 'blue',
    'EHS': 'red',
    'ADMIN': 'indigo'
  }
  return colorMap[type] || 'primary'
}

// 根据事件类型获取图标
const getEventIcon = (type) => {
  if (!type) return 'mdi-calendar'
  
  const iconMap = {
    '会议': 'mdi-account-group',
    '培训': 'mdi-school',
    '审核': 'mdi-clipboard-check',
    '拜访': 'mdi-handshake',
    '其他': 'mdi-calendar',
    'QA': 'mdi-checkbox-marked-circle',
    'ASSY': 'mdi-hammer-wrench',
    'EHS': 'mdi-shield-check',
    'ADMIN': 'mdi-shield-account'
  }
  return iconMap[type] || 'mdi-calendar'
}

// 设置自动刷新定时器
const autoRefreshInterval = 5 * 60 * 1000 // 5分钟刷新一次
let refreshTimer = null

// 设置自动刷新
const setupAutoRefresh = () => {
  clearAutoRefresh() // 清除可能存在的定时器
  refreshTimer = setInterval(fetchUpcomingEvents, autoRefreshInterval)
}

// 清除自动刷新
const clearAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 手动刷新
const refreshEvents = async () => {
  await fetchUpcomingEvents()
  Message.success('事件数据已更新')
}

onMounted(async () => {
  // 初次加载数据
  await fetchUpcomingEvents()
  
  // 设置自动刷新
  setupAutoRefresh()
})

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  clearAutoRefresh()
})

// 监听限制数量变化
watch(() => props.limit, async (newLimit) => {
  // 如果当前事件数量不足，重新获取
  if (eventStore.upcomingEvents.length < newLimit) {
    await fetchUpcomingEvents()
  }
})
</script>

<style scoped>
.event-item {
  transition: all 0.25s ease;
  border-radius: 6px;
  margin: 4px 8px;
}

.event-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
}
</style> 