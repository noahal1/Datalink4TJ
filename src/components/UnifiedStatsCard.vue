<template>
  <v-card class="unified-stats-card h-100" :elevation="elevation" :color="bgColor">
    <v-card-text class="d-flex flex-column h-100">
      <!-- 标题和图标 -->
      <div class="d-flex align-center mb-2">
        <div v-if="icon" class="unified-stats-icon" :class="`bg-${color}-light`">
          <v-icon :color="iconColor" size="24">{{ icon }}</v-icon>
        </div>
        <div class="unified-stats-title">{{ title }}</div>
      </div>
      
      <!-- 数值 -->
      <div class="unified-stats-value-container my-2 d-flex align-center">
        <div class="unified-stats-value">
          <slot name="value">{{ value }}</slot>
        </div>
        
        <!-- 变化指标 -->
        <div v-if="showChange && change !== null" class="unified-stats-change ms-3" :class="changeColorClass">
          <v-icon size="small" class="mr-1">
            {{ change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
          </v-icon>
          <span>{{ formatChange(change) }}</span>
        </div>
      </div>
      
      <!-- 进度条 -->
      <div v-if="showProgress && typeof value === 'string' && value.includes('%')" class="progress-container mb-2">
        <v-progress-linear
          :model-value="parseFloat(value)"
          :color="color"
          height="6"
          rounded
        ></v-progress-linear>
      </div>
      
      <!-- 副标题 -->
      <div v-if="subtitle || $slots.subtitle" class="unified-stats-subtitle mt-auto">
        <slot name="subtitle">{{ subtitle }}</slot>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: '0'
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'primary'
  },
  change: {
    type: [Number, String],
    default: null
  },
  showChange: {
    type: Boolean,
    default: false
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  outlined: {
    type: Boolean,
    default: false
  },
  elevation: {
    type: [Number, String],
    default: 2
  }
});

// 计算图标颜色
const iconColor = computed(() => {
  return props.outlined ? props.color : 'white';
});

// 计算卡片背景颜色
const bgColor = computed(() => {
  return props.outlined ? undefined : 'white';
});

// 计算变化指标的颜色类
const changeColorClass = computed(() => {
  if (props.change === null) return '';
  
  // 处理字符串类型的变化值
  const changeValue = typeof props.change === 'string' 
    ? parseFloat(props.change.replace(/[+%]/g, ''))
    : props.change;
  
  return changeValue >= 0 ? 'text-success' : 'text-error';
});

// 格式化变化值
const formatChange = (change) => {
  if (typeof change === 'string') {
    // 如果已经是格式化的字符串，直接返回
    if (change.startsWith('+') || change.startsWith('-')) {
      return change;
    }
    return parseFloat(change) >= 0 ? `+${change}` : change;
  }
  
  // 数字类型
  if (typeof change === 'number') {
    // 如果是整数，不显示小数点
    if (Number.isInteger(change)) {
      return change > 0 ? `+${change}` : `${change}`;
    }
    // 浮点数保留一位小数
    const formattedChange = change.toFixed(1);
    return change > 0 ? `+${formattedChange}%` : `${formattedChange}%`;
  }
  
  return change;
};
</script>

<style scoped>
.unified-stats-card {
  border-radius: 12px;
  transition: transform 0.3s, box-shadow 0.3s;
  overflow: hidden;
}

.unified-stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.unified-stats-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  margin-right: 8px;
}

.unified-stats-title {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.8);
  font-weight: 600;
}

.unified-stats-value-container {
  position: relative;
}

.unified-stats-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.2;
}

.unified-stats-subtitle {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 4px;
}

.unified-stats-change {
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 16px;
  white-space: nowrap;
}

.text-success {
  color: var(--v-theme-success);
  background-color: rgba(var(--v-theme-success), 0.1);
}

.text-error {
  color: var(--v-theme-error);
  background-color: rgba(var(--v-theme-error), 0.1);
}

.progress-container {
  margin-top: 8px;
  width: 100%;
}

.bg-primary-light {
  background-color: rgba(var(--v-theme-primary), 0.15);
}

.bg-secondary-light {
  background-color: rgba(var(--v-theme-secondary), 0.15);
}

.bg-success-light {
  background-color: rgba(var(--v-theme-success), 0.15);
}

.bg-error-light {
  background-color: rgba(var(--v-theme-error), 0.15);
}

.bg-warning-light {
  background-color: rgba(var(--v-theme-warning), 0.15);
}

.bg-info-light {
  background-color: rgba(var(--v-theme-info), 0.15);
}

.h-100 {
  height: 100%;
}

@media (max-width: 600px) {
  .unified-stats-value {
    font-size: 1.5rem;
  }
  
  .unified-stats-icon {
    width: 38px;
    height: 38px;
    margin-right: 12px;
  }
  
  .unified-stats-change {
    font-size: 0.75rem;
    padding: 1px 6px;
  }
}
</style> 