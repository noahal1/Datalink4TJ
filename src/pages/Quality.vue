<template>
  <v-container class="quality-container pa-0">
    <!-- 数据表格区域 -->
    <v-card class=" flex-grow-1 d-flex flex-column">
      <v-card-title class="d-flex align-center fixed-header">
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
      </v-card-title>
      
      <v-divider></v-divider>
      
      <!-- 加载指示器 -->
      <loading-overlay :loading="isLoading" message="加载数据中..." />
      
      <div class="table-container">
        <v-data-table
          :headers="visibleHeaders"
          :items="paginatedData"
          :items-per-page="pageSize"
          :search="search"
          hide-default-footer
          class="quality-table"
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
        </v-data-table>
      </div>
      
      <v-divider></v-divider>
      
      <v-card-actions class="d-flex justify-center py-1">
        <v-pagination
          v-model="currentPage"
          :length="Math.ceil(tableData.length / pageSize)"
          rounded="circle"
          density="comfortable"
          active-color="primary"
        />
      </v-card-actions>
    </v-card>
    
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
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'

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
const handleMonthChange = async (newMonth) => {
  if (isDataChanged.value) {
    if (confirm('有未保存的更改，是否继续切换月份？')) {
      await fetchData(newMonth);
    } else {
      selectedMonth.value = selectedMonth.value; // 恢复之前的月份选择
      return;
    }
  } else {
    await fetchData(newMonth);
  }
}

// 刷新数据
const refreshData = async () => {
  await fetchData(selectedMonth.value);
}

// 获取数据
const fetchData = async (month) => {
  isLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/qa/?month=${month}`);
    if (response.ok) {
      const fetchedData = await response.json();
      const daysInMonth = new Date(currentYear, month, 0).getDate();
      const generatedData = Array.from({ length: daysInMonth }, (_, i) => ({
        date: (i + 1).toString(),
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
        const day = generatedData.find(d => d.date === item.day);
        if (day) {
          const line = item.line.toLowerCase();
          day[item.scrapflag ? `scrap${line}` : line] = parseInt(item.value, 10);
          updateQAFields(day);
        }
      });

      tableData.value = generatedData;
      originalData.value = JSON.parse(JSON.stringify(generatedData));
      isDataChanged.value = false;
    } else {
      console.error('获取数据失败');
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    isLoading.value = false;
  }
}

// 确认修改
const confirmChanges = async () => {
  isLoading.value = true;
  const changedData = tableData.value.flatMap((row, index) => {
    const originalRow = originalData.value[index];
    const entries = [];
    checkFieldChanges(row, originalRow, entries, editableFields, false);
    checkFieldChanges(row, originalRow, entries, scrapFields, true);
    return entries;
  });

  try {
    const response = await fetch(`${API_BASE_URL}/qa/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(changedData)
    });
    if (response.ok) {
      // 显示成功通知
      const app = getCurrentInstance();
      if (app && app.proxy.$notify) {
        app.proxy.$notify.success('数据保存成功！');
      }
      
      isDataChanged.value = false;
      await fetchData(selectedMonth.value);
    } else {
      console.error('确认修改失败');
      const app = getCurrentInstance();
      if (app && app.proxy.$notify) {
        app.proxy.$notify.error('数据保存失败，请重试！');
      }
    }
  } catch (error) {
    console.error('错误:', error);
    const app = getCurrentInstance();
    if (app && app.proxy.$notify) {
      app.proxy.$notify.error('发生错误: ' + error.message);
    }
  } finally {
    isLoading.value = false;
  }
}

const checkFieldChanges = (row, originalRow, entries, fields, scrapflag) => {
  fields.forEach(field => {
    if (row[field] !== originalRow[field]) {
      if (row[field] !== 0 || originalRow[field] !== 0) {
        // 对于报废品字段，提取正确的line值（去掉scrap前缀）
        const lineValue = scrapflag ? field.replace('scrap', '') : field;
        
        entries.push({
          line: lineValue.toUpperCase(),
          day: row.date,
          month: selectedMonth.value.toString(),
          year: currentYear.toString(),
          value: row[field].toString(),
          scrapflag: scrapflag
        });
      }
    }
  });
}

onMounted(async () => {
  await fetchData(selectedMonth.value);
});
</script>

<style scoped>
.quality-container {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* Adjust height to account for app bar */
}

.v-card {
  display: flex;
  flex-direction: column;
}

.table-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

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

.quality-table {
  height: 100%;
}

.quality-table :deep(table) {
  min-width: 1000px;
}

.max-width-200 {
  max-width: 200px;
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
    justify-content: center;
  }
  
  .month-selector .v-btn {
    flex: 0 0 calc(25% - 8px);
    margin: 4px;
  }
}
</style>
