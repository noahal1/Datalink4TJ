<template>
  <v-dialog
    v-model="dialog"
    max-width="900"
    persistent
  >
    <v-card v-if="pr">
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <span class="text-h6">请购单详情</span>
          <v-chip
            :color="getStatusColor(pr.status)"
            size="small"
            variant="flat"
            class="ml-3"
            :prepend-icon="getStatusIcon(pr.status)"
          >
            {{ pr.status?.name }}
          </v-chip>
          <v-chip
            color="info"
            size="small"
            variant="outlined"
            class="ml-2"
          >
            {{ pr.pr_number }}
          </v-chip>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <!-- 物料信息卡片 -->
        <v-card
          flat
          class="ma-4 mb-2"
          border
        >
          <v-card-title class="d-flex align-center pa-4 bg-blue-grey-lighten-5">
            <v-icon class="mr-2" color="blue-grey">mdi-package-variant</v-icon>
            <span class="text-subtitle-1 font-weight-medium">物料信息</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12">
                <div class="info-item-large">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-tag</v-icon>
                    物料名称
                  </div>
                  <div class="info-value-large">{{ pr.material_name || '-' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-barcode</v-icon>
                    物料编码
                  </div>
                  <div class="info-value">{{ pr.material_code || '-' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-counter</v-icon>
                    数量
                  </div>
                  <div class="info-value">{{ pr.quantity || 0 }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-star</v-icon>
                    品牌
                  </div>
                  <div class="info-value">{{ pr.brand || '-' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-ruler</v-icon>
                    规格
                  </div>
                  <div class="info-value">{{ pr.specification || '-' }}</div>
                </div>
              </v-col>
              <v-col v-if="pr.description" cols="12">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-text</v-icon>
                    详细描述
                  </div>
                  <div class="info-value">{{ pr.description }}</div>
                </div>
              </v-col>
              <v-col v-if="pr.remarks" cols="12">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-note-text</v-icon>
                    备注
                  </div>
                  <div class="info-value">{{ pr.remarks }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 时间信息卡片 -->
        <v-card
          flat
          class="ma-4 mb-2"
          border
        >
          <v-card-title class="d-flex align-center pa-4 bg-green-lighten-5">
            <v-icon class="mr-2" color="green">mdi-clock-outline</v-icon>
            <span class="text-subtitle-1 font-weight-medium">时间信息</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-calendar-plus</v-icon>
                    申请时间
                  </div>
                  <div class="info-value">{{ formatDateTime(pr.requested_date) }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1">mdi-calendar-clock</v-icon>
                    需求时间
                  </div>
                  <div class="info-value">{{ formatDate(pr.required_date) || '-' }}</div>
                </div>
              </v-col>
              <v-col v-if="pr.approved_date" cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1" color="success">mdi-check-circle</v-icon>
                    批准时间
                  </div>
                  <div class="info-value text-success">{{ formatDateTime(pr.approved_date) }}</div>
                </div>
              </v-col>
              <v-col v-if="pr.delivery_date" cols="12" md="6">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon size="small" class="mr-1" color="orange">mdi-truck-delivery</v-icon>
                    到货时间
                  </div>
                  <div class="info-value text-orange">{{ formatDateTime(pr.delivery_date) }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 进度时间轴卡片 -->
        <v-card
          flat
          class="ma-4 mb-2"
          border
        >
          <v-card-title class="d-flex align-center pa-4 bg-purple-lighten-5">
            <v-icon class="mr-2" color="purple">mdi-timeline</v-icon>
            <span class="text-subtitle-1 font-weight-medium">进度时间轴</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-timeline
              density="compact"
              side="end"
              align="start"
            >
              <!-- 申请时间 -->
              <v-timeline-item
                dot-color="primary"
                size="small"
                icon="mdi-file-document-plus"
              >
                <template #opposite>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDateTime(pr.requested_date) }}
                  </span>
                </template>
                <div>
                  <div class="text-subtitle-2">申请提交</div>
                  <div class="text-caption text-medium-emphasis">
                    由 {{ pr.requester?.name }} 提交申请
                  </div>
                </div>
              </v-timeline-item>

              <!-- 批准时间 -->
              <v-timeline-item
                v-if="pr.approved_date"
                dot-color="success"
                size="small"
                icon="mdi-check-circle"
              >
                <template #opposite>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDateTime(pr.approved_date) }}
                  </span>
                </template>
                <div>
                  <div class="text-subtitle-2">申请批准</div>
                  <div class="text-caption text-medium-emphasis">
                    申请已通过审批
                  </div>
                </div>
              </v-timeline-item>

              <!-- 到货时间 -->
              <v-timeline-item
                v-if="pr.delivery_date"
                dot-color="orange"
                size="small"
                icon="mdi-truck-delivery"
              >
                <template #opposite>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDateTime(pr.delivery_date) }}
                  </span>
                </template>
                <div>
                  <div class="text-subtitle-2">物品到货</div>
                  <div class="text-caption text-medium-emphasis">
                    物品已送达指定地点
                  </div>
                </div>
              </v-timeline-item>

              <!-- 当前状态 -->
              <v-timeline-item
                :dot-color="getStatusColor(pr.status)"
                size="small"
                :icon="getStatusIcon(pr.status)"
              >
                <template #opposite>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDateTime(pr.updated_at) }}
                  </span>
                </template>
                <div>
                  <div class="text-subtitle-2">当前状态</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ pr.status?.name }}
                  </div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>

        <!-- 状态更改卡片 -->
        <v-card
          v-if="canChangeStatus"
          flat
          class="ma-4 mb-2"
          border
        >
          <v-card-title class="d-flex align-center pa-4 bg-orange-lighten-5">
            <v-icon class="mr-2" color="orange">mdi-swap-horizontal</v-icon>
            <span class="text-subtitle-1 font-weight-medium">状态更改</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="newStatusId"
                  :items="statusOptions"
                  item-title="name"
                  item-value="id"
                  label="新状态"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-flag"
                >
                  <template #item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :prepend-icon="getStatusIcon(item.raw)"
                    >
                      <template #prepend>
                        <v-icon :color="getStatusColor(item.raw)">
                          {{ getStatusIcon(item.raw) }}
                        </v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="statusComments"
                  label="变更备注"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-comment-text"
                />
              </v-col>
              <v-col cols="12" class="d-flex justify-end">
                <v-btn
                  color="primary"
                  :disabled="!newStatusId || newStatusId === pr.status_id"
                  :loading="changingStatus"
                  prepend-icon="mdi-check"
                  @click="changeStatus"
                >
                  更改状态
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
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
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  modelValue: Boolean,
  pr: Object,
  statusOptions: Array
})

// Emits
const emit = defineEmits(['update:modelValue', 'status-change', 'close'])

// 响应式数据
const newStatusId = ref(null)
const statusComments = ref('')
const changingStatus = ref(false)



// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canChangeStatus = computed(() => {
  // 所有用户都可以更改状态
  return true
})

// 方法
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatCurrency = (amount) => {
  if (!amount) return '-'
  return '¥' + amount.toLocaleString()
}

const formatPrice = (price) => {
  if (!price) return '-'
  return '¥' + price.toFixed(2)
}

const getStatusColor = (status) => {
  if (!status?.color) return 'grey'
  return status.color
}

const getStatusIcon = (status) => {
  if (!status) return 'mdi-help-circle'
  const statusName = status.name?.toLowerCase()
  switch (statusName) {
    case '待提交':
      return 'mdi-file-document-outline'
    case '待审批':
    case '审批中':
      return 'mdi-clock-outline'
    case '已批准':
    case '已审批':
      return 'mdi-check-circle'
    case '已下单':
    case '采购中':
      return 'mdi-cart'
    case '已到货':
      return 'mdi-truck-delivery'
    case '已完成':
      return 'mdi-check-all'
    case '已拒绝':
      return 'mdi-close-circle'
    default:
      return 'mdi-help-circle'
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const changeStatus = async () => {
  if (!newStatusId.value) return
  
  changingStatus.value = true
  try {
    await emit('status-change', {
      status_id: newStatusId.value,
      comments: statusComments.value
    })
    
    // 重置表单
    newStatusId.value = null
    statusComments.value = ''
  } finally {
    changingStatus.value = false
  }
}

const close = () => {
  // 重置表单
  newStatusId.value = null
  statusComments.value = ''
  emit('close')
}
</script>

<style scoped>
/* 信息项样式 */
.info-item {
  margin-bottom: 16px;
}

.info-item-large {
  margin-bottom: 20px;
}

.info-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #424242;
  margin-bottom: 4px;
}

.info-label .v-icon {
  color: #616161 !important;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: #212121;
  line-height: 1.4;
  word-break: break-word;
}

.info-value-large {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  line-height: 1.4;
  word-break: break-word;
}

/* 卡片标题样式 */
.v-card-title {
  border-radius: 8px 8px 0 0;
}

/* 时间轴样式优化 */
.v-timeline {
  padding-left: 0;
}

.v-timeline-item {
  margin-bottom: 8px;
}

/* 状态选择器样式 */
.v-select .v-field__prepend-inner {
  padding-top: 8px;
}

/* 按钮样式 */
.v-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
}

/* 悬停效果 */
.v-card[border]:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}
</style>
