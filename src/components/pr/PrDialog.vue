<template>
  <v-dialog
    v-model="dialog"
    max-width="800"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ isNew ? '新建PR' : '编辑PR' }}</span>
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

            <v-col cols="12">
              <v-text-field
                v-model="localPr.title"
                label="PR标题"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="localPr.pr_type_id"
                :items="typeOptions"
                item-title="name"
                item-value="id"
                label="PR类型"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="localPr.priority_id"
                :items="priorityOptions"
                item-title="name"
                item-value="id"
                label="优先级"
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
                v-model="localPr.required_date"
                label="需求日期"
                type="date"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model.number="localPr.estimated_cost"
                label="预估成本"
                type="number"
                min="0"
                step="0.01"
                prefix="¥"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="localPr.supplier"
                label="供应商"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="localPr.description"
                label="详细描述"
                rows="3"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <!-- PR明细 -->
            <v-col cols="12">
              <div class="d-flex justify-space-between align-center mb-3">
                <h4 class="text-subtitle-1">
                  PR明细
                </h4>
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="addItem"
                >
                  添加明细
                </v-btn>
              </div>
            </v-col>

            <v-col
              v-if="localPr.items && localPr.items.length > 0"
              cols="12"
            >
              <v-card variant="outlined">
                <v-card-text class="pa-0">
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>物品名称</th>
                        <th>规格</th>
                        <th>数量</th>
                        <th>单位</th>
                        <th>单价</th>
                        <th>总价</th>
                        <th width="80">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in localPr.items"
                        :key="index"
                      >
                        <td>
                          <v-text-field
                            v-model="item.item_name"
                            density="compact"
                            variant="plain"
                            hide-details
                            :rules="[rules.required]"
                          />
                        </td>
                        <td>
                          <v-text-field
                            v-model="item.specification"
                            density="compact"
                            variant="plain"
                            hide-details
                          />
                        </td>
                        <td>
                          <v-text-field
                            v-model.number="item.quantity"
                            type="number"
                            min="0"
                            step="0.01"
                            density="compact"
                            variant="plain"
                            hide-details
                            :rules="[rules.required, rules.positive]"
                            @input="calculateTotal(item)"
                          />
                        </td>
                        <td>
                          <v-text-field
                            v-model="item.unit"
                            density="compact"
                            variant="plain"
                            hide-details
                          />
                        </td>
                        <td>
                          <v-text-field
                            v-model.number="item.unit_price"
                            type="number"
                            min="0"
                            step="0.01"
                            density="compact"
                            variant="plain"
                            hide-details
                            @input="calculateTotal(item)"
                          />
                        </td>
                        <td>
                          <span class="text-body-2">
                            {{ formatPrice(item.total_price) }}
                          </span>
                        </td>
                        <td>
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click="removeItem(index)"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col
              v-else
              cols="12"
            >
              <v-alert
                type="info"
                variant="outlined"
                text="暂无明细项目，请点击【添加明细】按钮添加。"
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
  pr: Object,
  isNew: Boolean,
  loading: Boolean,
  statusOptions: Array,
  typeOptions: Array,
  priorityOptions: Array
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:pr', 'save', 'close'])

// 响应式数据
const form = ref(null)
const formRef = ref(null)
const valid = ref(false)
const localPr = ref({})

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 验证规则
const rules = {
  required: value => !!value || '此字段为必填项',
  positive: value => value > 0 || '数值必须大于0'
}

// 方法
const addItem = () => {
  if (!localPr.value.items) {
    localPr.value.items = []
  }
  
  localPr.value.items.push({
    item_name: '',
    item_code: '',
    specification: '',
    unit: '',
    quantity: 1,
    unit_price: null,
    total_price: null,
    remarks: ''
  })
}

const removeItem = (index) => {
  localPr.value.items.splice(index, 1)
}

const calculateTotal = (item) => {
  if (item.quantity && item.unit_price) {
    item.total_price = item.quantity * item.unit_price
  } else {
    item.total_price = null
  }
}

const formatPrice = (price) => {
  if (!price) return '-'
  return '¥' + price.toFixed(2)
}

const save = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  // 确保至少有一个明细项目
  if (!localPr.value.items || localPr.value.items.length === 0) {
    alert('请至少添加一个明细项目')
    return
  }

  // 验证明细项目
  const hasInvalidItem = localPr.value.items.some(item => 
    !item.item_name || !item.quantity || item.quantity <= 0
  )
  
  if (hasInvalidItem) {
    alert('请完善明细项目信息')
    return
  }

  emit('save', localPr.value)
}

const close = () => {
  emit('close')
}

// 监听props变化
watch(() => props.pr, (newPr) => {
  if (newPr) {
    localPr.value = {
      ...newPr,
      items: newPr.items ? [...newPr.items] : []
    }
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
.v-table th {
  font-weight: 600;
  background-color: rgb(var(--v-theme-surface-variant));
}
</style>
