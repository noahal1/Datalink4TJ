<template>
  <unified-page-template
    title="维修管理"
    icon="mdi-wrench"
    color="primary"
  >
    <template #header-actions>
      <v-btn
        v-permission="'MAINT:READ'"
        color="info"
        variant="outlined"
        prepend-icon="mdi-file-document-multiple"
        class="me-2"
        to="/pr-management"
      >
        PR管理
      </v-btn>
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
        v-permission="'MAINT:WRITE'"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openTaskDialog"
      >
        添加任务
      </v-btn>
    </template>

    <v-row>
      <!-- 日历组件 -->
      <v-col
        cols="12"
        md="5"
        lg="4"
      >
        <maintenance-calendar 
          v-model:selected-date="selectedDate"
          v-model:selected-month="selectedMonth"
          :tasks="maintenanceTasks"
        />
      </v-col>

      <!-- 日任务列表组件 -->
      <v-col
        cols="12"
        md="7"
        lg="8"
      >
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
      <v-col
        cols="12"
        md="7"
      >
        <weekly-plan
          :tasks="weeklyTasks"
          @export="exportWeeklyPlan"
        />
      </v-col>
      
      <v-col
        cols="12"
        md="5"
      >
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
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useUserStore } from '../stores/user.js'
import Message from '../utils/notification'
import api from '../utils/api'
import MaintenanceCalendar from '../components/maintenance/MaintenanceCalendar.vue'
import DailyTasksList from '../components/maintenance/DailyTasksList.vue'
import WeeklyPlan from '../components/maintenance/WeeklyPlan.vue'
import IssuesList from '../components/maintenance/IssuesList.vue'
import TaskDialog from '../components/maintenance/TaskDialog.vue'
import IssueDialog from '../components/maintenance/IssueDialog.vue'
import MetricsList from '../components/maintenance/MetricsList.vue'
import MetricsDialog from '../components/maintenance/MetricsDialog.vue'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'

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
    const response = await api.get('/maint/daily', { 
      params: { user_id: userId }
    })
    
    maintenanceTasks.value = response.data
    
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
    const response = await api.get('/maint/metrics', { 
      params: { user_id: userId }
    })
    
    metricsList.value = response.data
    
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
    
    if (editedIndex.value === -1) {
      // 创建新任务
      await api.post('/maint/daily', taskData)
    } else {
      // 更新现有任务
      await api.put(`/maint/daily/${editedTask.value.id}`, taskData)
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
    await api.put(`/maint/daily/${task.id}`, updateData)
    
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
    await api.delete(`/maint/daily/${task.id}`)
    
    // 移除本地任务
    const index = maintenanceTasks.value.indexOf(task)
    if (index > -1) {
      maintenanceTasks.value.splice(index, 1)
    }
    
    Message.success('任务已删除')
    
    // 刷新任务列表
    await loadTasks()
    
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
    const response = await api.get('/maint/weekly', { 
      params: { user_id: userId }
    })
    
    issuesList.value = response.data.map(item => {
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
    const updateData = {
      solved_flag: issue.solved
    }
    
    // 发送请求
    await api.put(`/maint/weekly/${issue.id}`, updateData)
    
  } catch (error) {
    Message.error('更新状态失败')
    // 恢复原状态
    issue.solved = !issue.solved
  }
}

// 保存问题
const saveIssue = async () => {
  try {
    savingIssue.value = true
    
    // 验证表单
    if (!editedIssue.value.description || !editedIssue.value.date) {
      Message.warning('请填写所有必填字段')
      return
    }
    
    // 准备请求数据
    const issueData = {
      date: editedIssue.value.date,
      description: editedIssue.value.description,
      severity: editedIssue.value.severity,
      solved_flag: editedIssue.value.resolved,
      user_id: parseInt(userStore.userId)
    }
    
    let response
    
    if (!editedIssue.value.id) {
      // 创建新问题
      await api.post('/maint/weekly', issueData)
    } else {
      // 更新现有问题
      await api.put(`/maint/weekly/${editedIssue.value.id}`, issueData)
    }
    
    // 关闭对话框
    issueDialog.value = false
    
    // 重新加载数据
    await loadIssues()
    
    // 提示成功
    Message.success(editedIssue.value.id ? '问题记录更新成功' : '问题记录创建成功')
    
  } catch (error) {
    console.error('保存问题记录出错:', error)
    Message.error('保存问题记录失败')
  } finally {
    savingIssue.value = false
  }
}

// 删除问题
const deleteIssue = async (issue) => {
  try {
    // 发送请求
    await api.delete(`/maint/weekly/${issue.id}`)
    
    // 移除本地问题
    const index = issuesList.value.indexOf(issue)
    if (index > -1) {
      issuesList.value.splice(index, 1)
    }
    
    Message.success('问题记录已删除')
    
  } catch (error) {
    Message.error('删除问题记录失败')
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
    if (!editedMetric.value.equipment_type || !editedMetric.value.date) {
      Message.warning('请填写所有必填字段')
      return
    }
    
    // 准备请求数据
    const metricData = {
      equipment_type: editedMetric.value.equipment_type,
      date: editedMetric.value.date,
      downtime_count: parseInt(editedMetric.value.downtime_count),
      downtime_minutes: parseInt(editedMetric.value.downtime_minutes),
      parts_produced: parseInt(editedMetric.value.parts_produced),
      user_id: parseInt(userStore.userId)
    }
    
    if (editedMetricIndex.value === -1) {
      // 创建新指标
      await api.post('/maint/metrics', metricData)
    } else {
      // 更新现有指标
      await api.put(`/maint/metrics/${editedMetric.value.id}`, metricData)
    }
    
    // 关闭对话框
    metricDialog.value = false
    
    // 重新加载数据
    await loadMetrics()
    
    // 提示成功
    Message.success(editedMetricIndex.value === -1 ? '维修指标创建成功' : '维修指标更新成功')
    
  } catch (error) {
    console.error('保存维修指标出错:', error)
    Message.error('保存维修指标失败')
  } finally {
    savingMetric.value = false
  }
}

// 删除维修数据指标
const deleteMetric = async (metric) => {
  try {
    // 发送请求
    await api.delete(`/maint/metrics/${metric.id}`)
    
    // 移除本地指标
    const index = metricsList.value.indexOf(metric)
    if (index > -1) {
      metricsList.value.splice(index, 1)
    }
    
    Message.success('维修指标已删除')
    
  } catch (error) {
    Message.error('删除维修指标失败')
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