<template>
    <v-card>
    <el-row>
      <el-col :span="24" class="header">
        <el-button type="primary" @click="openDialog">添加事件</el-button>
      </el-col>
      <el-col :span="24">
        <el-table :data="events" style="width: 100%" size="large" border stripe>
          <el-table-column prop="name" label="事件名称" width="600"></el-table-column>
          <el-table-column prop="department" label="部门" width="200"></el-table-column>
          <el-table-column prop="start_time" label="开始时间" width="300">
            <template #default="{ row }">
              {{ formatDate(row.start_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="end_time" label="结束时间" width="300">
            <template #default="{ row }">
              {{ formatDate(row.end_time) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="openDialog(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteEvent(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>

      <el-dialog :title="dialogTitle" v-model="showDialog" width="50%">
        <el-form :model="eventForm" label-position="top" :rules="rules" ref="eventFormRef">
          <el-form-item label="事件名称" prop="name">
            <el-input v-model="eventForm.name"></el-input>
          </el-form-item>
          <el-form-item label="部门" prop="department">
            <el-input v-model="eventForm.department"></el-input>
          </el-form-item>
          <el-form-item label="开始时间" prop="start_time">
            <el-date-picker v-model="eventForm.start_time" type="date" placeholder="选择开始时间" value-format="YYYY-MM-DD"></el-date-picker>
          </el-form-item>
          <el-form-item label="结束时间" prop="end_time">
            <el-date-picker v-model="eventForm.end_time" type="date" placeholder="选择结束时间" value-format="YYYY-MM-DD"></el-date-picker>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="submitEvent">确认</el-button>
        </span>
      </el-dialog>
    </el-row>
</v-card>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { format, isValid, parseISO } from 'date-fns'
  
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
  
  const rules = {
    name: [
      { required: true, message: '请输入事件名称', trigger: 'blur' }
    ],
    department: [
      { required: true, message: '请输入部门', trigger: 'blur' }
    ],
    start_time: [
      { required: true, message: '请选择开始时间', trigger: 'change' }
    ],
    end_time: [
      { required: false, message: '请选择结束时间', trigger: 'change' }
    ]
  }
  
  const fetchEvents = async () => {
    try {
      const response = await fetch('http://10.227.122.217:8000/events')
      if (response.ok) {
        const data = await response.json()
        events.value = data.map(event => ({
          ...event,
          start_time: event.start_time.split('T')[0],  // 只保留日期部分
          end_time: event.end_time ? event.end_time.split('T')[0] : null  // 只保留日期部分
        }))
      } else {
        ElMessage.error('获取事件列表失败')
      }
    } catch (error) {
      console.error('Error:', error)
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
    eventFormRef.value.validate(async (valid) => {
      if (valid) {
        try {
          const method = eventForm.value.id ? 'PUT' : 'POST'
          const url = eventForm.value.id ? `http://10.227.122.217:8000/events/${eventForm.value.id}` : 'http://10.227.122.217:8000/events'
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
          if (response.ok) {
            ElMessage.success(eventForm.value.id ? '事件更新成功' : '事件添加成功')
            showDialog.value = false
            eventForm.value = { id: null, name: '', department: '', start_time: '', end_time: '' } // 清空表单
            await fetchEvents()
          } else {
            ElMessage.error(eventForm.value.id ? '事件更新失败' : '事件添加失败')
          }
        } catch (error) {
          console.error('Error:', error)
          ElMessage.error(eventForm.value.id ? '事件更新失败' : '事件添加失败')
        }
      } else {
        ElMessage.error('请完整填写表单')
      }
    })
  }
  
  const deleteEvent = async (id) => {
    try {
      const response = await fetch(`http://10.227.122.217:8000/events/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        ElMessage.success('事件删除成功')
        await fetchEvents()
      } else {
        ElMessage.error('事件删除失败')
      }
    } catch (error) {
      console.error('Error:', error)
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
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
  }
  
  .el-button {
    margin-bottom: 20px;
  }
  
  .el-dialog {
    max-width: 600px;
    width: 100%;
  }
  
  .dialog-footer {
    text-align: right;
  }
  
  .el-form-item {
    margin-bottom: 20px;
  }
  </style>