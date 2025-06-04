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
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'

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
  successMessage.value = message
  successVisible.value = true
}

const showError = (message) => {
  errorMessage.value = message
  errorVisible.value = true
}

const showWarning = (message) => {
  warningMessage.value = message
  warningVisible.value = true
}

const showInfo = (message) => {
  infoMessage.value = message
  infoVisible.value = true
}

// 通过provide提供方法
provide('showSuccess', showSuccess)
provide('showError', showError)
provide('showWarning', showWarning)
provide('showInfo', showInfo)
</script>

<style scoped>
/* 自定义样式 */
</style> 