<template>
  <v-dialog
    v-model="localValue"
    max-width="400px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 pb-2">
        {{ title }}
      </v-card-title>
      <v-card-text>
        {{ message }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="loading"
          @click="onCancelClick"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loading"
          :disabled="loading"
          @click="onConfirmClick"
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { eventBus } from '../utils/eventBus';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

// 本地状态
const localValue = ref(props.modelValue);
let confirmCallback = null;
let cancelCallback = null;

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal;
});

// 监听localValue变化
watch(() => localValue.value, (newVal) => {
  emit('update:modelValue', newVal);
});

// 处理确认按钮点击
const onConfirmClick = () => {
  emit('confirm');
  
  if (typeof confirmCallback === 'function') {
    confirmCallback();
  }
  
  // 不自动关闭，由父组件控制
  if (!props.loading) {
    localValue.value = false;
    // 重置回调
    confirmCallback = null;
    cancelCallback = null;
  }
};

// 处理取消按钮点击
const onCancelClick = () => {
  emit('cancel');
  
  if (typeof cancelCallback === 'function') {
    cancelCallback();
  }
  
  localValue.value = false;
  // 重置回调
  confirmCallback = null;
  cancelCallback = null;
};

// 显示确认对话框
const showConfirm = (dialogTitle, dialogMessage, onConfirm, onCancel) => {
  title.value = dialogTitle;
  message.value = dialogMessage;
  confirmCallback = onConfirm;
  cancelCallback = onCancel;
  localValue.value = true;
};

// 监听确认事件
onMounted(() => {
  eventBus.on('dialog:confirm', ({ title: dialogTitle, message: dialogMessage, onConfirm, onCancel }) => {
    showConfirm(dialogTitle, dialogMessage, onConfirm, onCancel);
  });
});

// 暴露方法给外部使用
defineExpose({
  showConfirm
});
</script>

<style scoped>
.v-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.v-card {
  border-radius: 8px;
}

.v-card-title {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style> 