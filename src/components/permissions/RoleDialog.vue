<template>
  <v-dialog
    v-model="localDialog"
    max-width="600px"
    persistent
    @click:outside="closeDialog"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ isNew ? '创建新角色' : '编辑角色' }}
      </v-card-title>
      
      <v-card-text>
        <v-container>
          <v-form
            ref="formRef"
            v-model="formValid"
            lazy-validation
          >
            <v-row>
              <!-- 角色名称 -->
              <v-col cols="12">
                <v-text-field
                  v-model="localRole.name"
                  label="角色名称*"
                  required
                  :rules="[v => !!v || '角色名称不能为空']"
                  hint="输入角色的名称，如：系统管理员、质量主管等"
                  persistent-hint
                />
              </v-col>
              
              <!-- 角色描述 -->
              <v-col cols="12">
                <v-textarea
                  v-model="localRole.description"
                  label="角色描述"
                  hint="输入角色的详细描述"
                  persistent-hint
                  rows="3"
                  auto-grow
                />
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey-darken-1"
          variant="text"
          :disabled="loading"
          @click="closeDialog"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!formValid || loading"
          @click="saveRole"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  role: {
    type: Object,
    default: () => ({
      id: null,
      name: '',
      description: ''
    })
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

const emit = defineEmits(['update:modelValue', 'update:role', 'save', 'close'])

// 本地表单数据
const localDialog = ref(props.modelValue)
const localRole = ref({...props.role})
const formValid = ref(false)
const formRef = ref(null)

// 监听dialog prop变化
watch(() => props.modelValue, (newVal) => {
  localDialog.value = newVal
})

// 监听localDialog变化
watch(() => localDialog.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听role prop变化
watch(() => props.role, (newVal) => {
  localRole.value = {...newVal}
})

// 关闭对话框
const closeDialog = () => {
  localDialog.value = false
  emit('close')
}

// 保存角色
const saveRole = () => {
  if (!formRef.value?.validate()) return

  emit('update:role', localRole.value)
  emit('save')
}
</script> 