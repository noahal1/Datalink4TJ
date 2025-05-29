<template>
  <v-card :elevation="elevation" :class="['stats-card', cardClass]" :style="cardStyle">
    <div class="stats-card-content">
      <!-- 图标 -->
      <div v-if="icon || iconSlot" class="stats-card-icon" :class="[`bg-${color}`, iconClass]">
        <slot name="icon">
          <v-icon :icon="icon" size="24"></v-icon>
        </slot>
      </div>

      <!-- 内容 -->
      <div class="stats-card-info">
        <!-- 标题 -->
        <div class="stats-card-title">
          {{ title }}
        </div>
        
        <!-- 统计数字 -->
        <div class="stats-card-value">
          <slot name="value">
            {{ value || '0' }}
          </slot>
        </div>
        
        <!-- 变化或底部信息 -->
        <div v-if="$slots.footer || subtitle || showChange" class="stats-card-footer">
          <slot name="footer">
            <div v-if="showChange" class="change-indicator" :class="changeClass">
              <v-icon 
                :icon="change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'" 
                size="small" 
                class="mr-1"
              ></v-icon>
              <span>{{ Math.abs(change) }}% {{ change >= 0 ? '增长' : '下降' }}</span>
            </div>
            <span v-else-if="subtitle">{{ subtitle }}</span>
          </slot>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  color: {
    type: String,
    default: 'primary'
  },
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  change: {
    type: Number,
    default: null
  },
  subtitle: {
    type: String,
    default: ''
  },
  showChange: {
    type: Boolean,
    default: false
  },
  cardClass: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    default: ''
  },
  elevation: {
    type: [Number, String],
    default: 1
  }
});

const iconSlot = computed(() => !!props.icon);

const cardStyle = computed(() => {
  return {
    borderTop: props.color ? `3px solid var(--${props.color})` : null,
  };
});

const changeClass = computed(() => {
  if (props.change === null) return '';
  return props.change >= 0 ? 'text-success' : 'text-error';
});
</script>

<style scoped>
.stats-card {
  position: relative;
  border-radius: var(--border-radius-md, 8px);
  overflow: hidden;
}

.stats-card-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
}

.stats-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 16px;
  color: white;
}

.bg-primary {
  background-color: var(--primary, #1976d2);
}

.bg-success {
  background-color: var(--success, #2e7d32);
}

.bg-warning {
  background-color: var(--warning, #ed6c02);
}

.bg-error {
  background-color: var(--error, #d32f2f);
}

.bg-info {
  background-color: var(--info, #0288d1);
}

.stats-card-info {
  flex: 1;
}

.stats-card-title {
  font-size: 0.875rem;
  color: var(--grey-600, #757575);
  margin-bottom: 4px;
}

.stats-card-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--grey-900, #212121);
  line-height: 1.2;
  margin-bottom: 4px;
}

.stats-card-footer {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
}

.change-indicator {
  display: flex;
  align-items: center;
}

.text-success {
  color: var(--success, #2e7d32);
}

.text-error {
  color: var(--error, #d32f2f);
}
</style> 