<template>
  <v-dialog
    v-model="dialog"
    max-width="700"
    persistent
  >
    <v-card v-if="material">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <span>物料详情</span>
          <v-chip
            :color="material.is_active ? 'success' : 'error'"
            size="small"
            variant="flat"
            class="ml-2"
          >
            {{ material.is_active ? '启用' : '停用' }}
          </v-chip>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
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
              :model-value="material.material_code"
              label="物料编码"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="material.material_name"
              label="物料名称"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="material.brand || '-'"
              label="品牌"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="material.unit || '-'"
              label="单位"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="material.category || '-'"
              label="物料分类"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="formatDate(material.created_at)"
              label="创建时间"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="material.specification"
            cols="12"
          >
            <v-textarea
              :model-value="material.specification"
              label="规格型号"
              readonly
              variant="outlined"
              density="compact"
              rows="2"
            />
          </v-col>

          <v-col
            v-if="material.description"
            cols="12"
          >
            <v-textarea
              :model-value="material.description"
              label="描述"
              readonly
              variant="outlined"
              density="compact"
              rows="3"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn @click="close">
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  modelValue: Boolean,
  material: Object
})

// Emits
const emit = defineEmits(['update:modelValue', 'close'])

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const close = () => {
  emit('close')
}
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