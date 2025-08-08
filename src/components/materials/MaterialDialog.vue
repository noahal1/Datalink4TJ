<template>
  <v-dialog
    v-model="dialog"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ isNew ? '新建物料' : '编辑物料' }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="valid"
        >
          <v-row>
            <!-- 基本信息 -->
            <v-col cols="12">
              <h4 class="text-subtitle-1 mb-3">
                基本信息
              </h4>
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localMaterial.material_code"
                label="物料编码"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localMaterial.material_name"
                label="物料名称"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localMaterial.brand"
                label="品牌"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localMaterial.unit"
                label="单位"
                placeholder="如：个、台、米、公斤等"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localMaterial.category"
                label="物料分类"
                placeholder="如：设备配件、工具、消耗品等"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-switch
                v-model="localMaterial.is_active"
                label="是否启用"
                color="success"
                inset
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="localMaterial.specification"
                label="规格型号"
                rows="2"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="localMaterial.description"
                label="描述"
                rows="3"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn @click="close">
          取消
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!valid"
          @click="save"
        >
          {{ isNew ? '创建' : '更新' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: Boolean,
  material: Object,
  isNew: Boolean,
  loading: Boolean
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:material', 'save', 'close'])

// 响应式数据
const formRef = ref(null)
const valid = ref(false)
const localMaterial = ref({})

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 验证规则
const rules = {
  required: value => !!value || '此字段为必填项'
}

// 方法
const save = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  emit('save', localMaterial.value)
}

const close = () => {
  emit('close')
}

// 监听props变化
watch(() => props.material, (newMaterial) => {
  if (newMaterial) {
    localMaterial.value = { ...newMaterial }
  }
}, { immediate: true, deep: true })

// 监听dialog变化，重置表单
watch(dialog, (newVal) => {
  if (newVal && formRef.value) {
    formRef.value.resetValidation()
  }
})
</script>

<style scoped>
/* 统一卡片样式 */
.v-card {
  border-radius: 12px !important;
}

/* 统一按钮样式 */
.v-btn {
  border-radius: 8px !important;
}
</style>