<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-history</v-icon>
            操作记录
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
          </v-card-title>
          
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="activities"
              :loading="loading"
              :search="search"
              class="elevation-1"
              :items-per-page="10"
              :items-per-page-options="[10, 20, 50, 100]"
            >
              <template v-slot:item.timestamp="{ item }">
                {{ formatDate(item.raw.timestamp) }}
              </template>
              
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.raw.status)"
                  size="small"
                  class="text-white"
                >
                  {{ item.raw.status }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 过滤器抽屉 -->
    <v-navigation-drawer
      v-model="filterDrawer"
      location="right"
      temporary
      width="300"
    >
      <v-list-item>
        <v-list-item-title class="text-h6">
          筛选条件
        </v-list-item-title>
      </v-list-item>
      
      <v-divider></v-divider>
      
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-select
              v-model="filters.user"
              :items="users"
              label="用户"
              clearable
            ></v-select>
          </v-col>
          
          <v-col cols="12">
            <v-select
              v-model="filters.action"
              :items="actions"
              label="操作类型"
              clearable
            ></v-select>
          </v-col>
          
          <v-col cols="12">
            <v-select
              v-model="filters.status"
              :items="statuses"
              label="状态"
              clearable
            ></v-select>
          </v-col>
          
          <v-col cols="12">
            <v-text-field
              v-model="filters.dateFrom"
              label="开始日期"
              type="date"
              clearable
            ></v-text-field>
          </v-col>
          
          <v-col cols="12">
            <v-text-field
              v-model="filters.dateTo"
              label="结束日期"
              type="date"
              clearable
            ></v-text-field>
          </v-col>
        </v-row>
        
        <v-row>
          <v-col cols="12" class="d-flex justify-space-between">
            <v-btn
              variant="text"
              color="error"
              @click="clearFilters"
            >
              清除筛选
            </v-btn>
            
            <v-btn
              color="primary"
              @click="applyFilters"
            >
              应用筛选
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification'

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
const activities = ref([
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
  },
  { 
    id: 6, 
    timestamp: '2025-06-09T14:30:00', 
    username: 'user2',
    action: '登录',
    details: '用户登录',
    status: '失败',
    ip: '192.168.1.130'
  },
  { 
    id: 7, 
    timestamp: '2025-06-09T14:32:15', 
    username: 'user2',
    action: '登录',
    details: '用户登录',
    status: '成功',
    ip: '192.168.1.130'
  },
  { 
    id: 8, 
    timestamp: '2025-06-09T14:45:22', 
    username: 'user2',
    action: '数据提交',
    details: '提交生产报告',
    status: '成功',
    ip: '192.168.1.130'
  },
  { 
    id: 9, 
    timestamp: '2025-06-09T15:20:10', 
    username: 'admin',
    action: '系统配置',
    details: '修改系统配置',
    status: '成功',
    ip: '192.168.1.100'
  },
  { 
    id: 10, 
    timestamp: '2025-06-09T16:05:30', 
    username: 'user3',
    action: '登录',
    details: '用户登录',
    status: '成功',
    ip: '192.168.1.140'
  },
  { 
    id: 11, 
    timestamp: '2025-06-09T16:30:45', 
    username: 'user3',
    action: '数据提交',
    details: '提交EHS报告',
    status: '警告',
    ip: '192.168.1.140'
  },
  { 
    id: 12, 
    timestamp: '2025-06-09T16:45:12', 
    username: 'user3',
    action: '数据修改',
    details: '修改EHS报告',
    status: '成功',
    ip: '192.168.1.140'
  },
])

// 加载状态
const loading = ref(false)
const search = ref('')
const filterDrawer = ref(false)

// 过滤器选项
const users = ['admin', 'user1', 'user2', 'user3']
const actions = ['登录', '创建用户', '修改权限', '数据提交', '数据修改', '系统配置']
const statuses = ['成功', '失败', '警告']

// 过滤器值
const filters = ref({
  user: null,
  action: null,
  status: null,
  dateFrom: null,
  dateTo: null,
})

// 页面加载时获取数据
onMounted(() => {
  fetchActivities()
})

// 获取活动记录数据
const fetchActivities = async () => {
  try {
    loading.value = true
    // 这里应该是从API获取数据
    // const response = await api.getActivities()
    // activities.value = response.data
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 使用示例数据
    // activities.value = [...] // 已在上面定义
  } catch (error) {
    console.error('获取操作记录失败:', error)
    showError('获取操作记录失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

// 获取状态颜色
const getStatusColor = (status) => {
  switch (status) {
    case '成功':
      return 'success'
    case '失败':
      return 'error'
    case '警告':
      return 'warning'
    default:
      return 'grey'
  }
}

// 清除过滤器
const clearFilters = () => {
  filters.value = {
    user: null,
    action: null,
    status: null,
    dateFrom: null,
    dateTo: null,
  }
}

// 应用过滤器
const applyFilters = async () => {
  try {
    loading.value = true
    // 这里应该是从API获取筛选后的数据
    // const response = await api.getActivities(filters.value)
    // activities.value = response.data
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟筛选
    let filteredData = [...activities.value]
    
    if (filters.value.user) {
      filteredData = filteredData.filter(item => item.username === filters.value.user)
    }
    
    if (filters.value.action) {
      filteredData = filteredData.filter(item => item.action === filters.value.action)
    }
    
    if (filters.value.status) {
      filteredData = filteredData.filter(item => item.status === filters.value.status)
    }
    
    if (filters.value.dateFrom) {
      const fromDate = new Date(filters.value.dateFrom)
      filteredData = filteredData.filter(item => new Date(item.timestamp) >= fromDate)
    }
    
    if (filters.value.dateTo) {
      const toDate = new Date(filters.value.dateTo)
      toDate.setHours(23, 59, 59, 999) // 设置为当天的最后一毫秒
      filteredData = filteredData.filter(item => new Date(item.timestamp) <= toDate)
    }
    
    activities.value = filteredData
    filterDrawer.value = false
  } catch (error) {
    console.error('筛选操作记录失败:', error)
    showError('筛选操作记录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.v-data-table {
  margin-top: 16px;
}
</style> 