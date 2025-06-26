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
            v-model="localMetric.line"
            :items="lineTypes"
            label="线体"
            variant="outlined"
            class="mb-4"
            :rules="[v => !!v || '请选择线体']"
          ></v-select>
          
          <v-text-field
            v-model="localMetric.shift_date"
            label="日期"
            variant="outlined"
            class="mb-4"
            type="date"
            :rules="[v => !!v || '请选择日期']"
          ></v-text-field>
          
          <v-radio-group
            v-model="localMetric.shift_code"
            label="班次"
            class="mb-4"
            :rules="[v => !!v || '请选择班次']"
            inline
          >
            <v-radio :value="1" label="白班"></v-radio>
            <v-radio :value="2" label="夜班"></v-radio>
          </v-radio-group>
          
          <v-text-field
            v-model="localMetric.plan_down_time"
            label="计划停机时间(分钟)"
            variant="outlined"
            class="mb-4"
            type="number"
            min="0"
            :rules="[v => v >= 0 || '计划停机时间不能为负数']"
            @input="updateOEE"
            hint="每班总工作时间为720分钟"
            persistent-hint
          ></v-text-field>
          
          <v-text-field
            v-model="localMetric.out_plan_down_time"
            label="非计划停机时间(分钟)"
            variant="outlined"
            class="mb-4"
            type="number"
            min="0"
            :rules="[v => v >= 0 || '非计划停机时间不能为负数']"
            @input="updateOEE"
          ></v-text-field>
          
          <v-text-field
            v-model="localMetric.issue_count"
            label="问题数量"
            variant="outlined"
            class="mb-4"
            type="number"
            min="0"
            :rules="[v => v >= 0 || '问题数量不能为负数']"
            @input="updateMTTR"
          ></v-text-field>
          
          <v-text-field
            v-model="localMetric.amount"
            label="生产数量"
            variant="outlined"
            class="mb-4"
            type="number"
            min="0"
            :rules="[v => v >= 0 || '生产数量不能为负数']"
          ></v-text-field>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="d-flex flex-wrap">
            <v-card variant="outlined" class="mb-2 me-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">设备综合效率(OEE)</div>
              <div class="text-h6">{{ calculatedOEE }}%</div>
              <v-checkbox
                v-model="useCalculatedOEE"
                label="使用计算值"
                density="compact"
                hide-details
                @change="updateOEE"
              ></v-checkbox>
            </v-card>
            
            <v-card variant="outlined" class="mb-2 me-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">设备可动率</div>
              <div class="text-h6">{{ calculatedAvailability }}%</div>
              <v-checkbox
                v-model="useCalculatedAvailability"
                label="使用计算值"
                density="compact"
                hide-details
                @change="updateAvailability"
              ></v-checkbox>
            </v-card>
          </div>
          
          <div class="d-flex flex-wrap mt-2">
            <v-card variant="outlined" class="mb-2 me-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">MTTR (平均修复时间)</div>
              <div class="text-h6">{{ calculatedMTTR }}分钟</div>
              <v-checkbox
                v-model="useCalculatedMTTR"
                label="使用计算值"
                density="compact"
                hide-details
                @change="updateMTTR"
              ></v-checkbox>
            </v-card>
            
            <v-card variant="outlined" class="mb-2 me-2 pa-2 flex-grow-1">
              <div class="text-subtitle-2">MTBF (平均故障间隔时间)</div>
              <div class="text-h6">{{ calculatedMTBF }}分钟</div>
              <v-checkbox
                v-model="useCalculatedMTBF"
                label="使用计算值"
                density="compact"
                hide-details
                @change="updateMTBF"
              ></v-checkbox>
            </v-card>
          </div>

          <div class="mt-4">
            <v-alert
              type="info"
              density="compact"
              variant="tonal"
              border="start"
              icon="mdi-information-outline"
            >
              <strong>计算说明:</strong> 
              <div class="mt-1">总工作时间: 720分钟 (12小时/班)</div>
              <div>可用时间 = 总时间(720分钟) - 计划停机时间</div>
              <div>实际运行时间 = 可用时间 - 非计划停机时间</div>
              <div>OEE = 实际运行时间 / 总时间</div>
              <div>可动率 = 实际运行时间 / 可用时间</div>
              <div>MTTR = 非计划停机时间 / 问题数量</div>
              <div>MTBF = 实际运行时间 / 问题数量</div>
            </v-alert>
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
const useCalculatedOEE = ref(true)
const useCalculatedAvailability = ref(true)
const useCalculatedMTTR = ref(true)
const useCalculatedMTBF = ref(true)

// 每班总工作时间常量 (12小时 = 720分钟)
const TOTAL_WORK_MINUTES = 720

// 本地指标对象，用于双向绑定
const localMetric = computed({
  get: () => {
    // 确保必要的字段有默认值
    const metric = props.metric || {}
    return {
      ...metric,
      shift_code: metric.shift_code || 1, // 默认白班
      plan_down_time: metric.plan_down_time || 0,
      out_plan_down_time: metric.out_plan_down_time || 0,
      oee: metric.oee || 0,
      amount: metric.amount || 0,
      issue_count: metric.issue_count || 0,
      availability_rate: metric.availability_rate || 0,
      mttr: metric.mttr || 0,
      mtbf: metric.mtbf || 0
    }
  },
  set: (value) => emit('update:metric', value)
})

// 线体类型选项
const lineTypes = [
  'SWI-L',
  'SWI-R',
  'RWH-L',
  'RWH-R',
  'W01',
  'HF',
  'LC'
]

// 计算OEE
const calculatedOEE = computed(() => {
  const plan_down_time = Number(localMetric.value.plan_down_time) || 0
  const out_plan_down_time = Number(localMetric.value.out_plan_down_time) || 0
  
  // 使用常量表示每班工作时间为12小时（720分钟）
  const total_minutes = TOTAL_WORK_MINUTES
  
  // 计算可用时间 = 总时间 - 计划停机时间
  const available_time = total_minutes - plan_down_time
  if (available_time <= 0) return '0.00'
  
  // 计算实际运行时间 = 可用时间 - 非计划停机时间
  const actual_run_time = available_time - out_plan_down_time
  if (actual_run_time < 0) return '0.00'
  
  // OEE = 实际运行时间 / 总时间
  return ((actual_run_time / total_minutes) * 100).toFixed(2)
})

// 计算可动率
const calculatedAvailability = computed(() => {
  const plan_down_time = Number(localMetric.value.plan_down_time) || 0
  const out_plan_down_time = Number(localMetric.value.out_plan_down_time) || 0
  
  // 计算可用时间 = 总时间 - 计划停机时间
  const available_time = TOTAL_WORK_MINUTES - plan_down_time
  if (available_time <= 0) return '0.00'
  
  // 计算实际运行时间 = 可用时间 - 非计划停机时间
  const actual_run_time = available_time - out_plan_down_time
  if (actual_run_time < 0) return '0.00'
  
  // 可动率 = 实际运行时间 / 可用时间
  return ((actual_run_time / available_time) * 100).toFixed(2)
})

// 计算MTTR
const calculatedMTTR = computed(() => {
  const out_plan_down_time = Number(localMetric.value.out_plan_down_time) || 0
  const issue_count = Number(localMetric.value.issue_count) || 0
  
  if (issue_count <= 0) return '0.00'
  
  // MTTR = 非计划停机时间 / 问题数量
  return (out_plan_down_time / issue_count).toFixed(2)
})

// 计算MTBF
const calculatedMTBF = computed(() => {
  const plan_down_time = Number(localMetric.value.plan_down_time) || 0
  const out_plan_down_time = Number(localMetric.value.out_plan_down_time) || 0
  const issue_count = Number(localMetric.value.issue_count) || 0
  
  // 计算可用时间 = 总时间 - 计划停机时间
  const available_time = TOTAL_WORK_MINUTES - plan_down_time
  if (available_time <= 0) return '0.00'
  
  // 计算实际运行时间 = 可用时间 - 非计划停机时间
  const actual_run_time = available_time - out_plan_down_time
  if (actual_run_time < 0) return '0.00'
  
  if (issue_count <= 0) return actual_run_time.toFixed(2)
  
  // MTBF = 实际运行时间 / 问题数量
  return (actual_run_time / issue_count).toFixed(2)
})

// 更新OEE值
const updateOEE = () => {
  if (useCalculatedOEE.value) {
    localMetric.value.oee = parseFloat(calculatedOEE.value) / 100
  }
}

// 更新可动率值
const updateAvailability = () => {
  if (useCalculatedAvailability.value) {
    localMetric.value.availability_rate = parseFloat(calculatedAvailability.value) / 100
  }
}

// 更新MTTR和MTBF值
const updateMTTR = () => {
  if (useCalculatedMTTR.value) {
    localMetric.value.mttr = parseFloat(calculatedMTTR.value)
  }
  if (useCalculatedMTBF.value) {
    localMetric.value.mtbf = parseFloat(calculatedMTBF.value)
  }
}

// 监听计算的OEE变化，如果选择使用计算值，则自动更新
watch(calculatedOEE, (newVal) => {
  if (useCalculatedOEE.value) {
    localMetric.value.oee = parseFloat(newVal) / 100
  }
})

// 监听计算的可动率变化
watch(calculatedAvailability, (newVal) => {
  if (useCalculatedAvailability.value) {
    localMetric.value.availability_rate = parseFloat(newVal) / 100
  }
})

// 监听计算的MTTR变化
watch(calculatedMTTR, (newVal) => {
  if (useCalculatedMTTR.value) {
    localMetric.value.mttr = parseFloat(newVal)
  }
})

// 监听计算的MTBF变化
watch(calculatedMTBF, (newVal) => {
  if (useCalculatedMTBF.value) {
    localMetric.value.mtbf = parseFloat(newVal)
  }
})

// 保存指标
const saveMetric = async () => {
  // 表单验证
  const isValid = await form.value?.validate()
  
  if (isValid?.valid) {
    // 最后一次确保所有计算值正确
    if (useCalculatedOEE.value) {
      localMetric.value.oee = parseFloat(calculatedOEE.value) / 100
    }
    if (useCalculatedAvailability.value) {
      localMetric.value.availability_rate = parseFloat(calculatedAvailability.value) / 100
    }
    if (useCalculatedMTTR.value) {
      localMetric.value.mttr = parseFloat(calculatedMTTR.value)
    }
    if (useCalculatedMTBF.value) {
      localMetric.value.mtbf = parseFloat(calculatedMTBF.value)
    }
    
    // 确保使用shift_date作为后端期望的字段名
    localMetric.value.shift_date = localMetric.value.shift_date
    
    emit('save')
  }
}

// 监听对话框打开，重置表单验证
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      form.value?.resetValidation()
      
      // 对话框打开时自动更新所有计算值
      if (useCalculatedOEE.value) {
        updateOEE()
      }
      if (useCalculatedAvailability.value) {
        updateAvailability()
      }
      if (useCalculatedMTTR.value || useCalculatedMTBF.value) {
        updateMTTR()
      }
    }, 50)
  }
})
</script> 