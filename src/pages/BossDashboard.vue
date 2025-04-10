<template>
  <div class="boss-dashboard">
    <div class="boss-dashboard-header">
      <h1>团队工作看板</h1>
      <div class="filter-controls">
        <el-select v-model="currentWeek" placeholder="选择周次" @change="loadData">
          <el-option 
            v-for="week in weekOptions" 
            :key="week.value" 
            :label="week.label" 
            :value="week.value">
          </el-option>
        </el-select>
        <el-select v-model="selectedDepartment" placeholder="选择部门" @change="filterData">
          <el-option 
            v-for="dept in departments" 
            :key="dept" 
            :label="dept" 
            :value="dept">
          </el-option>
        </el-select>
      </div>
    </div>

    <!-- 加载状态指示器 -->
    <el-card v-if="loading" class="loading-card">
      <el-skeleton :rows="6" animated />
    </el-card>

    <div v-else>
      <div class="dashboard-summary">
        <div class="summary-card">
          <div class="card-value">{{ completedTasks }}</div>
          <div class="card-label">已完成任务</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ inProgressTasks }}</div>
          <div class="card-label">进行中任务</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ blockedTasks }}</div>
          <div class="card-label">阻塞任务</div>
        </div>
      </div>

      <div class="team-overview">
        <el-table
          :data="filteredEmployeeData"
          style="width: 100%"
          :default-sort="{ prop: 'completionRate', order: 'descending' }"
          v-loading="tableLoading"
        >
          <el-table-column prop="name" label="员工" width="120">
            <template #default="scope">
              <div class="employee-info">
                <el-avatar :size="32" :src="scope.row.avatar"></el-avatar>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="department" label="部门" width="120"></el-table-column>
          <el-table-column prop="completedTasks" label="已完成" width="80" sortable></el-table-column>
          <el-table-column prop="inProgressTasks" label="进行中" width="80" sortable></el-table-column>
          <el-table-column prop="blockedTasks" label="阻塞" width="80" sortable></el-table-column>
          <el-table-column prop="completionRate" label="完成率" width="100" sortable>
            <template #default="scope">
              <el-progress :percentage="scope.row.completionRate" :status="getProgressStatus(scope.row.completionRate)"></el-progress>
            </template>
          </el-table-column>
          <el-table-column label="详情">
            <template #default="scope">
              <el-button type="text" @click="showEmployeeDetails(scope.row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="`${selectedEmployee.name} 的工作详情`"
      direction="rtl"
      size="50%"
    >
      <div v-if="detailsLoading" class="drawer-loading">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="selectedEmployee.tasks" class="task-list">
        <div v-for="(task, index) in selectedEmployee.tasks" :key="index" class="task-item">
          <div class="task-header">
            <span class="task-title">{{ task.title }}</span>
            <el-tag :type="getTaskStatusType(task.status)">{{ getTaskStatusText(task.status) }}</el-tag>
          </div>
          <div class="task-desc">{{ task.description }}</div>
          <div class="task-footer">
            <span>计划完成: {{ task.plannedEndDate }}</span>
            <span v-if="task.completedDate">实际完成: {{ task.completedDate }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'BossDashboard',
  data() {
    return {
      currentWeek: '',
      selectedDepartment: '',
      drawerVisible: false,
      selectedEmployee: {},
      employeeData: [],
      loading: false,
      tableLoading: false,
      detailsLoading: false,
      error: null,
      weekOptions: [],
      departments: [],
      useBackend: true // 控制是否使用后端API还是模拟数据
    }
  },
  computed: {
    filteredEmployeeData() {
      if (!this.selectedDepartment) {
        return this.employeeData;
      }
      return this.employeeData.filter(emp => emp.department === this.selectedDepartment);
    },
    completedTasks() {
      return this.filteredEmployeeData.reduce((sum, emp) => sum + emp.completedTasks, 0);
    },
    inProgressTasks() {
      return this.filteredEmployeeData.reduce((sum, emp) => sum + emp.inProgressTasks, 0);
    },
    blockedTasks() {
      return this.filteredEmployeeData.reduce((sum, emp) => sum + emp.blockedTasks, 0);
    }
  },
  async created() {
    this.loading = true;
    try {
      // 获取周次选项
      await this.loadWeekOptions();
      // 获取部门列表
      await this.loadDepartments();
      // 设置默认选择当前周
      this.currentWeek = this.weekOptions.length > 0 ? this.weekOptions[0].value : '';
      // 加载数据
      await this.loadData();
    } catch (error) {
      console.error('初始化数据失败:', error);
      ElMessage.error('初始化数据失败，请稍后重试');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async loadWeekOptions() {
      if (!this.useBackend) {
        // 使用模拟数据
        this.weekOptions = [
          { label: '本周 (第18周)', value: '18-2023' },
          { label: '上周 (第17周)', value: '17-2023' },
          { label: '第16周', value: '16-2023' }
        ];
        return;
      }
      
      try {
        // 从后端获取周次选项
        const response = await axios.get('/api/weekly-report/weeks');
        this.weekOptions = response.data.weeks;
      } catch (error) {
        console.error('获取周次选项失败:', error);
        ElMessage.warning('获取周次选项失败，使用默认数据');
        // 使用默认周次
        this.weekOptions = [
          { label: '本周', value: 'current' },
          { label: '上周', value: 'last' }
        ];
      }
    },
    
    async loadDepartments() {
      if (!this.useBackend) {
        // 使用模拟数据
        this.departments = ['研发部', '测试部', '产品部', '设计部', '运维部'];
        return;
      }
      
      try {
        // 从后端获取部门列表
        const response = await axios.get('/api/departments');
        this.departments = response.data.departments;
      } catch (error) {
        console.error('获取部门列表失败:', error);
        ElMessage.warning('获取部门列表失败，使用默认数据');
        // 使用默认部门
        this.departments = ['研发部', '测试部', '产品部', '设计部', '运维部'];
      }
    },
    
    async loadData() {
      if (!this.currentWeek) return;
      
      this.tableLoading = true;
      
      if (!this.useBackend) {
        // 使用模拟数据
        setTimeout(() => {
          // 模拟API延迟
          const mockData = [
            {
              week: '18-2023',
              employees: [
                {
                  id: 1,
                  name: '张三',
                  department: '研发部',
                  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
                  completedTasks: 5,
                  inProgressTasks: 2,
                  blockedTasks: 0,
                  completionRate: 71,
                  tasks: []
                },
                {
                  id: 2,
                  name: '李四',
                  department: '测试部',
                  avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
                  completedTasks: 3,
                  inProgressTasks: 1,
                  blockedTasks: 1,
                  completionRate: 60,
                  tasks: []
                }
              ]
            }
          ];
          
          const weekData = mockData.find(data => data.week === this.currentWeek);
          this.employeeData = weekData ? weekData.employees : [];
          this.tableLoading = false;
        }, 800);
        return;
      }
      
      try {
        // 从后端获取员工数据
        const response = await axios.get(`/api/weekly-report?week=${this.currentWeek}`);
        this.employeeData = response.data.employees || [];
      } catch (error) {
        console.error('获取员工数据失败:', error);
        ElMessage.error('获取员工数据失败，请稍后重试');
        this.employeeData = [];
      } finally {
        this.tableLoading = false;
      }
    },
    
    filterData() {
      // 过滤操作在计算属性中处理
    },
    
    async showEmployeeDetails(employee) {
      this.selectedEmployee = employee;
      this.drawerVisible = true;
      this.detailsLoading = true;
      
      if (!this.useBackend) {
        // 使用模拟数据
        setTimeout(() => {
          // 模拟API延迟
          this.selectedEmployee.tasks = [
            { 
              title: '完成登录模块重构', 
              description: '对登录模块进行代码重构，提高性能和安全性',
              status: 'completed',
              plannedEndDate: '2023-05-03',
              completedDate: '2023-05-02'
            },
            { 
              title: '实现数据导出功能', 
              description: '添加Excel和PDF格式的数据导出功能',
              status: 'in-progress',
              plannedEndDate: '2023-05-07'
            },
            { 
              title: '修复移动端显示bug', 
              description: '解决在iOS设备上的显示异常问题',
              status: 'completed',
              plannedEndDate: '2023-05-04',
              completedDate: '2023-05-04'
            }
          ];
          this.detailsLoading = false;
        }, 1000);
        return;
      }
      
      try {
        // 从后端获取员工任务详情
        const response = await axios.get(`/api/employee-tasks/${employee.id}?week=${this.currentWeek}`);
        this.selectedEmployee.tasks = response.data.tasks || [];
      } catch (error) {
        console.error('获取任务详情失败:', error);
        ElMessage.error('获取任务详情失败，请稍后重试');
        this.selectedEmployee.tasks = [];
      } finally {
        this.detailsLoading = false;
      }
    },
    
    getProgressStatus(rate) {
      if (rate < 50) return 'exception';
      if (rate < 80) return 'warning';
      return 'success';
    },
    
    getTaskStatusType(status) {
      const types = {
        'completed': 'success',
        'in-progress': 'primary',
        'blocked': 'danger',
        'planned': 'info'
      };
      return types[status] || 'info';
    },
    
    getTaskStatusText(status) {
      const texts = {
        'completed': '已完成',
        'in-progress': '进行中',
        'blocked': '阻塞中',
        'planned': '计划中'
      };
      return texts[status] || '未知状态';
    }
  }
}
</script>

<style scoped>
.boss-dashboard {
  padding: 20px;
}

.boss-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  gap: 15px;
}

.dashboard-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.summary-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin: 0 10px;
  text-align: center;
}

.summary-card:first-child {
  margin-left: 0;
}

.summary-card:last-child {
  margin-right: 0;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.card-label {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-list {
  padding: 0 20px;
}

.task-item {
  padding: 15px;
  border-bottom: 1px solid #EBEEF5;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-title {
  font-weight: bold;
  font-size: 16px;
}

.task-desc {
  color: #606266;
  margin-bottom: 10px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
}

/* 新增样式 */
.loading-card {
  margin-bottom: 20px;
}

.drawer-loading {
  padding: 20px;
}
</style> 