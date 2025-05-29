<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon color="warning" class="mr-2">mdi-calendar-alert</v-icon>
      即将开始的重要事件
      
      <v-menu v-if="events.length > 0">
        <template v-slot:activator="{ props }">
          <v-btn
            variant="text"
            icon="mdi-filter-variant"
            v-bind="props"
            size="small"
            class="ml-2"
          ></v-btn>
        </template>
        <v-card min-width="200">
          <v-list density="compact">
            <v-list-subheader>按部门筛选</v-list-subheader>
            <v-list-item
              v-for="dept in departments"
              :key="dept"
              :value="dept"
              @click="filterByDepartment(dept)"
            >
              <template v-slot:prepend>
                <v-icon :color="selectedDepartment === dept ? 'primary' : 'grey'" size="small">
                  {{ selectedDepartment === dept ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ dept }}</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="selectedDepartment = null">
              <template v-slot:prepend>
                <v-icon color="primary" size="small">mdi-filter-remove</v-icon>
              </template>
              <v-list-item-title>显示全部</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
      
      <v-spacer></v-spacer>
      
      <v-chip
        v-if="selectedDepartment"
        color="primary"
        size="small"
        closable
        @click:close="selectedDepartment = null"
        class="mr-2"
      >
        {{ selectedDepartment }}
      </v-chip>
      
      <v-btn
        variant="text"
        size="small"
        to="/events"
        color="primary"
      >
        管理事件
        <v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </v-card-title>
    <v-divider></v-divider>
    
    <v-card-text>
      <loading-overlay :loading="isLoading" />
      
      <v-list v-if="filteredEvents.length > 0" density="comfortable" class="py-0">
        <v-list-item
          v-for="event in filteredEvents"
          :key="event.id"
          :ripple="true"
          class="upcoming-event py-2"
          @click="showEventDetails(event)"
        >
          <v-list-item-title class="d-flex align-center">
            <v-avatar :color="`${event.statusColor}-lighten-4`" size="36" class="me-3">
              <v-icon :color="event.statusColor" size="medium">
                {{ isToday(parseISO(event.start_time)) ? 'mdi-calendar-today' : 'mdi-calendar-clock' }}
              </v-icon>
            </v-avatar>
            
            <div class="flex-grow-1">
              <div class="font-weight-medium text-subtitle-1">
                {{ event.name }}
                <v-chip
                  :color="event.statusColor"
                  size="x-small"
                  class="ml-2"
                >
                  {{ event.status }}
                </v-chip>
              </div>
              <div class="text-caption d-flex align-center">
                <v-icon size="x-small" color="grey" class="mr-1">mdi-office-building</v-icon>
                {{ event.department }}
                <v-divider vertical class="mx-2" style="height: 12px"></v-divider>
                <v-icon size="x-small" color="grey" class="mr-1">mdi-calendar-range</v-icon>
                {{ formatDateRange(event.start_time, event.end_time) }}
                <v-tooltip v-if="event.daysRemaining" location="bottom">
                  <template v-slot:activator="{ props }">
                    <span class="ml-2 text-caption" v-bind="props">
                      <v-icon size="x-small" :color="event.statusColor" class="mr-1">mdi-clock-outline</v-icon>
                      还剩{{ event.daysRemaining }}天
                    </span>
                  </template>
                  <span>{{ formatDate(event.start_time, 'yyyy年MM月dd日') }}开始</span>
                </v-tooltip>
              </div>
            </div>
            
            <v-icon size="small" color="grey">mdi-chevron-right</v-icon>
          </v-list-item-title>
        </v-list-item>
      </v-list>
      
      <div v-else-if="events.length > 0 && filteredEvents.length === 0" class="text-center pa-4">
        <v-icon size="large" color="grey" class="mb-2">mdi-filter-remove</v-icon>
        <div class="text-subtitle-1 text-medium-emphasis">没有匹配当前筛选条件的事件</div>
        <v-btn
          color="primary"
          variant="text"
          class="mt-2"
          @click="selectedDepartment = null"
          prepend-icon="mdi-filter-remove"
        >
          清除筛选
        </v-btn>
      </div>
      
      <v-alert
        v-else-if="!isLoading"
        type="info"
        variant="tonal"
        class="my-2"
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
      <v-card v-if="selectedEvent">
        <v-toolbar :color="selectedEvent.statusColor" dark flat>
          <v-toolbar-title>事件详情</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <h2 class="text-h5 mb-2">{{ selectedEvent.name }}</h2>
          
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
import { ref, computed, onMounted } from 'vue'
import { format, addDays, isAfter, parseISO, isToday, isBefore, differenceInDays, isValid } from 'date-fns'

const props = defineProps({
  limit: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['update:eventCount'])

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const events = ref([])
const isLoading = ref(false)
const selectedDepartment = ref(null)
const showDialog = ref(false)
const selectedEvent = ref(null)

// 获取即将开始的重要事件
const fetchUpcomingEvents = async () => {
  isLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/events`);
    if (response.ok) {
      const allEvents = await response.json();
      const today = new Date();
      const futureDate = addDays(today, 30); // 未来30天内的事件
      
      // 过滤出未来事件和当前进行的事件
      const filteredEvents = allEvents.filter(event => {
        const startDate = parseISO(event.start_time.split('T')[0]);
        
        // 未来的事件或今天开始的事件
        const isUpcoming = isAfter(startDate, today) || isToday(startDate);
        
        // 如果有结束日期，确保事件还没有结束
        if (event.end_time) {
          const endDate = parseISO(event.end_time.split('T')[0]);
          return isUpcoming && isAfter(endDate, today);
        }
        
        return isUpcoming && isBefore(startDate, futureDate);
      });
      
      // 按开始日期排序，最近的优先
      const sortedEvents = filteredEvents.sort((a, b) => {
        const dateA = parseISO(a.start_time.split('T')[0]);
        const dateB = parseISO(b.start_time.split('T')[0]);
        return dateA - dateB;
      });
      
      // 只显示最多limit个事件
      events.value = sortedEvents.slice(0, props.limit).map(event => {
        const startDate = parseISO(event.start_time.split('T')[0]);
        const daysUntil = differenceInDays(startDate, today);
        let status = '';
        let statusColor = '';
        
        if (isToday(startDate)) {
          status = '今日开始';
          statusColor = 'error';
        } else if (daysUntil <= 7) {
          status = `${daysUntil}天后`;
          statusColor = 'warning';
        } else {
          status = `${daysUntil}天后`;
          statusColor = 'info';
        }
        
        return {
          ...event,
          status,
          statusColor,
          daysRemaining: isToday(startDate) ? 0 : daysUntil,
          start_time: event.start_time.split('T')[0],
          end_time: event.end_time ? event.end_time.split('T')[0] : null
        };
      });
      
      // 向父组件通知事件总数
      emit('update:eventCount', filteredEvents.length);
      
    } else {
      console.error('获取事件失败');
    }
  } catch (error) {
    console.error('获取事件错误:', error);
  } finally {
    isLoading.value = false;
  }
}

// 根据部门筛选事件
const filterByDepartment = (department) => {
  selectedDepartment.value = department;
}

// 计算属性：筛选后的事件列表
const filteredEvents = computed(() => {
  if (!selectedDepartment.value) return events.value;
  return events.value.filter(event => event.department === selectedDepartment.value);
});

// 计算属性：所有可用的部门列表
const departments = computed(() => {
  const deptSet = new Set(events.value.map(event => event.department));
  return Array.from(deptSet);
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
  await fetchUpcomingEvents();
})
</script>

<style scoped>
.upcoming-event {
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  cursor: pointer;
}

.upcoming-event:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
</style>