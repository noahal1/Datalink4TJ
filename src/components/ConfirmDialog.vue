<template>
  <v-dialog
    v-model="visible"
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
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="onCancelClick"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="onConfirmClick"
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { eventBus } from '../utils/eventBus';

const visible = ref(false);
const title = ref('确认操作');
const message = ref('');
let confirmCallback = null;
let cancelCallback = null;

// 处理确认按钮点击
const onConfirmClick = () => {
  visible.value = false;
  if (typeof confirmCallback === 'function') {
    confirmCallback();
  }
  // 重置回调
  confirmCallback = null;
  cancelCallback = null;
};

// 处理取消按钮点击
const onCancelClick = () => {
  visible.value = false;
  if (typeof cancelCallback === 'function') {
    cancelCallback();
  }
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
  visible.value = true;
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