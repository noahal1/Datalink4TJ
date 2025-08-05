<template>
  <v-dialog
    v-model="dialog"
    max-width="900"
    persistent
  >
    <v-card v-if="pr">
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <span>PR详情</span>
          <v-chip
            :color="getStatusColor(pr.status)"
            size="small"
            variant="flat"
            class="ml-2"
          >
            {{ pr.status?.name }}
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
              :model-value="pr.pr_number"
              label="PR编号"
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
              :model-value="pr.title"
              label="PR标题"
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
              :model-value="pr.pr_type?.name"
              label="PR类型"
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
              :model-value="pr.priority?.name"
              label="优先级"
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
              :model-value="pr.requester?.name"
              label="申请人"
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
              :model-value="formatDate(pr.requested_date)"
              label="申请日期"
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
              :model-value="formatDate(pr.required_date)"
              label="需求日期"
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
              :model-value="formatCurrency(pr.estimated_cost)"
              label="预估成本"
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
              :model-value="pr.supplier || '-'"
              label="供应商"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.description"
            cols="12"
          >
            <v-textarea
              :model-value="pr.description"
              label="详细描述"
              readonly
              variant="outlined"
              density="compact"
              rows="3"
            />
          </v-col>

          <!-- 审批信息 -->
          <v-col
            v-if="pr.approver || pr.approved_date"
            cols="12"
          >
            <h4 class="text-subtitle-1 mb-3">
              审批信息
            </h4>
          </v-col>

          <v-col
            v-if="pr.approver"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="pr.approver?.name"
              label="审批人"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.approved_date"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="formatDate(pr.approved_date)"
              label="审批日期"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.approval_comments"
            cols="12"
          >
            <v-textarea
              :model-value="pr.approval_comments"
              label="审批意见"
              readonly
              variant="outlined"
              density="compact"
              rows="2"
            />
          </v-col>

          <!-- 采购信息 -->
          <v-col
            v-if="pr.purchaser || pr.po_number || pr.ordered_date"
            cols="12"
          >
            <h4 class="text-subtitle-1 mb-3">
              采购信息
            </h4>
          </v-col>

          <v-col
            v-if="pr.purchaser"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="pr.purchaser?.name"
              label="采购员"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.po_number"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="pr.po_number"
              label="采购订单号"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.ordered_date"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="formatDate(pr.ordered_date)"
              label="下单日期"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.expected_delivery_date"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="formatDate(pr.expected_delivery_date)"
              label="预计到货日期"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.actual_delivery_date"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="formatDate(pr.actual_delivery_date)"
              label="实际到货日期"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col
            v-if="pr.actual_cost"
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="formatCurrency(pr.actual_cost)"
              label="实际成本"
              readonly
              variant="outlined"
              density="compact"
            />
          </v-col>

          <!-- PR明细 -->
          <v-col cols="12">
            <h4 class="text-subtitle-1 mb-3">
              PR明细
            </h4>
          </v-col>

          <v-col
            v-if="pr.items && pr.items.length > 0"
            cols="12"
          >
            <v-card variant="outlined">
              <v-card-text class="pa-0">
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>物品名称</th>
                      <th>物品编码</th>
                      <th>规格</th>
                      <th>数量</th>
                      <th>单位</th>
                      <th>单价</th>
                      <th>总价</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in pr.items"
                      :key="item.id"
                    >
                      <td>{{ item.item_name }}</td>
                      <td>{{ item.item_code || '-' }}</td>
                      <td>{{ item.specification || '-' }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ item.unit || '-' }}</td>
                      <td>{{ formatPrice(item.unit_price) }}</td>
                      <td>{{ formatPrice(item.total_price) }}</td>
                      <td>{{ item.remarks || '-' }}</td>
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
              text="暂无明细项目"
            />
          </v-col>

          <!-- 状态更改 -->
          <v-col
            v-if="canChangeStatus"
            cols="12"
          >
            <v-divider class="my-4" />
            <h4 class="text-subtitle-1 mb-3">
              状态更改
            </h4>
            
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="newStatusId"
                  :items="statusOptions"
                  item-title="name"
                  item-value="id"
                  label="新状态"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="statusComments"
                  label="变更备注"
                  rows="2"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-btn
                  color="primary"
                  :disabled="!newStatusId || newStatusId === pr.status_id"
                  :loading="changingStatus"
                  @click="changeStatus"
                >
                  更改状态
                </v-btn>
              </v-col>
            </v-row>
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
import { ref, computed } from 'vue'
import { useUserStore } from '../../stores/user.js'

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

// 用户store
const userStore = useUserStore()

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canChangeStatus = computed(() => {
  // 只有管理员或相关人员可以更改状态
  return userStore.isSuperAdmin || 
         (props.pr && props.pr.requester?.id === userStore.userId)
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
.v-table th {
  font-weight: 600;
  background-color: rgb(var(--v-theme-surface-variant));
}
</style>
