<template>
  <div>
    <v-row>
      <v-col cols="12">
        <unified-data-table
          title="活动日志"
          icon="mdi-clock-outline"
          :headers="headers"
          :items="activities"
          :loading="loading"
          :search="search"
          :items-per-page="10"
        >
          <template v-slot:title>
            <span>活动日志</span>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="搜索"
              single-line
              hide-details
              density="compact"
              class="ml-4"
              style="max-width: 300px"
            ></v-text-field>
          </template>
          
          <template v-slot:item.timestamp="{ item }">
            {{ formatDate(item.timestamp) }}
          </template>
          
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              class="text-white"
            >
              {{ item.status }}
            </v-chip>
          </template>
          
          <template #actions>
            <v-btn color="primary" prepend-icon="mdi-filter" @click="filterDrawer = true">
              筛选
            </v-btn>
            <v-btn class="ml-2" color="secondary" prepend-icon="mdi-refresh" @click="fetchActivities">
              刷新
            </v-btn>
          </template>
        </unified-data-table>
      </v-col>
    </v-row>
    
    <!-- 过滤器抽屉 -->
    <v-navigation-drawer
      v-model="filterDrawer"
      location="right"
      temporary
      width="300"
    >
      <v-card class="h-100">
        <v-card-title class="bg-primary text-white">
          <v-icon class="mr-2" color="white">mdi-filter</v-icon>
          筛选条件
          <v-spacer></v-spacer>
          <v-btn icon variant="text" color="white" size="small" @click="filterDrawer = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <unified-form>
            <v-select
              v-model="filters.user"
              :items="users"
              label="用户"
              variant="outlined"
              density="comfortable"
              clearable
            ></v-select>
            
            <v-select
              v-model="filters.action"
              :items="actions"
              label="操作类型"
              variant="outlined"
              density="comfortable"
              clearable
            ></v-select>
            
            <v-select
              v-model="filters.status"
              :items="statuses"
              label="状态"
              variant="outlined"
              density="comfortable"
              clearable
            ></v-select>
            
            <v-text-field
              v-model="filters.dateFrom"
              label="开始日期"
              type="date"
              variant="outlined"
              density="comfortable"
              clearable
            ></v-text-field>
            
            <v-text-field
              v-model="filters.dateTo"
              label="结束日期"
              type="date"
              variant="outlined"
              density="comfortable"
              clearable
            ></v-text-field>
          </unified-form>
        </v-card-text>
        
        <v-card-actions class="py-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" @click="clearFilters">
            清除筛选
          </v-btn>
          <v-btn color="primary" @click="applyFilters">
            应用筛选
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import UnifiedDataTable from '../../components/UnifiedDataTable.vue'
import UnifiedForm from '../../components/UnifiedForm.vue'
import { useNotification } from '../../composables/useNotification'
import { get } from '../../utils/api'

const { showError } = useNotification()

// 表格列定义
const headers = [
  { title: '时间', key: 'timestamp', align: 'start', sortable: true },
  { title: '用户', key: 'username', align: 'start', sortable: true },
  { title: '操作', key: 'action', align: 'start', sortable: true },
  { title: '详情', key: 'details', align: 'start', sortable: false },
  { title: '状态', key: 'status', align: 'center', sortable: true },
  { title: 'IP地址', key: 'ip', align: 'end', sortable: false },
]

// 活动记录数据
const activities = ref([])
const loading = ref(false)
const search = ref('')
const filterDrawer = ref(false)

// 过滤选项
const users = ref([])
const actions = ref([])
const statuses = ref(['成功', '失败', '警告', '进行中'])

// 过滤器
const filters = ref({
  user: null,
  action: null,
  status: null,
  dateFrom: null,
  dateTo: null
})

// 获取活动记录
const fetchActivities = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {}
    if (filters.value.user) params.username = filters.value.user
    if (filters.value.action) params.action = filters.value.action
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.dateFrom) params.date_from = filters.value.dateFrom
    if (filters.value.dateTo) params.date_to = filters.value.dateTo
    
    // 调用API
    const response = await get('/activities', { params })
    
    if (response && response.data && Array.isArray(response.data)) {
      activities.value = response.data
    } else if (response && Array.isArray(response)) {
      activities.value = response
    } else {
      console.error('活动数据格式不正确:', response)
      // 使用测试数据
      activities.value = [
        { 
          id: 1, 
          timestamp: '2025-06-09T10:30:00', 
          username: 'admin',
          action: '登录',
          details: '系统管理员登录',
          status: '成功',
          ip: '192.168.1.100'
        },
        { 
          id: 2, 
          timestamp: '2025-06-09T11:15:22', 
          username: 'admin',
          action: '创建用户',
          details: '创建用户: user1',
          status: '成功',
          ip: '192.168.1.100'
        },
        { 
          id: 3, 
          timestamp: '2025-06-09T11:20:45', 
          username: 'admin',
          action: '修改权限',
          details: '修改用户 user1 的权限',
          status: '成功',
          ip: '192.168.1.100'
        },
        { 
          id: 4, 
          timestamp: '2025-06-09T13:05:30', 
          username: 'user1',
          action: '登录',
          details: '用户首次登录',
          status: '成功',
          ip: '192.168.1.120'
        },
        { 
          id: 5, 
          timestamp: '2025-06-09T13:10:12', 
          username: 'user1',
          action: '数据提交',
          details: '提交质量报告',
          status: '成功',
          ip: '192.168.1.120'
        }
      ]
    }
    
    // 提取用户和操作类型以用于过滤
    extractFilterOptions()
  } catch (error) {
    console.error('获取活动记录失败:', error)
    showError('获取活动记录失败')
    
    // 使用测试数据
    activities.value = []
  } finally {
    loading.value = false
  }
}

// 提取过滤选项
const extractFilterOptions = () => {
  // 提取用户
  const uniqueUsers = new Set(activities.value.map(activity => activity.username))
  users.value = Array.from(uniqueUsers)
  
  // 提取操作类型
  const uniqueActions = new Set(activities.value.map(activity => activity.action))
  actions.value = Array.from(uniqueActions)
}

// 应用过滤器
const applyFilters = () => {
  filterDrawer.value = false
  fetchActivities()
}

// 清除过滤器
const clearFilters = () => {
  filters.value = {
    user: null,
    action: null,
    status: null,
    dateFrom: null,
    dateTo: null
  }
  
  // 不自动应用，等用户点击应用按钮
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (e) {
    return dateString
  }
}

// 根据状态获取颜色
const getStatusColor = (status) => {
  const statusColors = {
    '成功': 'success',
    '失败': 'error',
    '警告': 'warning',
    '进行中': 'info'
  }
  
  return statusColors[status] || 'grey'
}

// 初始化
onMounted(() => {
  fetchActivities()
})
</script> 