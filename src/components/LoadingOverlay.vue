<template>
  <div v-if="loading" class="loading-overlay">
    <div class="loading-content">
      <v-progress-circular
        :size="size"
        :width="width"
        indeterminate
        color="primary"
      ></v-progress-circular>
      <div v-if="message" class="mt-3 loading-text">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: '加载中...'
  },
  size: {
    type: Number,
    default: 50
  },
  width: {
    type: Number,
    default: 4
  },
  overlay: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 1rem;
  color: var(--v-primary-base);
  font-weight: 500;
}

/* 当父元素是相对定位时才生效 */
:deep(.v-card--loading) .loading-overlay {
  border-radius: inherit;
}
</style> 