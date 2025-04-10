<template>
  <v-card class="h-100 elevation-2">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-calendar-week</v-icon>
      本周维修计划
      <v-spacer></v-spacer>
      <v-btn color="success" size="small" prepend-icon="mdi-file-export" @click="$emit('export')">
        导出
      </v-btn>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-data-table
      :headers="headers"
      :items="tasks"
      class="elevation-0"
      density="compact"
    >
      <template v-slot:item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>
      
      <template v-slot:item.type="{ item }">
        <v-chip
          :color="getTaskTypeColor(item.type)"
          size="small"
          text-color="white"
        >
          {{ getTaskTypeLabel(item.type) }}
        </v-chip>
      </template>
      
      <template v-slot:item.solved="{ item }">
        <v-icon
          :color="item.solved ? 'success' : 'grey'"
        >
          {{ item.solved ? 'mdi-check-circle' : 'mdi-clock-outline' }}
        </v-icon>
      </template>
      
      <template v-slot:no-data>
        <div class="text-center py-4">
          <v-icon size="40" color="grey-lighten-1">mdi-calendar-blank</v-icon>
          <div class="mt-2 text-body-2 text-grey">本周没有维修计划</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

defineEmits(['export'])

// 表格头
const headers = ref([
  { title: '日期', key: 'date', align: 'start' },
  { title: '设备', key: 'wheres', align: 'start' },
  { title: '工作内容', key: 'content_daily', align: 'start' },
  { title: '类型', key: 'type', align: 'center' },
  { title: '状态', key: 'solved', align: 'center' }
])

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
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