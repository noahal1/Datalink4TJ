<template>
  <v-dialog
    v-model="dialog"
    max-width="800px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon
          class="mr-2"
          color="warning"
        >
          mdi-alert-circle
        </v-icon>
        <span>{{ title }}</span>
      </v-card-title>
      
      <v-card-subtitle class="pb-2">
        <v-chip
          color="primary"
          size="small"
          class="mr-2"
        >
          {{ item?.area }}
        </v-chip>
        <span class="text-body-2">{{ item?.description }}</span>
      </v-card-subtitle>

      <v-divider />

      <v-card-text class="pt-4">
        <!-- 数据对比信息 -->
        <v-row class="mb-4">
          <v-col cols="4">
            <v-card
              variant="outlined"
              class="text-center pa-3"
            >
              <div class="text-caption text-grey">
                实际值
              </div>
              <div class="text-h6 text-primary">
                {{ formatValue(item?.actual_value) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="4">
            <v-card
              variant="outlined"
              class="text-center pa-3"
            >
              <div class="text-caption text-grey">
                目标值
              </div>
              <div class="text-h6 text-success">
                {{ formatValue(item?.target_value) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="4">
            <v-card
              variant="outlined"
              class="text-center pa-3"
            >
              <div class="text-caption text-grey">
                差异
              </div>
              <div
                class="text-h6"
                :class="getDifferenceColor()"
              >
                {{ getDifferenceText() }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- 原因分析 -->
        <v-textarea
          v-model="localData.root_cause_analysis"
          label="原因分析"
          placeholder="请分析造成未达成目标的根本原因..."
          variant="outlined"
          rows="4"
          counter="500"
          maxlength="500"
          class="mb-4"
          prepend-inner-icon="mdi-magnify"
        />

        <!-- 行动计划 -->
        <div class="mb-4">
          <div class="d-flex align-center mb-3">
            <v-icon class="mr-2" color="primary">mdi-clipboard-list</v-icon>
            <span class="text-h6">行动计划</span>
          </div>

          <!-- 行动计划内容 -->
          <v-textarea
            v-model="localData.action_plan_content"
            label="行动计划内容"
            placeholder="请制定具体的改进行动计划..."
            variant="outlined"
            rows="4"
            counter="500"
            maxlength="500"
            class="mb-3"
          />

          <!-- 日期字段 -->
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="localData.expected_close_date"
                label="预计关闭日期"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="localData.actual_close_date"
                label="实际关闭日期"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="cancel"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="save"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  },
  title: {
    type: String,
    default: '原因分析与行动计划'
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save'])

// 响应式数据
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localData = ref({
  root_cause_analysis: '',
  action_plan_content: '',
  expected_close_date: '',
  actual_close_date: ''
})

// 监听item变化，初始化本地数据
watch(() => props.item, (newItem) => {
  if (newItem) {
    localData.value = {
      root_cause_analysis: newItem.root_cause_analysis || '',
      action_plan_content: newItem.action_plan_content || '',
      expected_close_date: newItem.expected_close_date || '',
      actual_close_date: newItem.actual_close_date || ''
    }
  }
}, { immediate: true })

// 计算属性 - 允许空白内容保存
const isValid = computed(() => {
  return true // 始终允许保存，即使内容为空
})

// 格式化数值显示
const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return String(value)
}

// 获取差异颜色
const getDifferenceColor = () => {
  if (!props.item?.actual_value || !props.item?.target_value) return 'text-grey'
  
  const actual = parseFloat(props.item.actual_value) || 0
  const target = parseFloat(props.item.target_value) || 0
  
  if (actual >= target) return 'text-success'
  return 'text-error'
}

// 获取差异文本
const getDifferenceText = () => {
  if (!props.item?.actual_value || !props.item?.target_value) return '-'
  
  const actual = parseFloat(props.item.actual_value) || 0
  const target = parseFloat(props.item.target_value) || 0
  const difference = actual - target
  
  if (difference >= 0) {
    return `+${difference.toFixed(2)}`
  } else {
    return difference.toFixed(2)
  }
}

// 方法
const save = () => {
  emit('save', {
    root_cause_analysis: localData.value.root_cause_analysis,
    action_plan_content: localData.value.action_plan_content,
    expected_close_date: localData.value.expected_close_date,
    actual_close_date: localData.value.actual_close_date,
    item: props.item
  })
  dialog.value = false
}

const cancel = () => {
  // 重置本地数据
  if (props.item) {
    localData.value = {
      root_cause_analysis: props.item.root_cause_analysis || '',
      action_plan_content: props.item.action_plan_content || '',
      expected_close_date: props.item.expected_close_date || '',
      actual_close_date: props.item.actual_close_date || ''
    }
  }
  dialog.value = false
}
</script>

<style scoped>
.text-field-small {
  max-width: 120px;
}
</style>
