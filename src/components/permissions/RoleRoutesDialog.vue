<template>
  <v-dialog
    v-model="dialog"
    max-width="800px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">
          mdi-shield-account
        </v-icon>
        管理角色路由权限
        <v-spacer />
        <v-btn
          icon
          @click="closeDialog"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="role"
          type="info"
          class="mb-4"
        >
          正在为角色 <strong>{{ role.name }}</strong> 配置路由访问权限
        </v-alert>

        <v-alert
          type="warning"
          class="mb-4"
        >
          <strong>注意：</strong>当前权限系统已简化，权限规则由系统预定义。此功能主要用于查看和记录权限配置请求。
        </v-alert>

        <!-- 路由选择 -->
        <v-card
          variant="outlined"
          class="mb-4"
        >
          <v-card-title class="text-h6">
            <v-icon class="mr-2">
              mdi-routes
            </v-icon>
            可访问路由
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="selectAll"
                  label="全选/全不选"
                  color="primary"
                  @change="toggleSelectAll"
                />
              </v-col>
            </v-row>
            
            <v-row>
              <v-col 
                v-for="route in routes" 
                :key="route.id" 
                cols="12" 
                sm="6" 
                md="4"
              >
                <v-checkbox
                  v-model="selectedRoutes"
                  :value="route.id"
                  :label="route.name"
                  :hint="route.path"
                  persistent-hint
                  color="primary"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 当前权限预览 -->
        <v-card
          v-if="role"
          variant="outlined"
        >
          <v-card-title class="text-h6">
            <v-icon class="mr-2">
              mdi-eye
            </v-icon>
            当前权限预览
          </v-card-title>
          <v-card-text>
            <div class="mb-2">
              <strong>角色：</strong>{{ role.name }}
            </div>
            <div class="mb-2">
              <strong>描述：</strong>{{ role.description || '无描述' }}
            </div>
            <div class="mb-2">
              <strong>选中路由：</strong>{{ selectedRoutes.length }} / {{ routes.length }}
            </div>
            
            <v-chip-group v-if="selectedRoutes.length > 0">
              <v-chip 
                v-for="routeId in selectedRoutes" 
                :key="routeId"
                size="small"
                color="primary"
              >
                {{ getRouteName(routeId) }}
              </v-chip>
            </v-chip-group>
            
            <div
              v-else
              class="text-grey"
            >
              未选择任何路由
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">
          取消
        </v-btn>
        <v-btn 
          color="primary" 
          :loading="loading"
          :disabled="!role"
          @click="saveRoutes"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useNotification } from '../../composables/useNotification'

const { showSuccess, showError } = useNotification()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  role: {
    type: Object,
    default: null
  },
  routes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save', 'close'])

// 状态变量
const selectedRoutes = ref([])
const selectAll = ref(false)

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听器
watch(() => props.role, (newRole) => {
  if (newRole) {
    // 重置选择状态
    selectedRoutes.value = []
    selectAll.value = false
  }
}, { immediate: true })

watch(selectedRoutes, (newSelection) => {
  selectAll.value = newSelection.length === props.routes.length
}, { deep: true })

// 方法
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedRoutes.value = props.routes.map(route => route.id)
  } else {
    selectedRoutes.value = []
  }
}

const getRouteName = (routeId) => {
  const route = props.routes.find(r => r.id === routeId)
  return route ? route.name : `路由${routeId}`
}

const saveRoutes = () => {
  if (!props.role) {
    showError('请选择角色')
    return
  }

  emit('save', props.role.id, selectedRoutes.value)
}

const closeDialog = () => {
  emit('close')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.v-checkbox {
  margin-bottom: 8px;
}

.v-chip-group {
  max-height: 200px;
  overflow-y: auto;
}
</style>
