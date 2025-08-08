<template>
  <v-dialog
    v-model="dialog"
    max-width="800"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ isNew ? '新建请购单' : '编辑请购单' }}</span>
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


            <!-- PR类型字段已删除，不再需要 -->
            <!-- <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="localPr.pr_type_id"
                :items="typeOptions"
                item-title="name"
                item-value="id"
                label="请购类型"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
              />
            </v-col> -->


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
                v-model="localPr.approved_date"
                label="批准时间"
                type="datetime-local"
                variant="outlined"
                density="compact"
                readonly
                hint="状态变更为已批准时自动记录"
                persistent-hint
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localPr.delivery_date"
                label="到货时间"
                type="datetime-local"
                variant="outlined"
                density="compact"
                hint="状态变更为已到货时自动记录，也可手动修改"
                persistent-hint
              />
            </v-col>

            <!-- 物品信息 -->
            <v-col cols="12">
              <h4 class="text-subtitle-1 mb-3">
                物品信息
              </h4>
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localPr.material_name"
                label="物品名称"
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
                v-model="localPr.brand"
                label="品牌"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <!-- 单位字段已删除 -->
            <!-- <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localPr.unit"
                label="单位"
                placeholder="如：台、个、套、米等"
                variant="outlined"
                density="compact"
              />
            </v-col> -->

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="localPr.material_code"
                label="物料编码"
                placeholder="请手动输入物料编码"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="localPr.specification"
                label="规格说明"
                rows="2"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model.number="localPr.quantity"
                label="数量"
                type="number"
                min="0"
                step="0.01"
                :rules="[rules.required, rules.positive]"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <!-- 备注信息 -->
            <v-col cols="12">
              <h4 class="text-subtitle-1 mb-3">
                备注信息
              </h4>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="localPr.remarks"
                label="备注"
                rows="2"
                variant="outlined"
                density="compact"
                placeholder="可填写特殊要求、紧急程度等说明"
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
// import api from '../../utils/api'  // 暂时注释，改为手动填写模式

// Props
const props = defineProps({
  modelValue: Boolean,
  pr: Object,
  isNew: Boolean,
  loading: Boolean,
  statusOptions: Array,
  // typeOptions: Array  // 已删除
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:pr', 'save', 'close'])

// 响应式数据
const form = ref(null)
const formRef = ref(null)
const valid = ref(false)
const localPr = ref({})
// 移除物料自动匹配相关的响应式数据
// const materialOptions = ref([])
// const loadingMaterials = ref(false)
// const useCustomMaterial = ref(false)

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

// 移除物料自动匹配相关的方法
// const searchMaterials = async (search) => {
//   if (!search || search.length < 2) {
//     materialOptions.value = []
//     return
//   }
  
//   try {
//     loadingMaterials.value = true
//     const response = await api.get('/materials/', {
//       params: { search, limit: 20, is_active: true }
//     })
    
//     // 格式化选项
//     materialOptions.value = response.data.items.map(material => ({
//       title: `${material.material_code} - ${material.material_name}`,
//       value: material.material_code,
//       material_name: material.material_name,
//       material_code: material.material_code,
//       specification: material.specification,
//       brand: material.brand,
//       unit: material.unit
//     }))
//   } catch (error) {
//     console.error('搜索物料失败:', error)
//     materialOptions.value = []
//   } finally {
//     loadingMaterials.value = false
//   }
// }

// const onMaterialSelect = (materialCode) => {
//   if (!materialCode) {
//     useCustomMaterial.value = false
//     return
//   }
  
//   // 检查是否为自定义输入（不在选项列表中）
//   const selectedMaterial = materialOptions.value.find(m => m.material_code === materialCode)
//   if (selectedMaterial) {
//     // 从数据库选择的物料
//     useCustomMaterial.value = false
//     localPr.value.material_name = selectedMaterial.material_name
//     localPr.value.specification = selectedMaterial.specification
//     localPr.value.brand = selectedMaterial.brand
//   } else {
//     // 自定义物料编码
//     useCustomMaterial.value = true
//     // 保留当前填写的信息，不自动清空
//   }
// }


const save = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  emit('save', localPr.value)
}

const close = () => {
  emit('close')
}

// 监听props变化
watch(() => props.pr, (newPr) => {
  if (newPr) {
    localPr.value = { ...newPr }
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
