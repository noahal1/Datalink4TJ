<template>
  <v-container fluid>
    <!-- 操作栏 -->
    <v-row class="mb-3">
      <v-col cols="12">
        <v-card>
          <v-card-text class="d-flex justify-space-between align-center py-2">
            <div>
              <span class="text-h6">维修管理</span>
            </div>
            <div>
              <v-btn
                color="primary"
                variant="outlined"
                prepend-icon="mdi-chart-line"
                class="me-2"
                to="/maintenance/metrics"
              >
                查看维修指标
              </v-btn>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openTaskDialog"
                v-permission="'MAINT:WRITE'"
              >
                添加任务
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- 日历组件 -->
      <v-col cols="12" md="5" lg="4">
        <maintenance-calendar 
          v-model:selected-date="selectedDate"
          v-model:selected-month="selectedMonth"
          :tasks="maintenanceTasks"
        />
      </v-col>

      <!-- 日任务列表组件 -->
      <v-col cols="12" md="7" lg="8">
        <daily-tasks-list
          :tasks="selectedDayTasks"
          :loading="loadingTasks"
          :date="selectedDate"
          @add-task="openTaskDialog"
          @edit-task="editTask"
          @delete-task="deleteTask"
          @update-status="updateTaskStatus"
        />
      </v-col>
    </v-row>
    
    <!-- 周计划和问题记录 -->
    <v-row class="mt-6 match-height">
      <v-col cols="12" md="7">
        <weekly-plan
          :tasks="weeklyTasks"
          @export="exportWeeklyPlan"
        />
      </v-col>
      
      <v-col cols="12" md="5">
        <issues-list
          :issues="issuesList"
          :loading="loadingIssues"
          @add-issue="openIssueDialog()"
          @edit-issue="openIssueDialog"
          @delete-issue="deleteIssue"
          @toggle-status="toggleIssueStatus"
        />
      </v-col>
    </v-row>
    
    <!-- 任务对话框 -->
    <task-dialog
      v-model="taskDialog"
      v-model:task="editedTask"
      :is-new="editedIndex === -1"
      :loading="savingTask"
      @save="saveTask"
      @close="closeTaskDialog"
    />
    
    <!-- 问题对话框 -->
    <issue-dialog
      v-model="issueDialog"
      v-model:issue="editedIssue"
      :loading="savingIssue"
      @save="saveIssue"
      @close="closeIssueDialog"
    />
    
    <!-- 维修数据指标对话框 -->
    <metrics-dialog
      v-model="metricDialog"
      v-model:metric="editedMetric"
      :is-new="editedMetricIndex === -1"
      :loading="savingMetric"
      @save="saveMetric"
      @close="closeMetricDialog"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useUserStore } from '../stores/user.js'
import Message from '../utils/notification'
import MaintenanceCalendar from '../components/maintenance/MaintenanceCalendar.vue'
import DailyTasksList from '../components/maintenance/DailyTasksList.vue'
import WeeklyPlan from '../components/maintenance/WeeklyPlan.vue'
import IssuesList from '../components/maintenance/IssuesList.vue'
import TaskDialog from '../components/maintenance/TaskDialog.vue'
import IssueDialog from '../components/maintenance/IssueDialog.vue'
import MetricsList from '../components/maintenance/MetricsList.vue'
import MetricsDialog from '../components/maintenance/MetricsDialog.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const userStore = useUserStore()

// 日历选择相关数据
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedDate = ref(new Date().toISOString().split('T')[0]) // 默认今天
const loadingTasks = ref(false)
const savingTask = ref(false)

// 维修任务相关数据
const maintenanceTasks = ref([])
const weeklyTasks = ref([])
const selectedDayTasks = computed(() => {
  if (!selectedDate.value) return []
  return maintenanceTasks.value.filter(task => task.date === selectedDate.value)
})
const issuesList = ref([])

// 对话框相关
const taskDialog = ref(false)
const issueDialog = ref(false)
const metricDialog = ref(false)

// 维修指标相关数据
const metricsList = ref([])
const loadingMetrics = ref(false)
const savingMetric = ref(false)
const editedMetricIndex = ref(-1)
const editedMetric = ref({
  id: null,
  equipment_type: '',
  date: '',
  downtime_count: 0,
  downtime_minutes: 0,
  parts_produced: 0,
  user_id: null
})

// 编辑状态
const editedIndex = ref(-1)
const editedTask = ref({
  id: null,
  title: '',
  wheres: '',
  date: '',
  type: 1,
  content_daily: '',
  solved: false
})

// 问题记录相关数据
const loadingIssues = ref(false)
const savingIssue = ref(false)

const editedIssue = ref({
  id: null,
  date: '',
  description: '',
  severity: '中等',
  resolved: false,
  user_id: userStore.userId
})

// 加载所有维修任务
const loadTasks = async () => {
  try {
    loadingTasks.value = true
    
    // 确保user_id是整数类型
    const userId = parseInt(userStore.userId);
    const response = await fetch(`${API_BASE_URL}/maint/daily?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('获取维修任务失败')
    }
    
    const data = await response.json()
    maintenanceTasks.value = data
    
    // 加载本周任务
    loadWeeklyTasks()
    
  } catch (error) {
    Message.error('加载任务失败')
  } finally {
    loadingTasks.value = false
  }
}

// 加载维修数据指标
const loadMetrics = async () => {
  try {
    loadingMetrics.value = true
    
    // 确保user_id是整数类型
    const userId = parseInt(userStore.userId);
    const response = await fetch(`${API_BASE_URL}/maint/metrics?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('获取维修数据指标失败')
    }
    
    const data = await response.json()
    metricsList.value = data
    
  } catch (error) {
    console.error('加载维修数据指标出错:', error)
    Message.error('加载维修数据指标失败')
  } finally {
    loadingMetrics.value = false
  }
}

// 加载本周任务
const loadWeeklyTasks = () => {
  // 获取本周的开始和结束日期
  const now = new Date()
  const dayOfWeek = now.getDay() // 0-6, 0是星期日
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - dayOfWeek) // 调整到本周日
  
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6) // 本周六
  
  const formatDateStr = (date) => {
    return date.toISOString().split('T')[0]
  }
  
  const startDateStr = formatDateStr(startDate)
  const endDateStr = formatDateStr(endDate)
  
  // 筛选本周任务和未完成的历史任务
  weeklyTasks.value = maintenanceTasks.value.filter(task => {
    // 本周任务
    const isThisWeek = task.date >= startDateStr && task.date <= endDateStr
    
    // 未完成的历史任务
    const isUnsolvedPast = !task.solved && task.date < startDateStr
    
    return isThisWeek || isUnsolvedPast
  })
  
  // 按日期排序
  weeklyTasks.value.sort((a, b) => {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    return 0
  })
}

// 批量加载任务和问题记录
const loadAllData = async () => {
  await Promise.all([
    loadTasks(),
    loadIssues(),
    loadMetrics()
  ])
}

// 保存任务
const saveTask = async () => {
  try {
    savingTask.value = true
    
    // 验证表单
    if (!editedTask.value.title || !editedTask.value.wheres || !editedTask.value.content_daily) {
      Message.warning('请填写所有必填字段')
      return
    }
    
    // 准备请求数据
    const taskData = {
      title: editedTask.value.title,
      wheres: editedTask.value.wheres,
      date: editedTask.value.date,
      type: parseInt(editedTask.value.type),
      content_daily: editedTask.value.content_daily,
      solved: editedTask.value.solved,
      user_id: parseInt(userStore.userId)
    }
    
    let response
    
    if (editedIndex.value === -1) {
      // 创建新任务
      response = await fetch(`${API_BASE_URL}/maint/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(taskData)
      })
    } else {
      // 更新现有任务
      response = await fetch(`${API_BASE_URL}/maint/daily/${editedTask.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(taskData)
      })
    }
    
    if (!response.ok) {
      throw new Error('保存任务失败')
    }
    
    // 关闭对话框
    taskDialog.value = false
    
    // 重新加载数据
    await loadAllData()
    
    // 提示成功
    Message.success(editedIndex.value === -1 ? '任务创建成功' : '任务更新成功')
    
  } catch (error) {
    console.error('保存任务出错:', error)
    Message.error('保存任务失败')
  } finally {
    savingTask.value = false
  }
}

// 更新任务状态
const updateTaskStatus = async (task) => {
  try {
    // 准备更新数据
    const updateData = {
      solved: task.solved
    }
    
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/maint/daily/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
      },
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      throw new Error('更新任务状态失败')
    }
    
    // 重新加载数据以保持同步
    await loadAllData()
    
  } catch (error) {
    Message.error('更新状态失败')
    // 恢复原状态
    task.solved = !task.solved
  }
}

// 删除任务
const deleteTask = async (task) => {
  try {
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/maint/daily/${task.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('删除任务失败')
    }
    
    // 重新加载数据
    await loadAllData()
    
    // 提示成功
    Message.success('任务删除成功')
    
  } catch (error) {
    Message.error('删除任务失败')
  }
}

// 导出周计划
const exportWeeklyPlan = () => {
  // 创建一个临时的表格内容
  let tableContent = 'data:text/csv;charset=utf-8,日期,设备,工作内容,类型,状态\n'
  
  weeklyTasks.value.forEach(task => {
    const status = task.solved ? '已完成' : '待完成'
    const taskType = getTaskTypeLabel(task.type)
    const row = `${task.date},${task.wheres},${task.content_daily},${taskType},${status}`
    tableContent += row + '\n'
  })
  
  // 创建一个下载链接
  const encodedUri = encodeURI(tableContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', '维修周计划.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 获取任务类型标签
const getTaskTypeLabel = (typeId) => {
  const taskTypes = [
    { value: 1, label: '定期维护' },
    { value: 2, label: '设备调试' },
    { value: 3, label: '故障维修' },
    { value: 4, label: '备件更换' },
    { value: 5, label: '预防性维护' }
  ]
  const type = taskTypes.find(t => t.value === parseInt(typeId))
  return type ? type.label : '未知类型'
}

// 加载问题记录
const loadIssues = async () => {
  try {
    loadingIssues.value = true
    
    // 确保user_id是整数类型
    const userId = parseInt(userStore.userId);
    const response = await fetch(`${API_BASE_URL}/maint/weekly?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('获取问题记录失败')
    }
    
    const data = await response.json()
    
    issuesList.value = data.map(item => {
      // 解析resolved字段 - 简化并提高性能
      const solvedFlag = item.solved_flag !== undefined ? item.solved_flag : 
                        (item.solved !== undefined ? item.solved : 
                        (item.isSolved !== undefined ? item.isSolved : 0));
      
      return {
        id: item.id,
        date: item.DateTime || item.date_time || item.date,
        description: item.content || item.description || item.title,
        severity: item.degree || item.severity || '中等',
        resolved: solvedFlag === 1 || solvedFlag === true,
        user_id: item.user_id
      }
    })
  } catch (error) {
    console.error('加载问题记录出错:', error)
    Message.error('加载问题记录失败')
  } finally {
    loadingIssues.value = false
  }
}

// 切换问题解决状态
const toggleIssueStatus = async (issue) => {
  try {
    // 先在本地更新状态以提高响应速度
    const originalStatus = issue.resolved
    issue.resolved = !issue.resolved
    
    // 准备更新数据 - 包含所有可能的字段名以兼容后端API
    const updateData = {
      solved_flag: issue.resolved ? 1 : 0,
      solved: issue.resolved ? 1 : 0,
      isSolved: issue.resolved ? 1 : 0
    }
    
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/maint/weekly/${issue.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
      },
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      // 如果请求失败，恢复原始状态
      issue.resolved = originalStatus
      throw new Error('更新问题状态失败')
    }
    
    // 提示成功
    Message.success(issue.resolved ? '问题已标记为已解决' : '问题已标记为未解决')
    
    // 重新加载数据以确保前端显示与后端一致
    await loadIssues()
    
  } catch (error) {
    console.error('更新问题状态出错:', error)
    Message.error('更新问题状态失败')
  }
}

// 保存问题
const saveIssue = async () => {
  try {
    savingIssue.value = true
    
    // 准备保存数据 - 完全匹配后端API期望的字段
    const issueData = {
      DateTime: editedIssue.value.date || new Date().toISOString().split('T')[0],
      user_id: parseInt(userStore.userId),
      title: editedIssue.value.description.substring(0, 30),
      wheres: '问题记录',
      content: editedIssue.value.description,
      degree: editedIssue.value.severity,
      solved_flag: editedIssue.value.resolved ? 1 : 0,
      solved: editedIssue.value.resolved ? 1 : 0
    }
    
    let response
    
    if (!editedIssue.value.id) {
      // 创建新问题
      response = await fetch(`${API_BASE_URL}/maint/weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(issueData)
      })
    } else {
      // 更新现有问题
      response = await fetch(`${API_BASE_URL}/maint/weekly/${editedIssue.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(issueData)
      })
    }
    
    if (!response.ok) {
      throw new Error('保存问题失败')
    }
    
    // 关闭对话框
    issueDialog.value = false
    
    // 重新加载数据
    await loadIssues()
    
    // 提示成功
    Message.success(editedIssue.value.id ? '问题更新成功' : '问题记录成功')
    
  } catch (error) {
    console.error('保存问题出错:', error)
    Message.error('保存问题失败')
  } finally {
    savingIssue.value = false
  }
}

// 删除问题
const deleteIssue = async (issue) => {
  try {
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/maint/weekly/${issue.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('删除问题失败')
    }
    
    // 重新加载数据
    await loadIssues()
    
    // 提示成功
    Message.success('问题删除成功')
    
  } catch (error) {
    console.error('删除问题出错:', error)
    Message.error('删除问题失败')
  }
}

// 打开任务对话框
const openTaskDialog = () => {
  editedIndex.value = -1
  editedTask.value = {
    id: null,
    title: '',
    wheres: '',
    date: selectedDate.value,
    type: 1,
    content_daily: '',
    solved: false
  }
  taskDialog.value = true
}

// 关闭任务对话框
const closeTaskDialog = () => {
  taskDialog.value = false
}

// 编辑任务
const editTask = (task) => {
  editedIndex.value = maintenanceTasks.value.indexOf(task)
  editedTask.value = { ...task }
  taskDialog.value = true
}

// 打开问题对话框
const openIssueDialog = (issue = null) => {
  if (issue) {
    // 编辑现有问题
    editedIssue.value = { ...issue }
  } else {
    // 创建新问题
    editedIssue.value = {
      id: null,
      date: selectedDate.value,
      description: '',
      severity: '中等',
      resolved: false,
      user_id: parseInt(userStore.userId)
    }
  }
  issueDialog.value = true
}

// 关闭问题对话框
const closeIssueDialog = () => {
  issueDialog.value = false
}

// 打开维修数据指标对话框
const openMetricDialog = (metric = null) => {
  if (metric) {
    // 编辑现有指标
    editedMetricIndex.value = metricsList.value.indexOf(metric)
    editedMetric.value = { ...metric }
  } else {
    // 创建新指标
    editedMetricIndex.value = -1
    editedMetric.value = {
      id: null,
      equipment_type: '',
      date: selectedDate.value,
      downtime_count: 0,
      downtime_minutes: 0,
      parts_produced: 0,
      user_id: parseInt(userStore.userId)
    }
  }
  metricDialog.value = true
}

// 关闭维修数据指标对话框
const closeMetricDialog = () => {
  metricDialog.value = false
}

// 编辑维修数据指标
const editMetric = (metric) => {
  openMetricDialog(metric)
}

// 保存维修数据指标
const saveMetric = async () => {
  try {
    savingMetric.value = true
    
    // 验证表单
    if (!editedMetric.value.equipment_type) {
      Message.warning('请选择设备类型')
      return
    }
    
    // 准备请求数据
    const metricData = {
      equipment_type: editedMetric.value.equipment_type,
      date: editedMetric.value.date,
      downtime_count: parseInt(editedMetric.value.downtime_count),
      downtime_minutes: parseFloat(editedMetric.value.downtime_minutes),
      parts_produced: parseInt(editedMetric.value.parts_produced),
      user_id: parseInt(userStore.userId)
    }
    
    let response
    
    if (editedMetricIndex.value === -1) {
      // 创建新指标
      response = await fetch(`${API_BASE_URL}/maint/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(metricData)
      })
    } else {
      // 更新现有指标
      response = await fetch(`${API_BASE_URL}/maint/metrics/${editedMetric.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(metricData)
      })
    }
    
    if (!response.ok) {
      throw new Error('保存维修数据指标失败')
    }
    
    // 关闭对话框
    metricDialog.value = false
    
    // 重新加载数据
    await loadMetrics()
    
    // 提示成功
    Message.success(editedMetricIndex.value === -1 ? '指标创建成功' : '指标更新成功')
    
  } catch (error) {
    console.error('保存维修数据指标出错:', error)
    Message.error('保存维修数据指标失败')
  } finally {
    savingMetric.value = false
  }
}

// 删除维修数据指标
const deleteMetric = async (metric) => {
  try {
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/maint/metrics/${metric.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('删除维修数据指标失败')
    }
    
    // 重新加载数据
    await loadMetrics()
    
    // 提示成功
    Message.success('维修数据指标删除成功')
    
  } catch (error) {
    console.error('删除维修数据指标出错:', error)
    Message.error('删除维修数据指标失败')
  }
}

// 生命周期钩子
onMounted(() => {
  loadAllData()
})

// 监听日期变化
watch(selectedDate, () => {
  // 使用计算属性自动更新，不需要任何操作
})

// 监听月份变化
watch(selectedMonth, () => {
  // 如果当前选中的日期不在新月份内，重置为新月份的第一天
  const dateParts = selectedDate.value.split('-')
  if (dateParts.length === 3) {
    const currentMonth = parseInt(dateParts[1])
    if (currentMonth !== selectedMonth.value) {
      const year = new Date().getFullYear()
      selectedDate.value = `${year}-${selectedMonth.value.toString().padStart(2, '0')}-01`
    }
  }
})
</script>

<style scoped>
.match-height .v-col {
  display: flex;
  flex-direction: column;
}

.match-height .v-card {
  flex: 1;
}

.maintenance-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s;
}

.maintenance-card:hover:not([disabled]) {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.v-card__actions {
  margin-top: auto;
}
</style>