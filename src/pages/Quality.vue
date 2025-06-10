<template>
  <unified-page-template 
    title="GP12数据管理"
    icon="mdi-checkbox-multiple-marked-circle-outline"
    color="primary"
  >
    <div class="d-flex align-center fixed-header">
      <!-- 月份选择器 -->
      <v-btn-toggle
        v-model="selectedMonth"
        mandatory
        color="primary"
        @update:modelValue="handleMonthChange"
        class="month-selector mr-4"
        density="comfortable"
        rounded="lg"
      >
        <v-btn value="1">一</v-btn>
        <v-btn value="2">二</v-btn>
        <v-btn value="3">三</v-btn>
        <v-btn value="4">四</v-btn>
        <v-btn value="5">五</v-btn>
        <v-btn value="6">六</v-btn>
        <v-btn value="7">七</v-btn>
        <v-btn value="8">八</v-btn>
        <v-btn value="9">九</v-btn>
        <v-btn value="10">十</v-btn>
        <v-btn value="11">十一</v-btn>
        <v-btn value="12">十二</v-btn>
      </v-btn-toggle>
      
      <v-spacer></v-spacer>
      
      <!-- 工具栏 -->    
      <v-btn-toggle v-model="dataView" density="comfortable" color="primary">
        <v-btn value="regular" prepend-icon="mdi-table">GP12</v-btn>
        <v-btn value="scrap" prepend-icon="mdi-delete">报废数</v-btn>
      </v-btn-toggle>
      
      <v-btn 
        prepend-icon="mdi-refresh"
        variant="text"
        class="ml-2"
        @click="refreshData"
        :loading="isLoading"
      >
        刷新
      </v-btn>
    </div>
    
    <!-- 加载指示器 -->
    <loading-overlay :loading="isLoading" message="加载数据中..." />
    
    <!-- 数据表格 -->
    <unified-data-table
      :headers="visibleHeaders"
      :items="paginatedData"
      :loading="isLoading"
      class="mt-4"
      hide-default-footer
      density="compact"
      hover
      fixed-header
    >
      <template v-slot:item="{ item }">
        <tr :class="{'highlight-weekend': isWeekend(item.date)}">
          <td class="text-center font-weight-medium" style="min-width: 60px">{{ item.date }}</td>
          <td class="text-center" style="min-width: 80px">{{ item.welding }}</td>
          <td class="text-center" style="min-width: 80px">{{ item.stamping }}</td>
          <!-- 正常品或报废品字段 -->
          <td v-for="field in dataView === 'regular' ? standardFields : scrapFields" 
              :key="field" 
              style="min-width: 90px"
              class="editable-cell"
          >
            <v-text-field
              v-model="item[field]"
              variant="outlined"
              density="compact"
              type="number"
              hide-details
              class="ma-1"
              :class="{'scrap-field': dataView === 'scrap'}"
              @input="handleInput(item, field)"
            />
          </td>
        </tr>
      </template>
    </unified-data-table>
    
    <div class="d-flex justify-center py-3 mt-2">
      <v-pagination
        v-model="currentPage"
        :length="Math.ceil(tableData.length / pageSize)"
        rounded="circle"
        density="comfortable"
        active-color="primary"
      />
    </div>
    
    <v-btn
      size="large"
      v-if="isDataChanged"
      class="floating-button"
      color="primary"
      rounded="pill"
      elevation="3"
      @click="confirmChanges"
    >
      <v-icon class="mr-1">mdi-content-save</v-icon>
      保存更改
    </v-btn>
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '../stores/user'
import api from '../utils/api'
import Message from '../utils/notification'

const userStore = useUserStore()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const currentYear = new Date().getFullYear()
const currentMonth = ref((new Date().getMonth() + 1).toString())
const tableData = ref([]);
const pageSize = 16;
const currentPage = ref(1);
const originalData = ref([]);
const editableFields = ['swi', 'rwh', 'w01', 'hf', 'lc'];
const standardFields = ['swi', 'rwh', 'w01', 'hf', 'lc']
const scrapFields = ['scrapswi', 'scraprwh', 'scrapw01', 'scraphf', 'scraplc']
const isLoading = ref(false)
const search = ref('')
const dataView = ref('regular') 
const isDataChanged = ref(false)

// 表头定义
const regularHeaders = [
  { title: '日期', key: 'date', align: 'center', width: '100' },
  { title: '焊接', key: 'welding', align: 'center', width: '100' },
  { title: '冲压', key: 'stamping', align: 'center', width: '100' },
  ...standardFields.map(key => ({ 
    title: key.toUpperCase(), 
    key, 
    align: 'center',
    width: '130'
  }))
]

const scrapHeaders = [
  { title: '日期', key: 'date', align: 'center', width: '100' },
  { title: '焊接', key: 'welding', align: 'center', width: '100' },
  { title: '冲压', key: 'stamping', align: 'center', width: '100' },
  ...scrapFields.map(key => ({ 
    title: `报废 ${key.replace('scrap','').toUpperCase()}`, 
    key, 
    align: 'center',
    width: '130'
  }))
]

const visibleHeaders = computed(() => {
  return dataView.value === 'regular' ? regularHeaders : scrapHeaders
})

const selectedMonth = ref(currentMonth.value);

// 分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

// 判断是否是周末
const isWeekend = (day) => {
  const date = new Date(currentYear, parseInt(selectedMonth.value) - 1, parseInt(day));
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0是周日，6是周六
};

// 输入处理
const handleInput = (row, field) => {
  try {
    row[field] = parseInt(row[field]) || 0;
    updateQAFields(row);
    isDataChanged.value = true;
  } catch (error) {
    console.error('输入处理错误:', error);
  }
}

// 更新字段
const updateQAFields = (row) => {
  row.welding = row.swi + row.rwh + row.w01;
  row.stamping = row.hf + row.lc;
}

// 月份变更处理
const handleMonthChange = async () => {
  if (isDataChanged.value) {
    const confirm = window.confirm('您有未保存的更改。继续切换月份将丢失这些更改。确定继续吗？');
    if (!confirm) {
      selectedMonth.value = currentMonth.value;
      return;
    }
  }
  
  currentMonth.value = selectedMonth.value;
  await fetchData();
}

// 刷新数据
const refreshData = async () => {
  await fetchData(selectedMonth.value);
  Message.info('数据已刷新');
}

// 获取数据
const fetchData = async (month = selectedMonth.value) => {
  isLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/qa/?month=${month}`);
    if (response.ok) {
      const fetchedData = await response.json();
      const daysInMonth = new Date(currentYear, parseInt(month) - 1, 0).getDate();
      const generatedData = Array.from({ length: daysInMonth }, (_, i) => ({
        date: (i + 1).toString().padStart(2, '0'),
        swi: 0,
        rwh: 0,
        w01: 0,
        hf: 0,
        lc: 0,
        scrapswi: 0,
        scraprwh: 0,
        scrapw01: 0,
        scraphf: 0,
        scraplc: 0,
        welding: 0,
        stamping: 0
      }));

      fetchedData.forEach(item => {
        const day = generatedData.find(d => parseInt(d.date) === parseInt(item.day));
        if (day) {
          const line = item.line.toLowerCase();
          day[item.scrapflag ? `scrap${line}` : line] = parseInt(item.value, 10);
          // 更新welding和stamping字段
          day.welding = day.swi + day.rwh + day.w01;
          day.stamping = day.hf + day.lc;
        }
      });
      
      tableData.value = generatedData;
      // 创建数据的深拷贝以便比较
      originalData.value = JSON.parse(JSON.stringify(generatedData));
      isDataChanged.value = false;
    } else {
      console.error('获取数据失败');
      Message.error('获取质量数据失败');
    }
  } catch (error) {
    console.error('获取数据错误:', error);
    Message.error('获取质量数据失败: ' + (error.message || '未知错误'));
  } finally {
    isLoading.value = false;
  }
};

// 确认修改
const confirmChanges = async () => {
  try {
    isLoading.value = true;
    const changedData = [];
    const apiData = [];  // 用于存储转换后的数据格式
    
    // 找出所有更改过的数据
    tableData.value.forEach((row, index) => {
      const originalRow = originalData.value[index];
      
      // 检查数据是否有更改
      const changedFields = [];
      
      standardFields.forEach(field => {
        if (row[field] !== originalRow[field]) {
          changedFields.push({
            field,
            oldValue: originalRow[field],
            newValue: row[field],
            isScrap: false
          });
          
          // 转换为后端期望的格式
          apiData.push({
            line: field,
            day: row.date,
            month: selectedMonth.value,
            year: new Date().getFullYear().toString(),
            value: row[field].toString(),
            scrapflag: false
          });
        }
      });
      
      scrapFields.forEach(field => {
        if (row[field] !== originalRow[field]) {
          const lineField = field.replace('scrap', '');
          changedFields.push({
            field: lineField,
            oldValue: originalRow[field],
            newValue: row[field],
            isScrap: true
          });
          
          // 转换为后端期望的格式
          apiData.push({
            line: lineField,
            day: row.date,
            month: selectedMonth.value,
            year: new Date().getFullYear().toString(),
            value: row[field].toString(),
            scrapflag: true
          });
        }
      });
      
      if (changedFields.length > 0) {
        changedData.push({
          day: row.date,
          month: selectedMonth.value,
          changes: changedFields
        });
      }
    });
    
    if (changedData.length === 0) {
      Message.info('没有数据变更');
      return;
    }
    
    // 发送转换后的数据格式到服务器
    const response = await api.put('/qa', apiData);
    
    if (response.message === "QA entries updated successfully") {
      Message.success('数据保存成功');
      // 更新原始数据
      originalData.value = JSON.parse(JSON.stringify(tableData.value));
      isDataChanged.value = false;
    } else {
      Message.error('保存失败: ' + (response.message || '未知错误'));
    }
  } catch (error) {
    console.error('保存数据错误:', error);
    Message.error('保存失败: ' + (error.message || '未知错误'));
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData(selectedMonth.value);
});
</script>

<style scoped>
.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
}

.floating-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
  transition: all 0.3s ease;
  min-width: 120px;
}

.floating-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
}

.editable-cell {
  transition: background-color 0.2s;
}

.editable-cell:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.scrap-field :deep(.v-field) {
  background-color: rgba(244, 67, 54, 0.05);
  border: 1px solid rgba(244, 67, 54, 0.1);
}

.highlight-weekend {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 增强输入框样式 */
:deep(.v-text-field input) {
  text-align: center;
  font-weight: 500;
}

@media (max-width: 960px) {
  .month-selector {
    flex-wrap: wrap;
  }
}
</style>
