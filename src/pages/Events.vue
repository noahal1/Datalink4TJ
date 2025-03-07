<template>
  <v-card class="mx-4 my-4">
    <v-container fluid>
      <v-row class="mb-4" justify="end">
        <v-col cols="auto">
          <v-btn color="primary" @click="openDialog" prepend-icon="mdi-plus">添加事件</v-btn>
        </v-col>
      </v-row>
      
      <v-data-table
        :items="events"
        :headers="tableHeaders"
        class="elevation-1"
        density="compact"
        hover
      >
        <template #item.start_time="{ item }">
          {{ formatDate(item.start_time) }}
        </template>
        
        <template #item.end_time="{ item }">
          {{ formatDate(item.end_time) }}
        </template>
        
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            color="primary"
            variant="text"
            icon="mdi-pencil"
            @click="openDialog(item)"
          />
          <v-btn
            size="small"
            color="error"
            variant="text"
            icon="mdi-delete"
            @click="deleteEvent(item.id)"
          />
        </template>
      </v-data-table>

      <v-dialog v-model="showDialog" max-width="600">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center px-6 pt-4">
            <span class="text-h5">{{ dialogTitle }}</span>
          </v-card-title>
          
          <v-card-text>
            <v-form ref="eventFormRef" @submit.prevent="submitEvent">
              <v-container>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                        v-model="eventForm.name"
                        label="事件名称"
                        :rules="[v => !!v || '必填字段']"
                        required
                        variant="outlined"/>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="eventForm.department"
                      label="部门"  
                      :rules="[v => !!v || '必填字段']"
                      required
                      variant="outlined"
                    />
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="eventForm.start_time"
                      label="开始时间"
                      type="date"
                      variant="outlined"
                      :max="eventForm.end_time"/>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="eventForm.end_time"
                      label="结束时间"
                      type="date"
                      variant="outlined"
                      :min="eventForm.start_time"/>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>
          </v-card-text>

          <v-card-actions class="px-6 pb-4">
            <v-spacer />
            <v-btn variant="tonal" @click="showDialog = false">取消</v-btn>
            <v-btn color="primary" variant="flat" @click="submitEvent">确认</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { format, isValid, parseISO } from 'date-fns'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const showDialog = ref(false)
const dialogTitle = ref('添加事件')
const eventFormRef = ref(null)
const eventForm = ref({
  id: null,
  name: '',
  department: '',
  start_time: '',
  end_time: ''
})
const events = ref([])

const tableHeaders = [
  { title: '事件名称', key: 'name', width: 600 },
  { title: '部门', key: 'department', width: 200 },
  { title: '开始时间', key: 'start_time', width: 300 },
  { title: '结束时间', key: 'end_time', width: 300 },
  { title: '操作', key: 'actions', width: 150, align: 'center' }
];

const fetchEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    events.value = data.map(event => ({
      ...event,
      start_time: event.start_time.split('T')[0],  // 只保留日期部分
      end_time: event.end_time ? event.end_time.split('T')[0] : null  // 只保留日期部分
    }))
  } catch (error) {
    console.error('Error fetching events:', error)
    ElMessage.error('获取事件列表失败')
  }
}

const openDialog = (event = null) => {
  if (event) {
    dialogTitle.value = '编辑事件'
    eventForm.value = { ...event }
  } else {
    dialogTitle.value = '添加事件'
    eventForm.value = { id: null, name: '', department: '', start_time: '', end_time: '' }
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
        end_time: eventForm.value.end_time || null
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
      ElMessage.success(eventForm.value.id ? '事件更新成功' : '事件添加成功')
      showDialog.value = false
      eventForm.value = { id: null, name: '', department: '', start_time: '', end_time: '' } // 清空表单
      await fetchEvents()
    } catch (error) {
      console.error('Error submitting event:', error)
      ElMessage.error(eventForm.value.id ? '事件更新失败' : '事件添加失败')
    }
  } else {
    ElMessage.error('请完整填写表单')
  }
}

const deleteEvent = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    ElMessage.success('事件删除成功')
    await fetchEvents()
  } catch (error) {
    console.error('Error deleting event:', error)
    ElMessage.error('事件删除失败')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '无效日期'
  const date = parseISO(dateString)
  if (isValid(date)) {
    return format(date, 'yyyy-MM-dd')
  }
  return '无效日期'
}

onMounted(async () => {
  await fetchEvents()
})
</script>

<style scoped>
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
}
</style>
