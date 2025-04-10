<template>
  <v-card class="elevation-2 maintenance-card h-100">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-clipboard-text</v-icon>
      {{ formatDate(date) }} 维修工作
      <v-spacer></v-spacer>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$emit('add-task')" size="small">
        添加工作
      </v-btn>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-card-text v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-subtitle-1">加载中...</div>
    </v-card-text>
    
    <v-card-text v-else-if="tasks.length > 0" class="pt-4">
      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-1 font-weight-medium">今日工作完成情况</div>
          <v-progress-linear
            :model-value="completionRate"
            color="success"
            height="20"
            class="mt-2"
          >
            <template v-slot:default>
              <span class="text-white">{{ completionRate }}%</span>
            </template>
          </v-progress-linear>
        </v-col>
        <v-col cols="12" md="6">
          <div class="d-flex justify-space-between">
            <div class="text-center">
              <div class="text-h5 font-weight-bold">{{ tasks.length }}</div>
              <div class="text-caption">总任务数</div>
            </div>
            <div class="text-center">
              <div class="text-h5 font-weight-bold">{{ completedTasks }}</div>
              <div class="text-caption">已完成</div>
            </div>
          </div>
        </v-col>
      </v-row>
      
      <v-list class="mt-4 task-list">
        <v-list-item
          v-for="(task, index) in tasks"
          :key="index"
          :class="{'completed-task': task.solved}"
          class="task-item"
        >
          <template v-slot:prepend>
            <v-checkbox v-model="task.solved" @change="$emit('update-status', task)" density="compact"></v-checkbox>
          </template>
          
          <v-list-item-title :class="{'text-decoration-line-through': task.solved}">
            {{ task.title }}
          </v-list-item-title>
          
          <v-list-item-subtitle>
            <v-chip
              :color="getTaskTypeColor(task.type)"
              size="small"
              class="mr-2"
              text-color="white"
            >
              {{ getTaskTypeLabel(task.type) }}
            </v-chip>
            <span>{{ task.wheres }}</span>
          </v-list-item-subtitle>
          
          <template v-slot:append>
            <div class="d-flex align-center">
              <v-btn icon="mdi-pencil" variant="text" size="small" @click="$emit('edit-task', task)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" @click="$emit('delete-task', task)"></v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    
    <v-card-text v-else class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
      <div class="mt-4 text-subtitle-1 text-grey">当天没有维修任务</div>
      <v-btn color="primary" class="mt-4" prepend-icon="mdi-plus" @click="$emit('add-task')">
        添加工作
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    required: true
  }
})

defineEmits(['add-task', 'edit-task', 'delete-task', 'update-status'])

// 统计数据
const completedTasks = computed(() => {
  return props.tasks.filter(task => task.solved).length
})

const completionRate = computed(() => {
  if (props.tasks.length === 0) return 0
  return Math.round((completedTasks.value / props.tasks.length) * 100)
})

const totalHours = computed(() => {
  // 假设每个任务平均2小时
  return props.tasks.length * 2
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 获取任务类型标签
const getTaskTypeLabel = (typeId) => {
  const taskTypes = [
    { value: 1, label: '定期维护' },
    { value: 2, label: '设备调试' },
    { value: 3, label: '故障维修' },
    { value: 4, label: '备件更换' },
    { value: 5, label: '预防性维护' }
  ]
  const type = taskTypes.find(t => t.value === parseInt(typeId))
  return type ? type.label : '未知类型'
}

// 获取任务类型颜色
const getTaskTypeColor = (typeId) => {
  const typeValue = parseInt(typeId)
  switch (typeValue) {
    case 1: return 'primary'   // 定期维护
    case 2: return 'info'      // 设备调试
    case 3: return 'error'     // 故障维修
    case 4: return 'warning'   // 备件更换
    case 5: return 'success'   // 预防性维护
    default: return 'grey'
  }
}
</script>

<style scoped>
.maintenance-card {
  display: flex;
  flex-direction: column;
}

.h-100 {
  height: 100%;
}

.task-list {
  max-height: 400px;
  overflow-y: auto;
}

.task-item {
  transition: background-color 0.3s ease, transform 0.2s ease;
  border-radius: 4px;
  margin-bottom: 4px;
}

.task-item:hover {
  transform: translateX(4px);
  background-color: rgba(0, 0, 0, 0.03);
}

.completed-task {
  background-color: rgba(76, 175, 80, 0.05);
}
</style> 