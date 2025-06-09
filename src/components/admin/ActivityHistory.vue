<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon left class="mr-2">mdi-history</v-icon>
      活动历史记录
      <v-spacer></v-spacer>
      <v-btn icon="mdi-refresh" variant="text" @click="fetchActivities" :loading="isLoading"></v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <v-card-text>
      <!-- 筛选器 -->
      <v-row class="mb-4">
        <v-col cols="12" md="3">
          <v-text-field v-model="filters.user" label="用户名" clearable @update:model-value="debouncedFetch"></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="filters.department" :items="departments" item-title="name" item-value="name" label="部门" clearable @update:model-value="fetchActivities"></v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="filters.type" label="操作类型" clearable @update:model-value="debouncedFetch"></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="filters.days" label="最近天数" type="number" clearable @update:model-value="debouncedFetch"></v-text-field>
        </v-col>
      </v-row>

      <!-- 活动列表 -->
      <v-data-table-server
        :headers="headers"
        :items="activities"
        :items-length="totalActivities"
        :loading="isLoading"
        :items-per-page="options.itemsPerPage"
        @update:options="updateOptions"
        class="elevation-1"
        item-value="id"
      >
        <template v-slot:item.user="{ item }">
          {{ item.user }} ({{ item.department }})
        </template>
        <template v-slot:item.timestamp="{ item }">
          {{ formatFullDateTime(item.timestamp) }}
        </template>
        <template v-slot:item.action="{ item }">
           <v-chip :color="item.color" size="small">{{ item.type }}</v-chip>
           <span class="ml-2">{{ item.action }}</span>
        </template>
        <template v-slot:item.details="{ item }">
          <v-btn size="small" @click="showActivityDetails(item)">查看详情</v-btn>
        </template>
      </v-data-table-server>
    </v-card-text>

     <!-- 活动详情对话框 -->
    <v-dialog v-model="showDialog" max-width="800">
      <v-card v-if="selectedActivity">
        <v-toolbar :color="selectedActivity.color" dark flat>
          <v-toolbar-title>活动详情</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-list density="compact">
            <v-list-item>
              <template #prepend><v-icon>mdi-account</v-icon></template>
              <v-list-item-title><strong>操作人员:</strong> {{ selectedActivity.user }} ({{ selectedActivity.department }})</v-list-item-title>
            </v-list-item>
             <v-list-item>
              <template #prepend><v-icon>mdi-clock-outline</v-icon></template>
              <v-list-item-title><strong>操作时间:</strong> {{ formatFullDateTime(selectedActivity.timestamp) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend><v-icon>mdi-tag</v-icon></template>
              <v-list-item-title><strong>操作类型:</strong> {{ selectedActivity.type }}</v-list-item-title>
            </v-list-item>
             <v-list-item>
              <template #prepend><v-icon>mdi-information</v-icon></template>
              <v-list-item-title><strong>标题:</strong> {{ selectedActivity.title }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend><v-icon>mdi-comment-text</v-icon></template>
              <v-list-item-title><strong>操作描述:</strong> {{ selectedActivity.action }}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="selectedActivity.details">
              <template #prepend><v-icon>mdi-card-text</v-icon></template>
              <v-list-item-title><strong>详细信息:</strong> {{ selectedActivity.details }}</v-list-item-title>
            </v-list-item>
          </v-list>
          
          <div v-if="selectedActivity.changes && (selectedActivity.changes.before || selectedActivity.changes.after)" class="mt-4">
            <h3 class="text-subtitle-1 mb-2">数据变更记录</h3>
             <v-tabs v-model="activeTab" density="comfortable">
              <v-tab value="diff">差异对比</v-tab>
              <v-tab value="before">变更前</v-tab>
              <v-tab value="after">变更后</v-tab>
            </v-tabs>
            <v-window v-model="activeTab" class="mt-2">
               <v-window-item value="before">
                <pre class="code-block">{{ formatJson(selectedActivity.changes.before) }}</pre>
              </v-window-item>
              <v-window-item value="after">
                <pre class="code-block">{{ formatJson(selectedActivity.changes.after) }}</pre>
              </v-window-item>
              <v-window-item value="diff">
                 <!-- Add a proper diff viewer here if needed -->
                <pre class="code-block">{{ formatJson(selectedActivity.changes.after) }}</pre>
              </v-window-item>
            </v-window>
          </div>

        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../utils/api'
import { format } from 'date-fns'
import debounce from 'lodash.debounce'

const activities = ref([])
const departments = ref([])
const isLoading = ref(false)
const totalActivities = ref(0)
const options = ref({ page: 1, itemsPerPage: 10, sortBy: [{ key: 'timestamp', order: 'desc' }] })
const filters = ref({
  user: null,
  department: null,
  type: null,
  days: null
})

const showDialog = ref(false)
const selectedActivity = ref(null)
const activeTab = ref('diff')

const headers = [
  { title: '时间', key: 'timestamp', align: 'start', sortable: true },
  { title: '操作人员', key: 'user', align: 'start', sortable: false },
  { title: '操作', key: 'action', align: 'start', sortable: false },
  { title: '标题', key: 'title', align: 'start', sortable: false },
  { title: '详情', key: 'details', align: 'center', sortable: false }
]

const fetchActivities = async () => {
  isLoading.value = true
  try {
    const params = {
      skip: (options.value.page - 1) * options.value.itemsPerPage,
      limit: options.value.itemsPerPage,
      user_name: filters.value.user,
      department: filters.value.department,
      type: filters.value.type,
      days: filters.value.days
    }
    
    // 目前API不支持按用户名搜索，先移除
    delete params.user_name

    const response = await api.get('/activities/', params)
    activities.value = response.items
    totalActivities.value = response.total
      
  } catch (error) {
    console.error('获取活动记录失败:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchDepartments = async () => {
   try {
    const response = await api.get('/departments/')
    departments.value = response
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const debouncedFetch = debounce(fetchActivities, 500)

const updateOptions = (newOptions) => {
  options.value = newOptions
  fetchActivities()
}

const showActivityDetails = (activity) => {
  selectedActivity.value = activity
  showDialog.value = true
}

const formatFullDateTime = (timestamp) => {
  if (!timestamp) return ''
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
}

const formatJson = (data) => {
  if (data === null || data === undefined) return 'N/A'
  return JSON.stringify(data, null, 2)
}

onMounted(() => {
  fetchDepartments()
  fetchActivities()
})

watch(filters, fetchActivities, { deep: true })

</script>

<style scoped>
.code-block {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
}
</style> 