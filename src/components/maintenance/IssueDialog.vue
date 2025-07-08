<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500px"
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-card-title class="d-flex align-center pb-2">
        <v-icon class="mr-2" color="error">
          {{ localIssue.id ? 'mdi-pencil-circle' : 'mdi-plus-circle' }}
        </v-icon>
        <span class="text-h5">{{ localIssue.id ? '编辑问题' : '记录问题' }}</span>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pt-4">
        <v-form ref="formRef">
          <v-textarea
            v-model="localIssue.description"
            label="问题描述"
            variant="outlined"
            class="mb-4"
            rows="3"
            :rules="[v => !!v || '请输入问题描述']"
            placeholder="请详细描述问题的情况..."
            autofocus
          ></v-textarea>
          
          <v-select
            v-model="localIssue.severity"
            :items="severityLevels"
            label="严重程度"
            variant="outlined"
            class="mb-4"
            :item-props="setItemColor"
            density="comfortable"
            prepend-inner-icon="mdi-alert"
          ></v-select>
          
          <v-checkbox
            v-model="localIssue.resolved"
            label="已解决"
            hide-details
            color="success"
          ></v-checkbox>
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" color="grey" @click="$emit('close')">取消</v-btn>
        <v-btn 
          color="primary" 
          variant="elevated"
          @click="saveIssue" 
          :loading="loading"
          :disabled="loading || !isFormValid"
          append-icon="mdi-check"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  issue: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:issue', 'save', 'close'])

const formRef = ref(null)
const isFormValid = computed(() => !!localIssue.value.description)

// 本地问题对象，用于双向绑定
const localIssue = computed({
  get: () => props.issue,
  set: (value) => emit('update:issue', value)
})

// 严重程度选项
const severityLevels = ['严重', '中等', '轻微']

// 设置下拉项目的颜色
const setItemColor = (item) => {
  const severity = item.raw
  let color = 'grey'
  
  switch (severity) {
    case '严重': color = 'error'; break
    case '中等': color = 'warning'; break
    case '轻微': color = 'info'; break
  }
  
  return {
    color: color,
    prependIcon: severity === '严重' ? 'mdi-alert-circle' : 
                 severity === '中等' ? 'mdi-alert' : 'mdi-information'
  }
}

// 保存问题
const saveIssue = async () => {
  // 表单验证
  const isValid = await formRef.value?.validate()

  if (isValid?.valid) {
    emit('save')
  }
}

// 监听对话框打开，重置表单验证
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      formRef.value?.resetValidation()
    }, 50)
  }
})
</script> 