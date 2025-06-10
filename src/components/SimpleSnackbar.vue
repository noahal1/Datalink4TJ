<template>
  <div>
    <!-- 成功消息 -->
    <v-snackbar
      v-model="successVisible"
      color="success"
      :timeout="3000"
      location="top right"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        <span>{{ successMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="successVisible = false"
        ></v-btn>
      </template>
    </v-snackbar>
    
    <!-- 错误消息 -->
    <v-snackbar
      v-model="errorVisible"
      color="error"
      :timeout="3000"
      location="top right"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        <span>{{ errorMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="errorVisible = false"
        ></v-btn>
      </template>
    </v-snackbar>
    
    <!-- 警告消息 -->
    <v-snackbar
      v-model="warningVisible"
      color="warning"
      :timeout="3000"
      location="top right"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-alert</v-icon>
        <span>{{ warningMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="warningVisible = false"
        ></v-btn>
      </template>
    </v-snackbar>
    
    <!-- 信息消息 -->
    <v-snackbar
      v-model="infoVisible"
      color="info"
      :timeout="3000"
      location="top right"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-information</v-icon>
        <span>{{ infoMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="infoVisible = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, provide, defineExpose, onMounted } from 'vue'
import { eventBus } from '../utils/eventBus'

const successMessage = ref('')
const errorMessage = ref('')
const warningMessage = ref('')
const infoMessage = ref('')

const successVisible = ref(false)
const errorVisible = ref(false)
const warningVisible = ref(false)
const infoVisible = ref(false)

// 提供方法给应用使用
const showSuccess = (message) => {
  console.log('SimpleSnackbar.showSuccess:', message)
  successMessage.value = message
  successVisible.value = true
  return new Promise(resolve => setTimeout(resolve, 3000))
}

const showError = (message) => {
  console.log('SimpleSnackbar.showError:', message)
  errorMessage.value = message
  errorVisible.value = true
  return new Promise(resolve => setTimeout(resolve, 3000))
}

const showWarning = (message) => {
  console.log('SimpleSnackbar.showWarning:', message)
  warningMessage.value = message
  warningVisible.value = true
  return new Promise(resolve => setTimeout(resolve, 3000))
}

const showInfo = (message) => {
  console.log('SimpleSnackbar.showInfo:', message)
  infoMessage.value = message
  infoVisible.value = true
  return new Promise(resolve => setTimeout(resolve, 3000))
}

// 处理事件总线上的snackbar事件
onMounted(() => {
  const unsubscribe = eventBus.on('snackbar', (data) => {
    console.log('SimpleSnackbar received event:', data)
    const { message, type = 'info' } = data
    
    if (type === 'success') {
      showSuccess(message)
    } else if (type === 'error') {
      showError(message)
    } else if (type === 'warning') {
      showWarning(message)
    } else {
      showInfo(message)
    }
  })
  
  // 组件卸载时取消订阅
  return () => {
    unsubscribe && unsubscribe()
  }
})

// 通过provide提供方法
provide('showSuccess', showSuccess)
provide('showError', showError)
provide('showWarning', showWarning)
provide('showInfo', showInfo)

// 暴露方法给父组件
defineExpose({
  showSuccess,
  showError,
  showWarning,
  showInfo
})
</script>

<style scoped>
/* 自定义样式 */
</style> 