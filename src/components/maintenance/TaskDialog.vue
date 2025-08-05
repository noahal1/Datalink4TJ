<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ isNew ? '创建新任务' : '编辑任务' }}</span>
      </v-card-title>
      
      <v-card-text>
        <v-form ref="formRef">
          <v-text-field
            v-model="localTask.title"
            label="任务标题"
            variant="outlined"
            class="mb-4"
            :rules="[v => !!v || '请输入任务标题']"
          />
          
          <v-text-field
            v-model="localTask.wheres"
            label="设备/位置"
            variant="outlined"
            class="mb-4"
            :rules="[v => !!v || '请输入设备或位置']"
          />
          
          <v-select
            v-model="localTask.type"
            :items="taskTypes"
            item-title="label"
            item-value="value"
            label="任务类型"
            variant="outlined"
            class="mb-4"
            :rules="[v => !!v || '请选择任务类型']"
          />
          
          <v-textarea
            v-model="localTask.content_daily"
            label="工作内容"
            variant="outlined"
            class="mb-4"
            rows="3"
            :rules="[v => !!v || '请输入工作内容']"
          />
          
          <v-checkbox
            v-model="localTask.solved"
            label="标记为已完成"
            hide-details
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey"
          text
          @click="$emit('close')"
        >
          取消
        </v-btn>
        <v-btn 
          color="primary" 
          :loading="loading" 
          :disabled="loading"
          @click="saveTask"
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
  task: {
    type: Object,
    required: true
  },
  isNew: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:task', 'save', 'close'])

const formRef = ref(null)

// 本地任务对象，用于双向绑定
const localTask = computed({
  get: () => props.task,
  set: (value) => emit('update:task', value)
})

// 任务类型选项
const taskTypes = [
  { value: 1, label: '定期维护' },
  { value: 2, label: '设备调试' },
  { value: 3, label: '故障维修' },
  { value: 4, label: '备件更换' },
  { value: 5, label: '预防性维护' }
]

// 保存任务
const saveTask = async () => {
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