<template>
  <unified-page-template 
    title="重要事件管理"
    icon="mdi-calendar-text"
    color="info"
  >
    <template #header-actions>
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="搜索事件"
        density="compact"
        variant="outlined"
        hide-details
        class="search-field mx-4"
        clearable
      />
      
      <v-btn 
        color="primary" 
        prepend-icon="mdi-plus" 
        @click="openDialog"
      >
        添加事件
      </v-btn>
    </template>
    
    <loading-overlay
      :loading="isLoading"
      message="加载数据中..."
    />
    
    <!-- 数据表格 -->
    <unified-data-table
      :headers="tableHeaders"
      :items="events"
      :search="searchQuery"
      :loading="isLoading"
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
          <v-icon
            size="small"
            color="primary"
            class="mr-1"
          >
            mdi-calendar-start
          </v-icon>
          {{ formatDate(item.start_time) }}
        </div>
      </template>
      
      <template #item.end_time="{ item }">
        <div class="d-flex align-center">
          <v-icon
            size="small"
            :color="isEventActive(item) ? 'success' : 'grey'"
            class="mr-1"
          >
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
            class="mr-1"
            @click="openDialog(item)"
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
          <v-icon
            size="large"
            color="grey"
            class="mb-2"
          >
            mdi-calendar-remove
          </v-icon>
          <div class="text-subtitle-1 text-medium-emphasis">
            暂无重要事件记录
          </div>
          <v-btn
            color="primary"
            variant="text"
            class="mt-2"
            @click="openDialog"
          >
            添加新事件
          </v-btn>
        </div>
      </template>
    </unified-data-table>

    <!-- 添加/编辑事件对话框 -->
    <v-dialog
      v-model="showDialog"
      max-width="600"
      persistent
    >
      <v-card>
        <v-toolbar
          :color="dialogColor"
          dark
          flat
        >
          <v-toolbar-title>{{ dialogTitle }}</v-toolbar-title>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showDialog = false"
          />
        </v-toolbar>
        
        <v-card-text class="pt-4">
          <v-form
            ref="eventFormRef"
            @submit.prevent="submitEvent"
          >
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="eventForm.name"
                    label="事件名称"
                    :rules="[v => !!v || '必填字段']"
                    required
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-format-title"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="eventForm.department"
                    label="部门"  
                    :rules="[v => !!v || '必填字段']"
                    required
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-office-building"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="eventForm.start_time"
                    label="开始时间"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    :max="eventForm.end_time"
                    prepend-inner-icon="mdi-calendar-start"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="eventForm.end_time"
                    label="结束时间"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    :min="eventForm.start_time"
                    prepend-inner-icon="mdi-calendar-end"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>

        <v-divider />
        
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="tonal"
            @click="showDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="isSubmitting"
            @click="submitEvent"
          >
            {{ eventForm.id ? '保存修改' : '添加事件' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认对话框 -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-h5 bg-error text-white">
          确认删除
        </v-card-title>
        <v-card-text class="pt-4">
          确定要删除事件 <strong>{{ eventToDelete?.name }}</strong> 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            @click="executeDelete"
          >
            <v-icon class="mr-1">
              mdi-delete
            </v-icon>
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { format, isValid, parseISO, isAfter, isBefore, isToday } from 'date-fns'
import { useUserStore } from '../stores/user'
import Message from '../utils/notification'
import api from '../utils/api'

const userStore = useUserStore()
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
const isSubmitting = ref(false)

const importanceOptions = [
  { title: '高', value: 'high' },
  { title: '中', value: 'medium' },
  { title: '低', value: 'low' }
];

const tableHeaders = [
  { title: '事件名称', key: 'name', align: 'start', width: '30%' },
  { title: '部门', key: 'department', align: 'start', width: '15%' },
  { title: '开始时间', key: 'start_time', align: 'start', width: '15%' },
  { title: '结束时间', key: 'end_time', align: 'start', width: '15%' },
  { title: '操作', key: 'actions', align: 'center', width: '15%', sortable: false }
];

const getImportanceLabel = (importance) => {
  const option = importanceOptions.find(opt => opt.value === importance);
  return option ? option.title : '中';
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
    // 检查用户是否已登录
    if (!userStore.token) {
      console.error('用户未登录或令牌无效');
      Message.error('请先登录再进行操作！');
      isLoading.value = false;
      return;
    }

    const response = await api.get('/events')
    
    events.value = response.data.map(event => ({
      ...event,
      start_time: event.start_time.split('T')[0],  // 只保留日期部分
      end_time: event.end_time ? event.end_time.split('T')[0] : null,  // 只保留日期部分
    }))
  } catch (error) {
    console.error('Error fetching events:', error)
    Message.error('获取事件列表失败');
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
  try {
    isSubmitting.value = true;
    // 验证表单
    let valid = true;
    if (eventFormRef.value) {
      const validation = await eventFormRef.value.validate();
      valid = validation?.valid ?? false;
    }
    
    if (!valid) {
      Message.warning('请完整填写表单');
      return;
    }
    
    // 检查用户是否已登录
    if (!userStore.token) {
      console.error('用户未登录或令牌无效');
      Message.error('请先登录再进行操作！');
      return;
    }

    const payload = {
      name: eventForm.value.name,
      department: eventForm.value.department,
      start_time: eventForm.value.start_time,
      end_time: eventForm.value.end_time || null,
      importance: eventForm.value.importance
    }

    let response;
    
    if (eventForm.value.id) {
      // 更新事件
      response = await api.put(`/events/${eventForm.value.id}`, payload);
    } else {
      // 创建事件
      response = await api.post('/events', payload);
    }
    
    Message.success(eventForm.value.id ? '事件更新成功' : '事件添加成功');
    
    showDialog.value = false
    eventForm.value = { id: null, name: '', department: '', start_time: '', end_time: '', importance: 'medium' }
    await fetchEvents()
  } catch (error) {
    console.error('Error submitting event:', error)
    Message.error(eventForm.value.id ? '事件更新失败' : '事件添加失败');
  } finally {
    isSubmitting.value = false;
  }
}

const confirmDelete = (event) => {
  eventToDelete.value = event;
  showDeleteDialog.value = true;
};

const executeDelete = async () => {
  if (!eventToDelete.value) return;
  
  try {
    // 检查用户是否已登录
    if (!userStore.token) {
      console.error('用户未登录或令牌无效');
      Message.error('请先登录再进行操作！');
      return;
    }

    await api.delete(`/events/${eventToDelete.value.id}`);
    
    Message.success('事件删除成功');
    
    showDeleteDialog.value = false;
    eventToDelete.value = null;
    await fetchEvents();
  } catch (error) {
    console.error('Error deleting event:', error);
    Message.error('事件删除失败');
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
.search-field {
  min-width: 200px;
}

.v-btn {
  letter-spacing: normal;
  text-transform: none;
}

@media (max-width: 600px) {
  .search-field {
    max-width: 150px;
  }
}
</style>
