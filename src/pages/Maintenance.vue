<template>
  <v-container fluid>
    <h2 class="text-h5 mb-4 font-weight-bold d-flex align-center">
      <v-icon class="mr-2">mdi-wrench</v-icon>
      维修个人日常管理
    </h2>

    <v-row>
      <v-col cols="12" md="5" lg="4">
        <v-card class="elevation-2" style="height: 100%;">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-calendar</v-icon>
            设备维修日历
          </v-card-title>
          <v-card-text>
            <v-sheet class="mb-4">
              <v-select
                v-model="selectedMonth"
                :items="months"
                label="选择月份"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-4"
              ></v-select>
              
              <v-sheet class="d-flex flex-wrap justify-center">
                <v-btn
                  v-for="day in daysInMonth"
                  :key="day"
                  :color="isSelectedDay(day) ? 'primary' : ''"
                  :variant="isSelectedDay(day) ? 'flat' : 'text'"
                  class="ma-1"
                  size="small"
                  width="36"
                  height="36"
                  @click="selectDay(day)"
                >
                  {{ day }}
                </v-btn>
              </v-sheet>
            </v-sheet>
            
            <v-sheet class="mt-4 d-flex justify-space-between align-center">
              <div>
                <span class="text-subtitle-1">MTTR: </span>
                <span class="text-h6 font-weight-bold">3.2</span>
                <span class="text-caption ml-1">小时/次</span>
              </div>
              <div>
                <span class="text-subtitle-1">MTBF: </span>
                <span class="text-h6 font-weight-bold">278.5</span>
                <span class="text-caption ml-1">小时</span>
              </div>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 右侧日工作统计 -->
      <v-col cols="12" md="7" lg="8">
        <v-card class="elevation-2 maintenance-card h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clipboard-text</v-icon>
            {{ formatDate(selectedDate) }} 维修工作
            <v-spacer></v-spacer>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openTaskDialog" size="small">
              添加工作
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text v-if="selectedDayTasks.length > 0" class="pt-4">
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 font-weight-medium">今日工作完成情况</div>
                <v-progress-linear
                  :model-value="completionRate"
                  color="success"
                  height="20"
                  class="mt-2"
                >
                  <template v-slot:default>
                    <span class="text-white">{{ completionRate }}%</span>
                  </template>
                </v-progress-linear>
              </v-col>
              <v-col cols="12" md="6">
                <div class="d-flex justify-space-between">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ selectedDayTasks.length }}</div>
                    <div class="text-subtitle-2">总任务</div>
                  </div>
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold">{{ completedTasks }}</div>
                    <div class="text-subtitle-2">已完成</div>
                  </div>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-4"></v-divider>
            
            <!-- 当日任务列表 -->
            <div class="text-subtitle-1 font-weight-medium mb-3">详细工作项目</div>
            <v-list>
              <v-list-item
                v-for="(task, index) in selectedDayTasks"
                :key="index"
                :title="task.title"
                :subtitle="task.equipment + ' | ' + task.duration + '小时'"
                lines="two"
              >
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="task.completed"
                    color="success"
                    hide-details
                    @change="updateTask(task)"
                  ></v-checkbox>
                </template>
                
                <template v-slot:append>
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        icon="mdi-dots-vertical"
                        variant="text"
                        size="small"
                        v-bind="props"
                      ></v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item @click="editTask(task)">
                        <template v-slot:prepend>
                          <v-icon size="small">mdi-pencil</v-icon>
                        </template>
                        <v-list-item-title>编辑</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="deleteTask(task)">
                        <template v-slot:prepend>
                          <v-icon size="small">mdi-delete</v-icon>
                        </template>
                        <v-list-item-title>删除</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
                
                <template v-slot:subtitle>
                  <div class="d-flex align-center">
                    <v-chip
                      size="x-small"
                      :color="getTaskTypeColor(task.type)"
                      class="mr-2"
                    >
                      {{ task.type }}
                    </v-chip>
                    {{ task.equipment }} | {{ task.duration }}小时
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          
          <v-card-text v-else class="text-center pt-8 pb-8">
            <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank-outline</v-icon>
            <div class="text-h6 text-grey mt-4">今日暂无维修任务</div>
            <v-btn color="primary" prepend-icon="mdi-plus" class="mt-4" @click="openTaskDialog">
              添加工作
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 周计划和问题记录 -->
    <v-row class="mt-6">
      <!-- 周计划 -->
      <v-col cols="12" lg="7">
        <v-card class="elevation-2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-calendar-week</v-icon>
            本周维修计划
            <v-spacer></v-spacer>
            <v-btn color="primary" size="small" prepend-icon="mdi-calendar-export">
              导出计划
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>设备</th>
                  <th>工作内容</th>
                  <th>类型</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(task, index) in weekTasks" :key="index">
                  <td>{{ formatDate(task.date) }}</td>
                  <td>{{ task.equipment }}</td>
                  <td>{{ task.title }}</td>
                  <td>
                    <v-chip
                      size="x-small"
                      :color="getTaskTypeColor(task.type)"
                    >
                      {{ task.type }}
                    </v-chip>
                  </td>
                  <td>
                    <v-chip
                      size="x-small"
                      :color="task.completed ? 'success' : 'warning'"
                    >
                      {{ task.completed ? '已完成' : '进行中' }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- 问题记录 -->
      <v-col cols="12" lg="5">
        <v-card class="elevation-2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            本周问题记录
            <v-spacer></v-spacer>
            <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openIssueDialog">
              记录问题
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="(issue, index) in weeklyIssues"
                :key="index"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="issue.severity === '严重' ? 'error' : (issue.severity === '中等' ? 'warning' : 'info')"
                    size="36"
                  >
                    <v-icon color="white">mdi-alert-circle</v-icon>
                  </v-avatar>
                </template>
                
                <v-list-item-title>
                  {{ issue.title }}
                  <v-chip
                    size="x-small"
                    :color="issue.resolved ? 'success' : 'error'"
                    class="ml-2"
                  >
                    {{ issue.resolved ? '已解决' : '未解决' }}
                  </v-chip>
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  {{ issue.equipment }} | {{ formatDate(issue.date) }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn
                    icon="mdi-check"
                    variant="text"
                    color="success"
                    size="small"
                    v-if="!issue.resolved"
                    @click="resolveIssue(issue)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- 任务添加/编辑对话框 -->
    <v-dialog v-model="taskDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editedIndex > -1 ? '编辑维修工作' : '添加新维修工作' }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="taskForm" @submit.prevent="saveTask">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedTask.title"
                  label="工作标题"
                  :rules="[v => !!v || '标题不能为空']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedTask.equipment"
                  label="设备名称"
                  :rules="[v => !!v || '设备名称不能为空']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedTask.type"
                  :items="taskTypes"
                  label="工作类型"
                  :rules="[v => !!v || '必须选择类型']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedTask.date"
                  label="日期"
                  type="date"
                  :rules="[v => !!v || '日期不能为空']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedTask.description"
                  label="工作描述"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeTaskDialog">取消</v-btn>
          <v-btn color="primary" @click="saveTask" :loading="submitting">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 问题记录对话框 -->
    <v-dialog v-model="issueDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">记录设备问题</span>
        </v-card-title>
        
        <v-card-text>
          <v-form ref="issueForm" @submit.prevent="saveIssue">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedIssue.title"
                  label="问题标题"
                  :rules="[v => !!v || '标题不能为空']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedIssue.equipment"
                  label="设备名称"
                  :rules="[v => !!v || '设备名称不能为空']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedIssue.date"
                  label="日期"
                  type="date"
                  :rules="[v => !!v || '日期不能为空']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedIssue.severity"
                  :items="['严重', '中等', '轻微']"
                  label="严重程度"
                  :rules="[v => !!v || '必须选择严重程度']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedIssue.resolved"
                  color="success"
                  label="已解决"
                  hide-details
                ></v-switch>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedIssue.description"
                  label="问题描述"
                  rows="3"
                  :rules="[v => !!v || '问题描述不能为空']"
                  required
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeIssueDialog">取消</v-btn>
          <v-btn color="primary" @click="saveIssue" :loading="submitting">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// 日期和任务数据
const selectedDate = ref(new Date().toISOString().substr(0, 10))
const maintenanceTasks = ref([])
const weeklyIssues = ref([])

// 月份选择
const selectedMonth = ref(new Date().getMonth() + 1)
const months = [
  { title: '1月', value: 1 },
  { title: '2月', value: 2 },
  { title: '3月', value: 3 },
  { title: '4月', value: 4 },
  { title: '5月', value: 5 },
  { title: '6月', value: 6 },
  { title: '7月', value: 7 },
  { title: '8月', value: 8 },
  { title: '9月', value: 9 },
  { title: '10月', value: 10 },
  { title: '11月', value: 11 },
  { title: '12月', value: 12 }
]

// 计算当月天数
const daysInMonth = computed(() => {
  const year = new Date().getFullYear()
  return new Date(year, selectedMonth.value, 0).getDate()
})

// 判断是否是选中的日期
const isSelectedDay = (day) => {
  const date = new Date(selectedDate.value)
  return date.getDate() === day && (date.getMonth() + 1) === selectedMonth.value
}

// 选择日期
const selectDay = (day) => {
  const dateParts = selectedDate.value.split('-')
  const year = dateParts[0]
  const month = String(selectedMonth.value).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  selectedDate.value = `${year}-${month}-${dayStr}`
  loadDayTasks()
}

// 对话框状态
const taskDialog = ref(false)
const issueDialog = ref(false)
const submitting = ref(false)

// 任务表单
const taskForm = ref(null)
const issueForm = ref(null)
const editedIndex = ref(-1)

// 任务类型
const taskTypes = ['定期维护', '设备调试', '故障维修', '备件更换', '预防性维护']
// 默认任务和问题
const defaultTask = {
  title: '',
  equipment: '',
  type: '定期维护',
  date: new Date().toISOString().substr(0, 10),
  description: '',
  duration: 1,
  completed: false,
  status: '计划中'
}
const defaultIssue = {
  title: '',
  equipment: '',
  date: new Date().toISOString().substr(0, 10),
  description: '',
  severity: '中等',
  resolved: false
}

const editedTask = ref({ ...defaultTask })
const editedIssue = ref({ ...defaultIssue })
const selectedDayTasks = computed(() => {
  return maintenanceTasks.value.filter(task => task.date === selectedDate.value)
})

const weekTasks = computed(() => {
  const now = new Date(selectedDate.value)
  const dayOfWeek = now.getDay()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)) // 本周一
  
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6) // 本周日
  
  return maintenanceTasks.value.filter(task => {
    const taskDate = new Date(task.date)
    return taskDate >= startDate && taskDate <= endDate
  }).sort((a, b) => new Date(a.date) - new Date(b.date))
})

const completedTasks = computed(() => {
  return selectedDayTasks.value.filter(task => task.completed).length
})

const completionRate = computed(() => {
  if (selectedDayTasks.value.length === 0) return 0
  return Math.round((completedTasks.value / selectedDayTasks.value.length) * 100)
})

// 方法
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const getTaskTypeColor = (type) => {
  switch (type) {
    case '定期维护':
      return 'primary'
    case '设备调试':
      return 'info'
    case '故障维修':
      return 'error'
    case '备件更换':
      return 'warning'
    case '预防性维护':
      return 'success'
    default:
      return 'grey'
  }
}

const loadDayTasks = () => {
  // 在真实应用中，这里会从API加载数据
  // 这里使用示例数据进行模拟
  console.log(`加载 ${selectedDate.value} 的任务`)
}

const resolveIssue = (issue) => {
  issue.resolved = true
  ElMessage.success(`问题"${issue.title}"已标记为已解决`)
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const openTaskDialog = () => {
  editedIndex.value = -1
  editedTask.value = {
    ...defaultTask,
    date: selectedDate.value
  }
  taskDialog.value = true
  setTimeout(() => {
    if (taskForm.value) taskForm.value.resetValidation()
  }, 50)
}

const closeTaskDialog = () => {
  taskDialog.value = false
}

const saveTask = () => {
  if (editedIndex.value > -1) {
    // 更新现有任务
    Object.assign(maintenanceTasks.value[editedIndex.value], editedTask.value)
    ElMessage.success('维修工作已更新')
  } else {
    // 添加新任务
    maintenanceTasks.value.push({ ...editedTask.value })
    ElMessage.success('新维修工作已添加')
  }
  closeTaskDialog()
}

const editTask = (task) => {
  editedIndex.value = maintenanceTasks.value.indexOf(task)
  editedTask.value = { ...task }
  taskDialog.value = true
  setTimeout(() => {
    if (taskForm.value) taskForm.value.resetValidation()
  }, 50)
}

const deleteTask = (task) => {
  const index = maintenanceTasks.value.indexOf(task)
  if (confirm('确定要删除这个维修工作吗?')) {
    maintenanceTasks.value.splice(index, 1)
    ElMessage.info('维修工作已删除')
  }
}

const updateTask = (task) => {
  // 这里可以添加调用API的逻辑，更新任务状态
  const index = maintenanceTasks.value.findIndex(t => t === task)
  if (index > -1) {
    maintenanceTasks.value[index].status = task.completed ? '已完成' : '进行中'
  }
}

const openIssueDialog = () => {
  editedIssue.value = {
    ...defaultIssue,
    date: selectedDate.value
  }
  issueDialog.value = true
  setTimeout(() => {
    if (issueForm.value) issueForm.value.resetValidation()
  }, 50)
}

const closeIssueDialog = () => {
  issueDialog.value = false
}

const saveIssue = () => {
  weeklyIssues.value.push({ ...editedIssue.value })
  ElMessage.success('问题已记录')
  closeIssueDialog()
}

// 生命周期钩子
onMounted(() => {
  // 加载示例数据
  maintenanceTasks.value = [
    {
      title: 'test',
      equipment: '线体1',
      type: '定期维护',
      date: new Date().toISOString().substr(0, 10),
      description: '更换部件',
      duration: 2,
      completed: false,
      status: '计划中'
    }
  ]
  
  weeklyIssues.value = [
    {
      title: '线体2停机故障',
      equipment: '线体2',
      date: addDays(new Date(), -2).toISOString().substr(0, 10),
      description: '线体停机',
      severity: '严重',
      resolved: true
    }
  ]
})

// 监听日期变化
watch(selectedDate, () => {
  loadDayTasks()
})
</script>

<style scoped>
.maintenance-card {
  display: flex;
  flex-direction: column;
}

.h-100 {
  height: 100%;
}

.match-height .v-col {
  display: flex;
  flex-direction: column;
}

.match-height .v-card {
  flex: 1;
}

.v-list-item__prepend {
  align-self: center;
}

.w-100 {
  width: 100%;
}
</style>