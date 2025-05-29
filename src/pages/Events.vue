<template>
  <v-container class="events-container pa-0" fluid>
    <v-card elevation="0" class="fill-height">
      <!-- 标题和工具栏 -->
      <v-card-title class="d-flex align-center fixed-header py-4">
        <v-icon size="large" color="primary" class="mr-2">mdi-calendar-text</v-icon>
        <span class="text-h5">重要事件管理</span>
        
        <v-spacer></v-spacer>
        
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="搜索事件"
          density="compact"
          variant="outlined"
          hide-details
          class="search-field mx-4"
          clearable
        ></v-text-field>
        
        <v-btn 
          color="primary" 
          @click="openDialog" 
          prepend-icon="mdi-plus"
        >
          添加事件
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <!-- 加载指示器 -->
      <loading-overlay :loading="isLoading" message="加载数据中..." />
      
      <!-- 数据表格 -->
      <div class="table-container">
        <v-data-table
          :items="events"
          :headers="tableHeaders"
          :search="searchQuery"
          density="comfortable"
          hover
          fixed-header
          class="events-table"
        >
          <template #item.importance="{ item }">
            <v-chip
              :color="getImportanceColor(item.importance)"
              size="small"
              class="font-weight-medium"
            >
              {{ getImportanceLabel(item.importance) }}
            </v-chip>
          </template>
          
          <template #item.start_time="{ item }">
            <div class="d-flex align-center">
              <v-icon size="small" color="primary" class="mr-1">mdi-calendar-start</v-icon>
              {{ formatDate(item.start_time) }}
            </div>
          </template>
          
          <template #item.end_time="{ item }">
            <div class="d-flex align-center">
              <v-icon size="small" :color="isEventActive(item) ? 'success' : 'grey'" class="mr-1">
                {{ isEventActive(item) ? 'mdi-calendar-clock' : 'mdi-calendar-check' }}
              </v-icon>
              {{ formatDate(item.end_time) }}
            </div>
          </template>
          
          <template #item.actions="{ item }">
            <div class="d-flex justify-center">
              <v-btn
                size="small"
                color="primary"
                variant="text"
                icon="mdi-pencil"
                @click="openDialog(item)"
                class="mr-1"
              />
              <v-btn
                size="small"
                color="error"
                variant="text"
                icon="mdi-delete"
                @click="confirmDelete(item)"
              />
            </div>
          </template>
          
          <template #no-data>
            <div class="text-center pa-6">
              <v-icon size="large" color="grey" class="mb-2">mdi-calendar-remove</v-icon>
              <div class="text-subtitle-1 text-medium-emphasis">暂无重要事件记录</div>
              <v-btn color="primary" variant="text" class="mt-2" @click="openDialog">
                添加新事件
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- 添加/编辑事件对话框 -->
    <v-dialog v-model="showDialog" max-width="600" persistent>
      <v-card>
        <v-toolbar :color="primary" dark flat>
          <v-toolbar-title>{{ dialogTitle }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDialog = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pt-4">
          <v-form ref="eventFormRef" @submit.prevent="submitEvent">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                      v-model="eventForm.name"
                      label="事件名称"
                      :rules="[v => !!v || '必填字段']"
                      required
                      variant="outlined"
                      prepend-inner-icon="mdi-format-title"/>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="eventForm.department"
                    label="部门"  
                    :rules="[v => !!v || '必填字段']"
                    required
                    variant="outlined"
                    prepend-inner-icon="mdi-office-building"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="eventForm.start_time"
                    label="开始时间"
                    type="date"
                    variant="outlined"
                    :max="eventForm.end_time"
                    prepend-inner-icon="mdi-calendar-start"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="eventForm.end_time"
                    label="结束时间"
                    type="date"
                    variant="outlined"
                    :min="eventForm.start_time"
                    prepend-inner-icon="mdi-calendar-end"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="showDialog = false">取消</v-btn>
          <v-btn color="primary" variant="elevated" @click="submitEvent">
            {{ eventForm.id ? '保存修改' : '添加事件' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>
          确定要删除事件 <strong>{{ eventToDelete?.name }}</strong> 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showDeleteDialog = false">
            取消
          </v-btn>
          <v-btn color="error" variant="tonal" @click="executeDelete">
            <v-icon class="mr-1">mdi-delete</v-icon>
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, isValid, parseISO, isAfter, isBefore, isToday } from 'date-fns'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const showDialog = ref(false)
const dialogTitle = ref('添加事件')
const dialogColor = computed(() => eventForm.value.id ? 'primary' : 'success')
const eventFormRef = ref(null)
const eventForm = ref({
  id: null,
  name: '',
  department: '',
  start_time: '',
  end_time: '',
  importance: 'medium'
})
const events = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const eventToDelete = ref(null)

const tableHeaders = [
  { title: '事件名称', key: 'name', align: 'start', width: '30%' },
  { title: '部门', key: 'department', align: 'start', width: '15%' },
  { title: '开始时间', key: 'start_time', align: 'start', width: '15%' },
  { title: '结束时间', key: 'end_time', align: 'start', width: '15%' },
  { title: '操作', key: 'actions', align: 'center', width: '15%', sortable: false }
];

const getImportanceLabel = (importance) => {
  const option = importanceOptions.find(opt => opt.value === importance);
  return option ? option.label : '中';
};

const getImportanceColor = (importance) => {
  switch (importance) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'grey';
  }
};

const isEventActive = (event) => {
  if (!event.end_time) return true;
  
  const today = new Date();
  const endDate = parseISO(event.end_time);
  
  // 今天或未来日期都视为活动状态
  return isToday(endDate) || isAfter(endDate, today);
};

const fetchEvents = async () => {
  isLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/events`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    events.value = data.map(event => ({
      ...event,
      start_time: event.start_time.split('T')[0],  // 只保留日期部分
      end_time: event.end_time ? event.end_time.split('T')[0] : null,  // 只保留日期部分
      importance: event.importance || 'medium'  // 确保有重要性字段
    }))
  } catch (error) {
    console.error('Error fetching events:', error)
    // 使用全局通知
    const app = getCurrentInstance();
    if (app && app.proxy.$notify) {
      app.proxy.$notify.error('获取事件列表失败');
    }
  } finally {
    isLoading.value = false;
  }
}

const openDialog = (event = null) => {
  if (event) {
    dialogTitle.value = '编辑事件'
    eventForm.value = { ...event }
  } else {
    dialogTitle.value = '添加事件'
    const today = new Date().toISOString().split('T')[0]
    eventForm.value = { 
      id: null, 
      name: '', 
      department: '', 
      start_time: today, 
      end_time: '', 
      importance: 'medium'
    }
  }
  showDialog.value = true
}

const submitEvent = async () => {
  const { valid } = await eventFormRef.value.validate()
  if (valid) {
    try {
      const method = eventForm.value.id ? 'PUT' : 'POST'
      const url = eventForm.value.id ? `${API_BASE_URL}/events/${eventForm.value.id}` : `${API_BASE_URL}/events`
      const payload = {
        name: eventForm.value.name,
        department: eventForm.value.department,
        start_time: eventForm.value.start_time,
        end_time: eventForm.value.end_time || null,
        importance: eventForm.value.importance || 'medium'
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // 使用全局通知
      const app = getCurrentInstance();
      if (app && app.proxy.$notify) {
        app.proxy.$notify.success(eventForm.value.id ? '事件更新成功' : '事件添加成功');
      }
      
      showDialog.value = false
      eventForm.value = { id: null, name: '', department: '', start_time: '', end_time: '' }
      await fetchEvents()
    } catch (error) {
      console.error('Error submitting event:', error)
      
      // 使用全局通知
      const app = getCurrentInstance();
      if (app && app.proxy.$notify) {
        app.proxy.$notify.error(eventForm.value.id ? '事件更新失败' : '事件添加失败');
      }
    }
  } else {
    // 使用全局通知
    const app = getCurrentInstance();
    if (app && app.proxy.$notify) {
      app.proxy.$notify.warning('请完整填写表单');
    }
  }
}

const confirmDelete = (event) => {
  eventToDelete.value = event;
  showDeleteDialog.value = true;
};

const executeDelete = async () => {
  if (!eventToDelete.value) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventToDelete.value.id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 使用全局通知
    const app = getCurrentInstance();
    if (app && app.proxy.$notify) {
      app.proxy.$notify.success('事件删除成功');
    }
    
    showDeleteDialog.value = false;
    eventToDelete.value = null;
    await fetchEvents();
  } catch (error) {
    console.error('Error deleting event:', error);
    
    // 使用全局通知
    const app = getCurrentInstance();
    if (app && app.proxy.$notify) {
      app.proxy.$notify.error('事件删除失败');
    }
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '未设置';
  const date = parseISO(dateString);
  if (isValid(date)) {
    return format(date, 'yyyy-MM-dd');
  }
  return '无效日期';
};

onMounted(async () => {
  await fetchEvents();
});
</script>

<style scoped>
.events-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.fill-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-field {
  max-width: 300px;
}

.table-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.events-table {
  height: 100%;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
}

.v-card {
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
}

.v-btn {
  letter-spacing: normal;
  text-transform: none;
}

.v-data-table :deep(th) {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #424242;
}

.v-data-table :deep(td) {
  transition: background-color 0.2s;
  height: 56px !important;
}

.v-data-table :deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

@media (max-width: 600px) {
  .search-field {
    max-width: 150px;
  }
}
</style>
