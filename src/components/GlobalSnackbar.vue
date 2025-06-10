<template>
  <v-snackbar
    v-model="visible"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="bottom right"
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
import { ref, onMounted, defineExpose } from 'vue';
import { eventBus } from '../utils/eventBus';

// 消息内容
const snackbar = ref({
  text: '',
  color: 'success',
  timeout: 3000
});

// 显示状态
const visible = ref(false);

/**
 * 显示消息
 * @param {Object|string} options 配置选项或消息文本
 */
const show = (options) => {
  console.log('GlobalSnackbar.show called with:', options);
  
  // 处理字符串参数
  if (typeof options === 'string') {
    snackbar.value = {
      text: options,
      color: 'success',
      timeout: 3000
    };
  } 
  // 处理对象参数
  else if (typeof options === 'object') {
    snackbar.value = {
      text: options.text || options.message || '',
      color: options.color || options.type || 'success',
      timeout: options.timeout || options.time || 3000
    };
  }
  
  visible.value = true;
  return new Promise(resolve => {
    setTimeout(resolve, snackbar.value.timeout);
  });
};

// 向父组件暴露方法
defineExpose({
  show
});

// 监听事件总线上的snackbar事件
onMounted(() => {
  // 注册事件监听
  const unsubscribe = eventBus.on('snackbar', (data) => {
    console.log('GlobalSnackbar received event:', data);
    show({
      text: data.message,
      color: data.type,
      timeout: data.time
    });
  });
  
  // 提供给 window 使用
  if (window) {
    window.$snackbar = {
      show
    };
  }
  
  // 组件卸载时取消订阅
  return () => {
    unsubscribe && unsubscribe();
  };
});
</script>

<style scoped>
.global-snackbar {
  z-index: 9999;
}
</style> 