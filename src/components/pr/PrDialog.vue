<template>
  <v-dialog
    v-model="dialog"
    max-width="900"
    persistent
    scrollable
  >
    <v-card class="pr-dialog-card">
      <!-- 标题栏 -->
      <v-card-title class="d-flex justify-space-between align-center pa-4 bg-primary">
        <div class="d-flex align-center">
          <v-icon
            :icon="isNew ? 'mdi-plus-circle' : 'mdi-pencil-circle'"
            class="mr-2"
            color="white"
          />
          <span class="text-h6 text-white">{{ isNew ? '新建采购申请' : '编辑采购申请' }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="close"
        />
      </v-card-title>

      <!-- 进度指示器 (仅新建模式) -->
      <v-card-subtitle v-if="isNew" class="pa-3 bg-grey-lighten-5">
        <div class="d-flex justify-center">
          <v-chip-group v-model="currentStep" mandatory>
            <v-chip
              :value="1"
              :color="currentStep >= 1 ? 'primary' : 'grey'"
              :variant="currentStep === 1 ? 'flat' : 'outlined'"
              class="mx-2"
            >
              <v-icon start icon="mdi-information" />
              基本信息
            </v-chip>
            <v-chip
              :value="2"
              :color="currentStep >= 2 ? 'primary' : 'grey'"
              :variant="currentStep === 2 ? 'flat' : 'outlined'"
              class="mx-2"
            >
              <v-icon start icon="mdi-package-variant" />
              物品详情
            </v-chip>
            <v-chip
              :value="3"
              :color="currentStep >= 3 ? 'primary' : 'grey'"
              :variant="currentStep === 3 ? 'flat' : 'outlined'"
              class="mx-2"
            >
              <v-icon start icon="mdi-check-circle" />
              确认提交
            </v-chip>
          </v-chip-group>
        </div>
      </v-card-subtitle>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="valid"
        >
          <!-- 新建模式：步骤式表单 -->
          <div v-if="isNew">
            <!-- 第一步：基本信息 -->
            <div v-show="currentStep === 1">
              <div class="text-h6 mb-4 d-flex align-center">
                <v-icon icon="mdi-information" class="mr-2" color="primary" />
                基本信息
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localPr.required_date"
                    label="需求日期"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar"
                    hint="请选择您希望收到物品的日期"
                    persistent-hint
                    :min="minDate"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="localPr.description"
                    label="申请说明"
                    rows="3"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-text"
                    placeholder="请简要说明申请原因、用途等..."
                    counter="500"
                    :rules="[rules.maxLength(500)]"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- 第二步：物品信息 -->
            <div v-show="currentStep === 2">
              <div class="text-h6 mb-4 d-flex align-center">
                <v-icon icon="mdi-package-variant" class="mr-2" color="primary" />
                物品详情
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localPr.material_name"
                    label="物品名称"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-package"
                    placeholder="请输入物品名称"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localPr.brand"
                    label="品牌"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-tag"
                    placeholder="请输入品牌名称"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="localPr.material_code"
                    label="物料编码"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-barcode"
                    placeholder="请输入物料编码（可选）"
                    clearable
                    hint="如果知道物料编码，请填写以便快速识别"
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="localPr.quantity"
                    label="数量"
                    type="number"
                    min="0"
                    step="0.01"
                    :rules="[rules.required, rules.positive]"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-counter"
                    placeholder="请输入数量"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="localPr.specification"
                    label="规格说明"
                    rows="3"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-format-list-bulleted"
                    placeholder="请详细描述物品的规格、型号、技术参数等..."
                    counter="1000"
                    :rules="[rules.maxLength(1000)]"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- 第三步：确认信息 -->
            <div v-show="currentStep === 3">
              <div class="text-h6 mb-4 d-flex align-center">
                <v-icon icon="mdi-check-circle" class="mr-2" color="primary" />
                确认信息
              </div>

              <!-- 信息预览卡片 -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1 bg-grey-lighten-4">
                  <v-icon icon="mdi-eye" class="mr-2" />
                  申请信息预览
                </v-card-title>
                <v-card-text class="pa-4">
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-grey">物品名称</div>
                      <div class="text-body-1 font-weight-medium">{{ localPr.material_name || '未填写' }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-grey">数量</div>
                      <div class="text-body-1 font-weight-medium">{{ localPr.quantity || '未填写' }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-grey">品牌</div>
                      <div class="text-body-1">{{ localPr.brand || '未填写' }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-grey">需求日期</div>
                      <div class="text-body-1">{{ formatDate(localPr.required_date) || '未填写' }}</div>
                    </v-col>
                    <v-col cols="12" v-if="localPr.material_code">
                      <div class="text-caption text-grey">物料编码</div>
                      <div class="text-body-1">{{ localPr.material_code }}</div>
                    </v-col>
                    <v-col cols="12" v-if="localPr.specification">
                      <div class="text-caption text-grey">规格说明</div>
                      <div class="text-body-1">{{ localPr.specification }}</div>
                    </v-col>
                    <v-col cols="12" v-if="localPr.description">
                      <div class="text-caption text-grey">申请说明</div>
                      <div class="text-body-1">{{ localPr.description }}</div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- 备注信息 -->
              <v-textarea
                v-model="localPr.remarks"
                label="备注信息"
                rows="3"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-note-text"
                placeholder="可填写特殊要求、紧急程度等说明..."
                counter="500"
                :rules="[rules.maxLength(500)]"
              />
            </div>
          </div>

          <!-- 编辑模式：简化表单 -->
          <div v-else>
            <v-row>
              <!-- 基本信息 -->
              <v-col cols="12">
                <div class="text-h6 mb-4 d-flex align-center">
                  <v-icon icon="mdi-information" class="mr-2" color="primary" />
                  基本信息
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.required_date"
                  label="需求日期"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                  :readonly="!canEditBasicInfo"
                  :hint="canEditBasicInfo ? '请选择您希望收到物品的日期' : '当前状态下不可编辑'"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.approved_date"
                  label="批准时间"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable"
                  readonly
                  hint="状态变更为已批准时自动记录"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.delivery_date"
                  label="到货时间"
                  type="datetime-local"
                  variant="outlined"
                  density="comfortable"
                  :readonly="!canEditDeliveryDate"
                  :hint="canEditDeliveryDate ? '可手动修改到货时间' : '状态变更为已到货时自动记录'"
                  persistent-hint
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="localPr.description"
                  label="申请说明"
                  rows="2"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-text"
                  :readonly="!canEditBasicInfo"
                  :placeholder="canEditBasicInfo ? '请简要说明申请原因、用途等...' : '当前状态下不可编辑'"
                />
              </v-col>

              <!-- 物品信息 -->
              <v-col cols="12">
                <div class="text-h6 mb-4 d-flex align-center">
                  <v-icon icon="mdi-package-variant" class="mr-2" color="primary" />
                  物品信息
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.material_name"
                  label="物品名称"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-package"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入物品名称' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.brand"
                  label="品牌"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-tag"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入品牌名称' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="localPr.material_code"
                  label="物料编码"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-barcode"
                  :readonly="!canEditMaterialInfo"
                  :clearable="canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入物料编码（可选）' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="localPr.quantity"
                  label="数量"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="[rules.required, rules.positive]"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-counter"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请输入数量' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="localPr.specification"
                  label="规格说明"
                  rows="3"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-format-list-bulleted"
                  :readonly="!canEditMaterialInfo"
                  :placeholder="canEditMaterialInfo ? '请详细描述物品的规格、型号、技术参数等...' : '当前状态下不可编辑'"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="localPr.remarks"
                  label="备注"
                  rows="2"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-note-text"
                  :placeholder="canEditRemarks ? '可填写特殊要求、紧急程度等说明' : '当前状态下不可编辑'"
                  :readonly="!canEditRemarks"
                />
              </v-col>
            </v-row>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- 操作按钮 -->
      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer />

        <!-- 新建模式的步骤导航按钮 -->
        <template v-if="isNew">
          <v-btn
            variant="outlined"
            @click="close"
          >
            <v-icon icon="mdi-close" class="mr-1" />
            取消
          </v-btn>

          <v-btn
            v-if="currentStep > 1"
            variant="outlined"
            color="primary"
            @click="previousStep"
            class="ml-2"
          >
            <v-icon icon="mdi-chevron-left" class="mr-1" />
            上一步
          </v-btn>

          <v-btn
            v-if="currentStep < 3"
            color="primary"
            :disabled="!canProceedToNextStep"
            @click="nextStep"
            class="ml-2"
          >
            下一步
            <v-icon icon="mdi-chevron-right" class="ml-1" />
          </v-btn>

          <v-btn
            v-if="currentStep === 3"
            color="success"
            :loading="loading"
            :disabled="!valid"
            @click="save"
            class="ml-2"
          >
            <v-icon icon="mdi-check" class="mr-1" />
            提交申请
          </v-btn>
        </template>

        <!-- 编辑模式的简单按钮 -->
        <template v-else>
          <v-btn
            variant="outlined"
            @click="close"
          >
            <v-icon icon="mdi-close" class="mr-1" />
            取消
          </v-btn>

          <v-btn
            v-if="hasEditableFields"
            color="primary"
            :loading="loading"
            :disabled="!valid"
            @click="save"
            class="ml-2"
          >
            <v-icon icon="mdi-content-save" class="mr-1" />
            保存更改
          </v-btn>

          <v-btn
            v-else
            color="grey"
            disabled
            class="ml-2"
          >
            <v-icon icon="mdi-lock" class="mr-1" />
            当前状态不可编辑
          </v-btn>
        </template>
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
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:pr', 'save', 'close'])

// 响应式数据
const formRef = ref(null)
const valid = ref(false)
const localPr = ref({})
const currentStep = ref(1)

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 获取今天的日期作为最小日期
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// 根据状态判断字段是否可编辑
const canEditBasicInfo = computed(() => {
  if (props.isNew) return true
  const statusName = localPr.value.status?.name
  // 在"待提交"和"审批中"状态下可以编辑基本信息
  return ['待提交', '审批中'].includes(statusName)
})

const canEditMaterialInfo = computed(() => {
  if (props.isNew) return true
  const statusName = localPr.value.status?.name
  // 在"待提交"状态下可以编辑物品信息
  return ['待提交'].includes(statusName)
})

const canEditDeliveryDate = computed(() => {
  if (props.isNew) return false
  const statusName = localPr.value.status?.name
  // 在"采购中"和"已到货"状态下可以编辑到货时间
  return ['采购中', '已到货'].includes(statusName)
})

// 备注在大部分状态下都可以编辑
const canEditRemarks = computed(() => {
  if (props.isNew) return true
  const statusName = localPr.value.status?.name
  // 除了"已取消"和"已拒绝"状态，其他状态都可以编辑备注
  return !['已取消', '已拒绝'].includes(statusName)
})

// 判断是否有任何字段可以编辑
const hasEditableFields = computed(() => {
  if (props.isNew) return true
  return canEditBasicInfo.value || canEditMaterialInfo.value || canEditDeliveryDate.value || canEditRemarks.value
})

// 检查是否可以进入下一步
const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 1:
      // 第一步：需求日期不是必填，但如果填了要验证格式
      return true
    case 2:
      // 第二步：物品名称和数量必填
      return localPr.value.material_name &&
             localPr.value.quantity &&
             localPr.value.quantity > 0
    default:
      return true
  }
})

// 验证规则
const rules = {
  required: value => !!value || '此字段为必填项',
  positive: value => value > 0 || '数值必须大于0',
  maxLength: (max) => value => !value || value.length <= max || `最多${max}个字符`
}

// 步骤导航方法
const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// 格式化日期显示
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取状态图标
const getStatusIcon = (status) => {
  if (!status) return 'mdi-help-circle'
  const statusName = status.name?.toLowerCase()
  switch (statusName) {
    case '待提交':
      return 'mdi-file-document-outline'
    case '审批中':
      return 'mdi-clock-outline'
    case '已批准':
      return 'mdi-check-circle'
    case '采购中':
      return 'mdi-cart'
    case '已到货':
      return 'mdi-truck-delivery'
    case '已取消':
    case '已拒绝':
      return 'mdi-close-circle'
    default:
      return 'mdi-help-circle'
  }
}

// 获取状态颜色
const getStatusColor = (status) => {
  if (!status) return 'grey'
  const statusName = status.name?.toLowerCase()
  switch (statusName) {
    case '待提交':
      return 'orange'
    case '审批中':
      return 'blue'
    case '已批准':
      return 'green'
    case '采购中':
      return 'purple'
    case '已到货':
      return 'cyan'
    case '已取消':
    case '已拒绝':
      return 'red'
    default:
      return 'grey'
  }
}

// 获取编辑权限提示
const getEditPermissionHint = (statusName) => {
  switch (statusName) {
    case '待提交':
      return '可编辑所有信息'
    case '审批中':
      return '可编辑基本信息和备注，物品信息已锁定'
    case '已批准':
      return '基本信息和物品信息已锁定，可编辑备注'
    case '采购中':
      return '可编辑到货时间和备注，其他信息已锁定'
    case '已到货':
      return '可编辑到货时间和备注，其他信息已锁定'
    case '已取消':
    case '已拒绝':
      return '所有信息已锁定，仅可查看'
    default:
      return '编辑权限受限，请联系管理员'
  }
}


// 保存方法
const save = async () => {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  emit('save', localPr.value)
}

// 关闭方法
const close = () => {
  // 重置步骤
  currentStep.value = 1
  emit('close')
}

// 监听props变化
watch(() => props.pr, (newPr) => {
  if (newPr) {
    localPr.value = { ...newPr }
  }
}, { immediate: true, deep: true })

// 监听dialog变化，重置表单和步骤
watch(dialog, (newVal) => {
  if (newVal) {
    // 重置步骤到第一步
    currentStep.value = 1
    // 重置表单验证
    if (formRef.value) {
      formRef.value.resetValidation()
    }
  }
})
</script>

<style scoped>
.pr-dialog-card {
  border-radius: 12px;
  overflow: hidden;
}

.v-stepper {
  box-shadow: none !important;
}

.v-stepper-header {
  box-shadow: none !important;
  padding: 0 16px;
}

.v-stepper-item {
  padding: 8px 0;
}

.v-stepper-item__title {
  font-size: 0.875rem;
  font-weight: 500;
}

.v-stepper-window {
  margin: 0;
}

.v-card-title {
  border-radius: 0;
}

.v-alert {
  border-radius: 8px;
}

/* 自定义步骤指示器颜色 */
.v-stepper-item--complete .v-stepper-item__icon {
  background-color: rgb(var(--v-theme-success)) !important;
}

.v-stepper-item--selected .v-stepper-item__icon {
  background-color: rgb(var(--v-theme-primary)) !important;
}

/* 表单字段间距优化 */
.v-text-field, .v-textarea {
  margin-bottom: 8px;
}

/* 预览卡片样式 */
.v-card-title {
  font-size: 1rem;
  font-weight: 500;
}

/* 响应式优化 */
@media (max-width: 600px) {
  .pr-dialog-card {
    margin: 8px;
    max-width: calc(100vw - 16px) !important;
  }

  .v-stepper-header {
    padding: 0 8px;
  }

  .v-stepper-item__title {
    font-size: 0.75rem;
  }
}
</style>
