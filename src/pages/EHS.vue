<template>
<el-table :data="tableData" style="width: 100%" size="large">
    <el-table-column prop="Week" label="周" width="120"></el-table-column>
    <el-table-column prop="DateRange" label="日期范围" align="center"></el-table-column>
    <el-table-column label="LWD数量" width="150">
        <template #default="{ row }">
            <el-input v-model="row.LWD" size="small" type="number"  @input="handleInput"></el-input>
        </template>
    </el-table-column>
</el-table>
<el-button
    v-if="isDataChanged"
    class="floating-button"
    type="primary"
    @click="confirmChanges">
    修改确认
  </el-button>
</template>
<script setup>
import { ref } from 'vue'
import { format, startOfWeek, endOfWeek, getISOWeek } from 'date-fns'

const generateWeeks = () => {
    const weeks = []
    const currentYear = new Date().getFullYear()
    const startDate = new Date(currentYear, 0, 1)
    let weekNumber = getISOWeek(startDate)

    while (startDate.getFullYear() === currentYear) {
        const start = startOfWeek(startDate, { weekStartsOn: 1 })
        const end = endOfWeek(startDate, { weekStartsOn: 1 })
        weeks.push({
            Week: weekNumber,
            DateRange: `${format(start, 'MM/dd')} - ${format(end, 'MM/dd')}`,
            LWD: 0, 
        })
        startDate.setDate(startDate.getDate() + 7)
        weekNumber = getISOWeek(startDate)
    }

    return weeks
}
const handleInput = () => {
  console.log('数据已更新')
  isDataChanged.value = true
}

const isDataChanged = ref(false)
const confirmChanges = () => {
  console.log('修改确认')
  isDataChanged.value = false
}

const tableData = ref(generateWeeks())

const currentWeekNumber = getISOWeek(new Date())
tableData.value = tableData.value.map(week => ({
    ...week,
    isCurrent: week.Week === currentWeekNumber
}))
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
</style>