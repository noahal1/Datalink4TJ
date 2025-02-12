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
    <el-table-column label="焊接GP12" prop="welding" width="100" align="center"></el-table-column>
    <el-table-column label="冲压GP12" prop="stamping" width="100" align="center"></el-table-column>
    <el-table-column label="跨部门早会GP12" align="center">
      <template #default="{ row }"> 
        <el-input v-model="row.meeting" @input="handleInput" size="small" clearable></el-input>
      </template>
    </el-table-column>
    <el-table-column label="Target-GP12" align="center">
      <template #default="{ row }">
        <el-input v-model="row.target" @input="handleInput" size="small" clearable></el-input>
      </template>
    </el-table-column>
    <el-table-column label="GP12-SWI">
      <template #default="{ row }">
        <el-input v-model="row.swi" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="GP12-RWH">
      <template #default="{ row }">
        <el-input v-model="row.rwh" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="GP12-W01">
      <template #default="{ row }">
        <el-input v-model="row.w01" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="GP12-HF">
      <template #default="{ row }">
        <el-input v-model="row.hf" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="GP12-LC">
      <template #default="{ row }">
        <el-input v-model="row.lc" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="报废-SWI">
      <template #default="{ row }">
        <el-input v-model="row.scrapSwi" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="报废-RWH">
      <template #default="{ row }">
        <el-input v-model="row.scrapRwh" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="报废-W01">
      <template #default="{ row }">
        <el-input v-model="row.scrapW01" @input="handleInput"></el-input>
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
import { ref, computed } from 'vue'

const currentMonth = new Date().getMonth() + 1; // 获取当前月份
const selectedMonth = ref(currentMonth); // 设置默认选择为当前月份
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
const tableData = ref(generateDaysInSelectedMonth(selectedMonth.value));
const pageSize = 16;
const currentPage = ref(1);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

const handleInput = () => {
  console.log('数据已更新')
  isDataChanged.value = true
}

const handleMonthChange = (newMonth) => {
  tableData.value = generateDaysInSelectedMonth(newMonth);
}

function generateDaysInSelectedMonth(month) {
  const year = new Date().getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const tableData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const data = {
      date: day.toString(),
      swi: 0,
      rwh: 0,
      w01: 0,
      hf: 0,
      lc: 0,
      scrapSwi: 0,
      scrapRwh: 0,
      scrapW01: 0,
      meeting: 0,
      target: 0,
    };
    data.welding = data.swi + data.rwh + data.w01;
    data.stamping = data.hf + data.lc;
    tableData.push(data);
  }
  return tableData;
}

const isDataChanged = ref(false)
const confirmChanges = () => {
  console.log('修改确认')
  isDataChanged.value = false
}

const handlePageChange = (page) => {
  currentPage.value = page;
}
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
