<template>
  <el-segmented v-model="selectedMonth" :options="monthOptions" size="large" block @change="handleMonthChange" />
  <el-table :data="tableData">
    <el-table-column prop="date" label="日期" width="60"></el-table-column>
    <el-table-column label="焊接GP12" prop="welding" width="90"></el-table-column>
    <el-table-column label="冲压GP12" prop="stamping" width="90"></el-table-column>
    <el-table-column label="跨部门早会GP12">
      <template #default="{ row }">
        <el-input v-model="row.meeting" @input="handleInput"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="Target-GP12">
      <template #default="{ row }">
        <el-input v-model="row.target" @input="handleInput"></el-input>
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
</template>

<script setup>
  import { ref } from 'vue'

  const selectedMonth = ref(new Date().getMonth() + 1)
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

  const handleInput = () => {
    console.log('数据已更新');
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
</script>
