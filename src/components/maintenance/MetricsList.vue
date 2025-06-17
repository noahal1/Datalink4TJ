<template>
  <v-card class="h-100">
    <v-card-title class="d-flex align-center">
      <span>维修数据指标</span>
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="搜索"
        single-line
        hide-details
        class="mx-4"
      ></v-text-field>
      <v-btn 
        color="primary" 
        @click="$emit('add-metric')"
        v-permission="'MAINT:WRITE'"
      >
        <v-icon left>mdi-plus</v-icon>
        添加指标
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="selectedEquipment"
            :items="equipmentTypes"
            label="设备类型"
            variant="outlined"
            density="compact"
            clearable
          ></v-select>
        </v-col>
      </v-row>
      
      <v-data-table
        :headers="headers"
        :items="filteredMetrics"
        :search="search"
        :loading="loading"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-text': '每页行数',
          'items-per-page-options': [10, 20, 50]
        }"
        class="elevation-1"
      >
        <template v-slot:item.equipment_type="{ item }">
          <v-chip
            :color="getEquipmentColor(item.equipment_type)"
            size="small"
            class="text-white"
          >
            {{ item.equipment_type }}
          </v-chip>
        </template>
        
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>
        
        <template v-slot:item.oee="{ item }">
          {{ formatPercentage(item.oee) }}
        </template>
        
        <template v-slot:item.availability="{ item }">
          {{ formatPercentage(item.availability) }}
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="$emit('edit-metric', item)"
            v-permission="'MAINT:WRITE'"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            @click="confirmDelete(item)"
            v-permission="'MAINT:ADMIN'"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        
        <template v-slot:no-data>
          <div class="text-center py-4">
            <v-icon icon="mdi-alert-circle-outline" size="large" class="mb-2"></v-icon>
            <div>暂无数据</div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
    
    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">确认删除</v-card-title>
        <v-card-text>
          您确定要删除这条维修数据指标吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="red darken-1" text @click="deleteItem">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePermissionStore } from '../../stores/permission'

const props = defineProps({
  metrics: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-metric', 'edit-metric', 'delete-metric'])

// 使用权限存储
const permissionStore = usePermissionStore()

// 表格表头
const headers = [
  { title: '设备类型', key: 'equipment_type', sortable: true },
  { title: '日期', key: 'date', sortable: true },
  { title: '停机次数', key: 'downtime_count', sortable: true, align: 'end' },
  { title: '停机时间(分钟)', key: 'downtime_minutes', sortable: true, align: 'end' },
  { title: '生产零件数', key: 'parts_produced', sortable: true, align: 'end' },
  { title: 'OEE', key: 'oee', sortable: true, align: 'end' },
  { title: '设备可动率', key: 'availability', sortable: true, align: 'end' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' }
]

// 设备类型选项
const equipmentTypes = [
  'SWI-L',
  'SWI-R',
  'RWH-L',
  'RWH-R'
]

// 筛选和搜索
const selectedEquipment = ref('')
const search = ref('')

// 筛选后的指标数据
const filteredMetrics = computed(() => {
  let result = [...props.metrics]
  
  // 按设备类型筛选
  if (selectedEquipment.value) {
    result = result.filter(metric => 
      metric.equipment_type === selectedEquipment.value
    )
  }
  
  // 搜索功能
  if (search.value) {
    const query = search.value.toLowerCase()
    result = result.filter(metric => 
      metric.equipment_type.toLowerCase().includes(query) ||
      metric.date.toString().includes(query)
    )
  }
  
  return result
})

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 格式化百分比
const formatPercentage = (value) => {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(2)}%`
}

// 获取设备类型对应的颜色
const getEquipmentColor = (type) => {
  const colors = {
    'SWI-L': 'indigo',
    'SWI-R': 'deep-purple',
    'RWH-L': 'teal',
    'RWH-R': 'cyan'
  }
  return colors[type] || 'grey'
}

// 删除对话框
const deleteDialog = ref(false)
const itemToDelete = ref(null)

// 确认删除
const confirmDelete = (item) => {
  itemToDelete.value = item
  deleteDialog.value = true
}

// 删除项目
const deleteItem = () => {
  emit('delete-metric', itemToDelete.value)
  deleteDialog.value = false
  itemToDelete.value = null
}
</script>

<style scoped>
.v-card__title {
  display: flex;
  align-items: center;
}
</style> 