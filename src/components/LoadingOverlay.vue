<template>
  <transition name="fade" appear>
    <div v-if="loading" class="loading-overlay" :class="{ 'loading-overlay--blur': blur }">
      <div class="loading-content">
        <div class="loading-spinner">
          <v-progress-circular
            :size="size"
            :width="width"
            indeterminate
            color="primary"
            class="loading-circle"
          ></v-progress-circular>
          <div class="loading-pulse"></div>
        </div>
        <div v-if="message" class="loading-text">
          <span class="loading-text-content">{{ message }}</span>
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  </transition>
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
    default: 60
  },
  width: {
    type: Number,
    default: 5
  },
  overlay: {
    type: Boolean,
    default: true
  },
  blur: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
/* 加载遮罩层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  border-radius: inherit;
}

.loading-overlay--blur {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.85);
}

/* 加载内容容器 */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* 加载旋转器容器 */
.loading-spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

/* 加载圆圈 */
.loading-circle {
  filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2));
  z-index: 2;
  position: relative;
}

/* 脉冲效果 */
.loading-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
}

/* 加载文本 */
.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.loading-text-content {
  font-size: 1rem;
  color: var(--grey-700);
  font-weight: 500;
  letter-spacing: 0.025em;
}

/* 加载点动画 */
.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-500);
  animation: dot-bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0s;
}

/* 动画定义 */
@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.2;
  }
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .loading-content {
    padding: 1.5rem;
  }

  .loading-pulse {
    width: 60px;
    height: 60px;
  }

  .loading-text-content {
    font-size: 0.875rem;
  }
}

/* 当父元素是相对定位时才生效 */
:deep(.v-card--loading) .loading-overlay {
  border-radius: inherit;
}
</style>