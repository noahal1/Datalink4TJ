<template>
  <v-snackbar
    v-model="visible"
    :color="color"
    :timeout="timeout"
    location="top right"
    multi-line
    elevation="6"
    class="global-snackbar"
  >
    <v-icon v-if="icon" class="mr-2">{{ icon }}</v-icon>
    <span>{{ message }}</span>
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { eventBus } from '../utils/eventBus'

const visible = ref(false)
const message = ref('')
const color = ref('primary')
const icon = ref('')
const timeout = ref(3000)

const iconMap = {
  success: 'mdi-check-circle',
  error: 'mdi-alert-circle',
  warning: 'mdi-alert',
  info: 'mdi-information'
}
const colorMap = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info'
}

function show(msg, type = 'info', time = 3000) {
  message.value = msg
  color.value = colorMap[type] || 'info'
  icon.value = iconMap[type] || ''
  timeout.value = time
  visible.value = false
  setTimeout(() => { visible.value = true }, 10)
}

// 监听事件总线上的消息事件
onMounted(() => {
  eventBus.on('snackbar', ({ message: msg, type, time }) => {
    show(msg, type, time)
  })
})

// 暴露方法给外部
defineExpose({ show })
</script>

<style scoped>
.global-snackbar {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  z-index: 3000 !important;
}
</style> 