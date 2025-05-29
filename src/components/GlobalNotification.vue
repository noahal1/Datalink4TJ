<template>
  <v-snackbar
    v-model="show"
    :color="type"
    :timeout="timeout"
    :location="location"
    class="global-notification"
  >
    <div class="d-flex align-center">
      <v-icon v-if="icon" :icon="icon" class="mr-3" />
      <div>
        <div v-if="title" class="font-weight-medium mb-1">{{ title }}</div>
        <div>{{ text }}</div>
      </div>
    </div>
    <template v-slot:actions>
      <v-btn
        v-if="showClose"
        variant="text"
        icon="mdi-close"
        @click="closeNotification"
      />
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, computed } from 'vue'

// 通知状态
const show = ref(false)
const text = ref('')
const title = ref('')
const type = ref('info')
const timeout = ref(5000)
const showClose = ref(true)
const location = ref('bottom')

// 根据类型计算图标
const icon = computed(() => {
  switch (type.value) {
    case 'success': return 'mdi-check-circle'
    case 'error': return 'mdi-alert-circle'
    case 'warning': return 'mdi-alert'
    case 'info': return 'mdi-information'
    default: return ''
  }
})

// 显示通知方法
const showNotification = (config) => {
  text.value = config.text || '操作完成'
  title.value = config.title || ''
  type.value = config.type || 'info'
  timeout.value = config.timeout !== undefined ? config.timeout : 5000
  showClose.value = config.showClose !== undefined ? config.showClose : true
  location.value = config.location || 'bottom'
  show.value = true
}

// 关闭通知
const closeNotification = () => {
  show.value = false
}

// 成功通知快捷方法
const success = (text, options = {}) => {
  showNotification({
    text,
    type: 'success',
    ...options
  })
}

// 错误通知快捷方法
const error = (text, options = {}) => {
  showNotification({
    text,
    type: 'error',
    ...options
  })
}

// 警告通知快捷方法
const warning = (text, options = {}) => {
  showNotification({
    text,
    type: 'warning',
    ...options
  })
}

// 信息通知快捷方法
const info = (text, options = {}) => {
  showNotification({
    text,
    type: 'info',
    ...options
  })
}

// 暴露方法供其他组件使用
defineExpose({
  showNotification,
  success,
  error,
  warning,
  info,
  closeNotification
})
</script>

<style scoped>
.global-notification {
  max-width: 400px;
}
</style> 