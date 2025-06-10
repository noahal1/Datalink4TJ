<template>
  <v-form
    ref="form"
    v-model="valid"
    @submit.prevent="handleSubmit"
    class="unified-form"
  >
    <v-card class="unified-form-card" :elevation="elevation">
      <!-- 表单标题 -->
      <v-card-title v-if="title || $slots.title" class="unified-form-title d-flex align-center">
        <v-icon v-if="icon" class="mr-2" :color="iconColor">{{ icon }}</v-icon>
        <slot name="title">{{ title }}</slot>
      </v-card-title>
      
      <v-divider v-if="title || $slots.title"></v-divider>
      
      <!-- 表单内容 -->
      <v-card-text class="unified-form-content">
        <slot></slot>
      </v-card-text>
      
      <!-- 表单操作按钮 -->
      <v-card-actions v-if="$slots.actions || showDefaultActions" class="unified-form-actions">
        <slot name="actions">
          <v-spacer></v-spacer>
          <v-btn
            v-if="showReset"
            variant="outlined"
            color="grey"
            class="mr-2"
            @click="handleReset"
            :disabled="loading"
          >
            {{ resetText }}
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="disableSubmit ? !valid : false"
          >
            {{ submitText }}
          </v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconColor: {
    type: String,
    default: 'primary'
  },
  submitText: {
    type: String,
    default: '提交'
  },
  resetText: {
    type: String,
    default: '重置'
  },
  showDefaultActions: {
    type: Boolean,
    default: true
  },
  showReset: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  disableSubmit: {
    type: Boolean,
    default: true
  },
  elevation: {
    type: [Number, String],
    default: 1
  }
});

const emit = defineEmits(['submit', 'reset', 'update:valid']);

const form = ref(null);
const valid = ref(true);

// 处理表单提交
const handleSubmit = () => {
  if (props.disableSubmit && !valid.value) {
    return;
  }
  
  emit('submit', { valid: valid.value, form: form.value });
};

// 处理表单重置
const handleReset = () => {
  form.value?.reset();
  emit('reset');
};

// 监听表单验证状态变化
const watchValid = computed({
  get: () => valid.value,
  set: (newValue) => {
    valid.value = newValue;
    emit('update:valid', newValue);
  }
});

// 暴露方法给父组件
defineExpose({
  validate: () => form.value?.validate(),
  reset: () => form.value?.reset(),
  resetValidation: () => form.value?.resetValidation()
});
</script>

<style scoped>
.unified-form {
  width: 100%;
}

.unified-form-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.unified-form-title {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-lg);
  font-weight: 500;
  background-color: rgba(0, 0, 0, 0.02);
}

.unified-form-content {
  padding: var(--spacing-lg);
}

.unified-form-actions {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--grey-50);
}

@media (max-width: 600px) {
  .unified-form-title,
  .unified-form-actions {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .unified-form-content {
    padding: var(--spacing-md);
  }
}
</style> 