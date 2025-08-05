<template>
  <div class="app-loader">
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
      width="4"
    />
    <div class="app-loader-text mt-4">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  message: {
    type: String,
    default: '加载中...'
  }
})
</script>

<style scoped>
.app-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.app-loader-text {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: 0.5px;
}
</style> 