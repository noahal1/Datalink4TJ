<template>
  <div 
    class="optimized-image-container" 
    :class="{ 'has-loading': loading, 'has-error': error }"
    :style="containerStyle"
  >
    <img
      v-if="!error"
      ref="image"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :style="imgStyle"
      v-bind="$attrs"
      @load="onImageLoaded"
      @error="onImageError"
    >
    
    <!-- 加载态 -->
    <div
      v-if="loading"
      class="image-loading"
    >
      <v-progress-circular
        size="32"
        indeterminate
        color="primary"
      />
    </div>
    
    <!-- 错误态 -->
    <div
      v-if="error"
      class="image-error"
    >
      <v-icon
        size="large"
        color="error"
      >
        mdi-alert-circle
      </v-icon>
      <span>{{ errorText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [Number, String],
    default: null
  },
  height: {
    type: [Number, String],
    default: null
  },
  lazy: {
    type: Boolean,
    default: true
  },
  objectFit: {
    type: String,
    default: 'cover'
  },
  fallbackSrc: {
    type: String,
    default: ''
  },
  errorText: {
    type: String,
    default: '图片加载失败'
  }
})

const image = ref(null)
const isVisible = ref(false)
const loading = ref(true)
const error = ref(false)
const actualSrc = ref('')

// 计算容器样式
const containerStyle = computed(() => {
  const style = {}
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return style
})

// 计算图片样式
const imgStyle = computed(() => {
  return {
    objectFit: props.objectFit,
    opacity: loading.value ? 0 : 1
  }
})

// 图片加载成功处理
const onImageLoaded = () => {
  loading.value = false
}

// 图片加载失败处理
const onImageError = () => {
  loading.value = false
  
  // 如果有备用图片，尝试加载备用图片
  if (props.fallbackSrc && actualSrc.value !== props.fallbackSrc) {
    actualSrc.value = props.fallbackSrc
  } else {
    error.value = true
  }
}

// 开始加载图片
const loadImage = () => {
  actualSrc.value = props.src
}

onMounted(() => {
  if (props.lazy) {
    // 使用交叉观察器实现图片懒加载
    const { stop } = useIntersectionObserver(
      image,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          isVisible.value = true
          loadImage()
          stop() // 停止观察，图片只需要加载一次
        }
      },
      { threshold: 0.1 }
    )
  } else {
    // 立即加载图片
    loadImage()
  }
})
</script>

<style scoped>
.optimized-image-container {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
  min-height: 50px;
  min-width: 50px;
}

img {
  max-width: 100%;
  transition: opacity 0.3s ease;
}

.image-loading,
.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.image-error {
  color: #ff5252;
  background-color: rgba(255, 82, 82, 0.1);
  padding: 8px;
}

.image-error span {
  margin-top: 8px;
  font-size: 0.875rem;
  text-align: center;
}
</style>