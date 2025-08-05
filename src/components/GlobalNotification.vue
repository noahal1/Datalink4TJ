<template>
  <div class="global-notification">
    <!-- 确认对话框 -->
    <v-dialog
      v-model="confirmDialog.visible"
      max-width="500"
      persistent
      class="confirm-dialog"
    >
      <v-card>
        <v-card-title :class="['text-h5', confirmDialog.titleClass]">
          <v-icon
            v-if="confirmDialog.icon"
            class="mr-2"
          >
            {{ confirmDialog.icon }}
          </v-icon>
          {{ confirmDialog.title }}
        </v-card-title>
        
        <v-card-text class="py-4">
          {{ confirmDialog.message }}
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="handleConfirmCancel"
          >
            {{ confirmDialog.cancelText }}
          </v-btn>
          <v-btn
            :color="confirmDialog.confirmColor"
            @click="handleConfirmOk"
          >
            {{ confirmDialog.confirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 警告对话框 -->
    <v-dialog
      v-model="alertDialog.visible"
      max-width="500"
      class="alert-dialog"
    >
      <v-card>
        <v-card-title :class="['text-h5', alertDialog.titleClass]">
          <v-icon
            v-if="alertDialog.icon"
            class="mr-2"
          >
            {{ alertDialog.icon }}
          </v-icon>
          {{ alertDialog.title }}
        </v-card-title>
        
        <v-card-text class="py-4">
          {{ alertDialog.message }}
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="handleAlertOk"
          >
            {{ alertDialog.confirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, defineExpose, onMounted } from 'vue'

// 确认对话框状态
const confirmDialog = ref({
  visible: false,
  title: '确认',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  confirmColor: 'primary',
  titleClass: '',
  icon: null,
  resolve: null,
  reject: null
})

// 警告对话框状态
const alertDialog = ref({
  visible: false,
  title: '提示',
  message: '',
  confirmText: '确定',
  titleClass: '',
  icon: null,
  resolve: null
})

// 图标映射
const iconMap = {
  success: 'mdi-check-circle',
  error: 'mdi-alert-circle',
  warning: 'mdi-alert',
  info: 'mdi-information'
}

// 颜色映射
const colorMap = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'primary'
}

/**
 * 显示确认对话框
 * @param {Object} options 配置选项
 * @param {string} options.title 标题
 * @param {string} options.message 消息内容
 * @param {string} options.confirmText 确认按钮文本
 * @param {string} options.cancelText 取消按钮文本
 * @param {string} options.type 类型，可选值：success, error, warning, info
 * @returns {Promise<boolean>} 用户选择结果
 */
const confirm = (options = {}) => {
  return new Promise((resolve, reject) => {
    const type = options.type || 'info'
    
    confirmDialog.value = {
      ...confirmDialog.value,
      visible: true,
      title: options.title || '确认',
      message: options.message || '',
      confirmText: options.confirmText || '确认',
      cancelText: options.cancelText || '取消',
      confirmColor: colorMap[type] || 'primary',
      titleClass: type === 'warning' || type === 'error' ? `text-${type}` : '',
      icon: iconMap[type] || null,
      resolve,
      reject
    }
  })
}

/**
 * 显示警告对话框
 * @param {Object} options 配置选项
 * @param {string} options.title 标题
 * @param {string} options.message 消息内容
 * @param {string} options.confirmText 确认按钮文本
 * @param {string} options.type 类型，可选值：success, error, warning, info
 * @returns {Promise<void>} Promise对象
 */
const alert = (options = {}) => {
  return new Promise((resolve) => {
    const type = options.type || 'info'
    
    alertDialog.value = {
      ...alertDialog.value,
      visible: true,
      title: options.title || '提示',
      message: options.message || '',
      confirmText: options.confirmText || '确定',
      titleClass: type === 'warning' || type === 'error' ? `text-${type}` : '',
      icon: iconMap[type] || null,
      resolve
    }
  })
}

// 确认对话框确认按钮处理
const handleConfirmOk = () => {
  confirmDialog.value.visible = false
  if (confirmDialog.value.resolve) {
    confirmDialog.value.resolve(true)
  }
}

// 确认对话框取消按钮处理
const handleConfirmCancel = () => {
  confirmDialog.value.visible = false
  if (confirmDialog.value.resolve) {
    confirmDialog.value.resolve(false)
  }
}

// 警告对话框确认按钮处理
const handleAlertOk = () => {
  alertDialog.value.visible = false
  if (alertDialog.value.resolve) {
    alertDialog.value.resolve()
  }
}

// 向父组件暴露方法
defineExpose({
  confirm,
  alert
})

// 注册为全局组件
onMounted(() => {
  // 提供给 inject 使用
  if (window) {
    window.$notification = {
      confirm,
      alert
    }
  }
})
</script>

<style scoped>
.global-notification {
  position: fixed;
  z-index: 9999;
}

.confirm-dialog .v-card,
.alert-dialog .v-card {
  border-radius: 8px;
}
</style> 