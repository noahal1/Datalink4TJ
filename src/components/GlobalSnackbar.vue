<template>
  <v-snackbar
    v-model="visible"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    :location="location"
    class="global-snackbar"
  >
    {{ snackbar.text }}
    
    <template v-slot:actions>
      <v-btn
        variant="text"
        icon="mdi-close"
        @click="visible = false"
      ></v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted, defineExpose } from 'vue'

// 默认位置为右下角
const location = 'bottom right'

// 消息内容
const snackbar = ref({
  text: '',
  color: 'success',
  timeout: 3000
})

// 显示状态
const visible = ref(false)

/**
 * 显示消息
 * @param {Object} options 配置选项
 * @param {string} options.text 消息文本
 * @param {string} options.color 颜色，可选值：success, error, warning, info
 * @param {number} options.timeout 显示时间，单位ms
 */
const show = (options) => {
  snackbar.value = {
    text: options.text || '',
    color: options.color || 'success',
    timeout: options.timeout || 3000
  }
  visible.value = true
}

// 向父组件暴露方法
defineExpose({
  show
})

// 注册为全局组件
onMounted(() => {
  // 提供给 inject 使用
  if (window) {
    window.$snackbar = {
      show
    }
  }
})
</script>

<style scoped>
.global-snackbar {
  z-index: 9999;
}
</style> 