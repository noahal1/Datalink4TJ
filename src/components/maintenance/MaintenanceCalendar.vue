<template>
  <v-card class="elevation-2" style="height: 100%;">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-calendar</v-icon>
      设备维修日历
    </v-card-title>
    <v-card-text>
      <v-sheet class="mb-4">
        <v-select
          v-model="localSelectedMonth"
          :items="months"
          label="选择月份"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4"
        ></v-select>
        
        <v-sheet class="calendar-grid">
          <div class="calendar-header" v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">
            {{ day }}
          </div>
          
          <div class="calendar-day empty" v-for="n in firstDayOfMonth" :key="`empty-${n}`"></div>
          
          <v-btn
            v-for="day in daysInMonth"
            :key="day"
            :color="isSelectedDay(day) ? 'primary' : (hasTaskOnDay(day) ? 'info' : '')"
            :variant="isSelectedDay(day) ? 'flat' : (hasTaskOnDay(day) ? 'outlined' : 'text')"
            class="calendar-day-btn"
            size="small"
            width="36"
            height="36"
            @click="selectDay(day)"
          >
            {{ day }}
          </v-btn>
        </v-sheet>
      </v-sheet>
      
      <v-sheet class="mt-4 d-flex justify-space-between align-center">
        <div>
          <span class="text-subtitle-1">MTTR: </span>
          <span class="text-h6 font-weight-bold">3.2</span>
          <span class="text-caption ml-1">小时/次</span>
        </div>
        <div>
          <span class="text-subtitle-1">MTBF: </span>
          <span class="text-h6 font-weight-bold">278.5</span>
          <span class="text-caption ml-1">小时</span>
        </div>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  selectedDate: {
    type: String,
    required: true
  },
  selectedMonth: {
    type: Number,
    required: true
  },
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedDate', 'update:selectedMonth'])

// 本地状态，用于双向绑定
const localSelectedMonth = computed({
  get: () => props.selectedMonth,
  set: (value) => emit('update:selectedMonth', value)
})

// 生成月份列表
const months = [
  { title: '1月', value: 1 },
  { title: '2月', value: 2 },
  { title: '3月', value: 3 },
  { title: '4月', value: 4 },
  { title: '5月', value: 5 },
  { title: '6月', value: 6 },
  { title: '7月', value: 7 },
  { title: '8月', value: 8 },
  { title: '9月', value: 9 },
  { title: '10月', value: 10 },
  { title: '11月', value: 11 },
  { title: '12月', value: 12 }
]

// 计算当前月份的天数
const daysInMonth = computed(() => {
  const year = new Date().getFullYear()
  return new Date(year, localSelectedMonth.value, 0).getDate()
})

// 计算当月第一天是星期几 (0-6, 0是星期日)
const firstDayOfMonth = computed(() => {
  const year = new Date().getFullYear()
  return new Date(year, localSelectedMonth.value - 1, 1).getDay()
})

// 选择日期
const selectDay = (day) => {
  const year = new Date().getFullYear()
  const month = localSelectedMonth.value
  const paddedMonth = month.toString().padStart(2, '0')
  const paddedDay = day.toString().padStart(2, '0')
  emit('update:selectedDate', `${year}-${paddedMonth}-${paddedDay}`)
}

// 检查是否是选中的日期
const isSelectedDay = (day) => {
  if (!props.selectedDate) return false
  
  try {
    const dateParts = props.selectedDate.split('-')
    if (dateParts.length !== 3) return false
    
    const selectedDay = parseInt(dateParts[2])
    const selectedMonthFromDate = parseInt(dateParts[1])
    
    return day === selectedDay && localSelectedMonth.value === selectedMonthFromDate
  } catch (error) {
    console.error('日期比较错误:', error)
    return false
  }
}

// 检查某天是否有任务
const hasTaskOnDay = (day) => {
  const year = new Date().getFullYear()
  const month = localSelectedMonth.value
  const paddedMonth = month.toString().padStart(2, '0')
  const paddedDay = day.toString().padStart(2, '0')
  const dateStr = `${year}-${paddedMonth}-${paddedDay}`
  
  return props.tasks.some(task => task.date === dateStr)
}
</script>

<style scoped>
/* 日历样式 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 8px;
}

.calendar-header {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  padding: 4px 0;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day-btn {
  border-radius: 50% !important;
  transition: all 0.2s ease;
}

.calendar-day-btn:hover {
  transform: scale(1.1);
  z-index: 1;
}

.empty {
  visibility: hidden;
}
</style> 