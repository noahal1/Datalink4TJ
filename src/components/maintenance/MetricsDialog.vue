<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600px"
  >
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ isNew ? '添加维修数据指标' : '编辑维修数据指标' }}</span>
      </v-card-title>
      
      <v-card-text>
        <v-form ref="form">
          <v-select
            v-model="localMetric.equipment_type"
            :items="equipmentTypes"
            label="设备类型"
            variant="outlined"
            class="mb-4"
            :rules="[v => !!v || '请选择设备类型']"
          ></v-select>
          
          <v-text-field
            v-model="localMetric.downtime_count"
            label="停机次数"
            variant="outlined"
            class="mb-4"
            type="number"
            min="0"
            :rules="[v => v >= 0 || '停机次数不能为负数']"
          ></v-text-field>
          
          <v-text-field
            v-model="localMetric.downtime_minutes"
            label="停机时间(分钟)"
            variant="outlined"
            class="mb-4"
            type="number"
            min="0"
            step="0.1"
            :rules="[v => v >= 0 || '停机时间不能为负数']"
          ></v-text-field>
          
          <v-text-field
            v-model="localMetric.parts_produced"
            label="生产零件总数"
            variant="outlined"
            class="mb-4"
            type="number"
            min="0"
            :rules="[v => v >= 0 || '生产零件数不能为负数']"
          ></v-text-field>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="d-flex flex-wrap">
            <v-card variant="outlined" class="mb-2 me-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">设备综合效率(OEE)</div>
              <div class="text-h6">{{ calculatedMetrics.oee }}%</div>
            </v-card>
            
            <v-card variant="outlined" class="mb-2 me-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">平均修复时间(MTTR)</div>
              <div class="text-h6">{{ calculatedMetrics.mttr }} 分钟</div>
            </v-card>
            
            <v-card variant="outlined" class="mb-2 me-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">平均故障间隔(MTBF)</div>
              <div class="text-h6">{{ calculatedMetrics.mtbf }} 分钟</div>
            </v-card>
            
            <v-card variant="outlined" class="mb-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">设备可动率</div>
              <div class="text-h6">{{ calculatedMetrics.availability }}%</div>
            </v-card>
          </div>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="$emit('close')">取消</v-btn>
        <v-btn 
          color="primary" 
          @click="saveMetric" 
          :loading="loading"
          :disabled="loading"
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
  metric: {
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

const emit = defineEmits(['update:modelValue', 'update:metric', 'save', 'close'])

const form = ref(null)

// 本地指标对象，用于双向绑定
const localMetric = computed({
  get: () => props.metric,
  set: (value) => emit('update:metric', value)
})

// 设备类型选项
const equipmentTypes = [
  'SWI-L',
  'SWI-R',
  'RWH-L',
  'RWH-R'
]

// 计算衍生指标
const calculatedMetrics = computed(() => {
  const downtime_count = Number(localMetric.value.downtime_count) || 0
  const downtime_minutes = Number(localMetric.value.downtime_minutes) || 0
  
  // 假设每天工作时间为24小时（1440分钟）
  const total_minutes = 1440
  
  // 计算设备可动率
  const availability = downtime_minutes > 0 
    ? ((total_minutes - downtime_minutes) / total_minutes * 100).toFixed(2)
    : '100.00'
  
  // 计算MTTR（平均修复时间）
  const mttr = downtime_count > 0
    ? (downtime_minutes / downtime_count).toFixed(2)
    : '0.00'
  
  // 计算MTBF（平均故障间隔时间）
  const mtbf = downtime_count > 0
    ? ((total_minutes - downtime_minutes) / downtime_count).toFixed(2)
    : total_minutes.toFixed(2)
  
  // 简化的OEE计算（可用性 × 性能 × 质量）
  // 这里我们假设性能和质量都是100%，只考虑可用性
  const oee = availability
  
  return {
    oee,
    mttr,
    mtbf,
    availability
  }
})

// 保存指标
const saveMetric = async () => {
  // 表单验证
  const isValid = await form.value?.validate()
  
  if (isValid?.valid) {
    emit('save')
  }
}

// 监听对话框打开，重置表单验证
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      form.value?.resetValidation()
    }, 50)
  }
})
</script> 