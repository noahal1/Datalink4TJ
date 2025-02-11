<template>
<el-table :data="tableData" style="width: 100%" size="large">
    <el-table-column prop="Week" label="周" width="120"></el-table-column>
    <el-table-column prop="Day" label="日期" position="center"></el-table-column>
    <el-table-column prop="LWD" label="LWD数量" width="150"></el-table-column>
</el-table>
</template>
<script setup>
import { ref } from 'vue'

const tableData = ref([
    { Week: '1' },
    { Week: '2' },
    { Week: '3' },
    { Week: '4' }])
</script>