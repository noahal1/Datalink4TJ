<template>
  <div class="simple-loading-overlay" v-if="visible">
    <div class="simple-loading-spinner">
      <v-progress-circular
        :size="size"
        :width="width"
        indeterminate
        color="primary"
      ></v-progress-circular>
      <div v-if="text" class="simple-loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
const text = ref('加载中...');
const size = ref(50);
const width = ref(5);

// 创建一个加载服务API，类似element-plus的ElLoading.service
const loadingService = {
  open(options = {}) {
    text.value = options.text || '加载中...';
    size.value = options.size || 50;
    width.value = options.width || 5;
    visible.value = true;
  },
  close() {
    visible.value = false;
  }
};

// 暴露加载服务API
defineExpose({
  service: () => {
    loadingService.open();
    return loadingService;
  },
  ...loadingService
});
</script>

<style scoped>
.simple-loading-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.simple-loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.simple-loading-text {
  margin-top: 10px;
  font-size: 14px;
  color: #409eff;
}
</style> 