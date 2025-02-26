<template>
  <el-segmented 
    v-model="selectedMonth" 
    :options="monthOptions" 
    size="large" 
    block 
    @change="handleMonthChange" 
    class="highlight-selected"
  />
  <el-table :data="paginatedData" style="width: 100%;" border stripe>
    <el-table-column prop="date" label="日期" width="80" align="center"></el-table-column>
    <el-table-column label="焊接QA" prop="welding" width="100" align="center"></el-table-column>
    <el-table-column label="冲压QA" prop="stamping" width="100" align="center"></el-table-column>
    <el-table-column label="QA-SWI">
      <template #default="{ row }">
        <el-input v-model="row.swi" @input="handleInput(row, 'swi')"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="QA-RWH">
      <template #default="{ row }">
        <el-input v-model="row.rwh" @input="handleInput(row, 'rwh')"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="QA-W01">
      <template #default="{ row }">
        <el-input v-model="row.w01" @input="handleInput(row, 'w01')"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="QA-HF">
      <template #default="{ row }">
        <el-input v-model="row.hf" @input="handleInput(row, 'hf')"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="QA-LC">
      <template #default="{ row }">
        <el-input v-model="row.lc" @input="handleInput(row, 'lc')"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="报废-SWI">
      <template #default="{ row }">
        <el-input v-model="row.scrapswi" @input="handleInput(row, 'scrapswi')"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="报废-RWH">
      <template #default="{ row }">
        <el-input v-model="row.scraprwh" @input="handleInput(row, 'scraprwh')"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="报废-W01">
      <template #default="{ row }">
        <el-input v-model="row.scrapw01" @input="handleInput(row, 'scrapw01')"></el-input>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination
    background
    layout="prev, pager, next"
    :total="tableData.length"
    :page-size="pageSize"
    @current-change="handlePageChange"
  />
  <el-button
    v-if="isDataChanged"
    class="floating-button"
    type="primary"
    @click="confirmChanges">
    修改确认
  </el-button>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const currentMonth = new Date().getMonth() + 1; // 获取当前月份
const selectedMonth = ref(currentMonth);   // 设置默认选择为当前月份
const monthOptions = [
  { label: '一月', value: '1' },
  { label: '二月', value: '2' },
  { label: '三月', value: '3' },
  { label: '四月', value: '4' },
  { label: '五月', value: '5' },
  { label: '六月', value: '6' },
  { label: '七月', value: '7' },
  { label: '八月', value: '8' },
  { label: '九月', value: '9' },
  { label: '十月', value: '10' },
  { label: '十一月', value: '11' },
  { label: '十二月', value: '12' }
]
const tableData = ref([]);
const pageSize = 16;
const currentPage = ref(1);
const originalData = ref([]);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

const handleInput = (row, field) => {
  row[field] = parseInt(row[field]) || 0;
  row.welding = row.swi + row.rwh + row.w01;
  row.stamping = row.hf + row.lc;
  isDataChanged.value = true;
}

const handleMonthChange = async (newMonth) => {
  await fetchData(newMonth);
}

const fetchData = async (month) => {
  try {
    const response = await fetch(`${API_BASE_URL}/qa/?month=${month}`);
    if (response.ok) {
      const fetchedData = await response.json();
      const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
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
        welding: 0,
        stamping: 0
      }));

      fetchedData.forEach(item => {
        const day = generatedData.find(d => d.date === item.day);
        if (day) {
          const line = item.line.toLowerCase();
          if (item.scrapflag) {
            day[`scrap${line}`] = parseInt(item.value, 10);
          } else {
            day[line] = parseInt(item.value, 10);
          }
          day.welding = day.swi + day.rwh + day.w01;
          day.stamping = day.hf + day.lc;
        }
      });

      tableData.value = generatedData;
      originalData.value = JSON.parse(JSON.stringify(generatedData)); // 深拷贝数据

    } else {
      console.error('Failed to fetch data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

const confirmChanges = async () => {
  const changedData = tableData.value.flatMap((row, index) => {
    const originalRow = originalData.value[index];
    const entries = [];
    ['swi', 'rwh', 'w01', 'hf', 'lc'].forEach(line => {
      if (row[line] !== originalRow[line]) {
        if (row[line] !== 0) {
          entries.push({
            line: line.toUpperCase(), 
            day: row.date,
            month: selectedMonth.value.toString(),
            year: new Date().getFullYear().toString(),
            value: row[line].toString(),
            scrapflag: false
          });
        } else if (originalRow[line] !== 0) {
          entries.push({
            line: line.toUpperCase(),
            day: row.date,
            month: selectedMonth.value.toString(),
            year: new Date().getFullYear().toString(),
            value: '0',
            scrapflag: false
          });
        }
      }
      if (row[`scrap${line}`] !== originalRow[`scrap${line}`]) {
        if (row[`scrap${line}`] !== 0) {
          entries.push({
            line: line.toUpperCase(),
            day: row.date,
            month: selectedMonth.value.toString(),
            year: new Date().getFullYear().toString(),
            value: row[`scrap${line}`].toString(),
            scrapflag: true
          });
        } else if (originalRow[`scrap${line}`] !== 0) {
          entries.push({
            line: line.toUpperCase(),
            day: row.date,
            month: selectedMonth.value.toString(),
            year: new Date().getFullYear().toString(),
            value: '0',
            scrapflag: true
          });
        }
      }
    });
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
      console.log('修改确认');
      isDataChanged.value = false;
      await fetchData(selectedMonth.value); // 确认后刷新数据
    } else {
      console.error('Failed to confirm changes');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

const handlePageChange = (page) => {
  currentPage.value = page;
}

const isDataChanged = ref(false)

onMounted(async () => {
  await fetchData(selectedMonth.value);
});
</script>

<style scoped>
.floating-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  transition: background-color 0.3s;
}

.floating-button:hover {
  background-color: #409eff;
}

.el-table {
  margin-top: 10px;
}

.el-input {
  width: 100%;
}

.highlight-selected .el-segmented-item.is-active {
  background-color: #8a8a8a; 
  color: #fff; 
}
</style>