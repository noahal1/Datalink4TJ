<template>
  <el-row>
    <el-col :span="8">
      <el-table :data="leftTableData" style="width: 100%" size="large" :cell-class-name="cellClassName">
        <el-table-column prop="week" label="周" width="80"></el-table-column>
        <el-table-column prop="dateRange" label="日期范围" align="center" width="240"></el-table-column>
        <el-table-column label="LWD数量" width="100">
          <template #default="{ row }">
            <el-input v-model="row.lwd" size="small" type="number" @input="handleInput"></el-input>
          </template>
        </el-table-column>
      </el-table>
    </el-col>
    <el-col :span="8">
      <el-table :data="midTableData" style="width: 100%" size="large" :cell-class-name="cellClassName">
        <el-table-column prop="week" label="周" width="80"></el-table-column>
        <el-table-column prop="dateRange" label="日期范围" align="center" width="240"></el-table-column>
        <el-table-column label="LWD数量" width="150">
          <template #default="{ row }">
            <el-input v-model="row.lwd" size="small" type="number" @input="handleInput"></el-input>
          </template>
        </el-table-column>
      </el-table>
    </el-col>
    <el-col :span="8">
      <el-table :data="rightTableData" style="width: 100%" size="large" :cell-class-name="cellClassName">
        <el-table-column prop="week" label="周" width="80"></el-table-column>
        <el-table-column prop="dateRange" label="日期范围" align="center" width="240"></el-table-column>
        <el-table-column label="LWD数量" width="150">
          <template #default="{ row }">
            <el-input v-model="row.lwd" size="small" type="number" @input="handleInput"></el-input>
          </template>
        </el-table-column>
      </el-table>
    </el-col>
  </el-row>
  <el-button
    v-if="isDataChanged"
    class="floating-button"
    type="primary"
    @click="confirmChanges">
    修改确认
  </el-button>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
      week: weekNumber,
      dateRange: `${format(start, 'MM/dd')} - ${format(end, 'MM/dd')}`,
      lwd: 0,
    })
    startDate.setDate(startDate.getDate() + 7)
    weekNumber = getISOWeek(startDate)
  }

  return weeks
}

// 生成数据并分成三部分
const allTableData = generateWeeks()
const midIndex = Math.ceil(allTableData.length / 3)
const midIndex2 = allTableData.length - midIndex
const leftTableData = ref(allTableData.slice(0, midIndex))
const midTableData = ref(allTableData.slice(midIndex, midIndex2))
const rightTableData = ref(allTableData.slice(midIndex2))
const originalData = ref([...allTableData])

const handleInput = () => {
  console.log('数据已更新')
  isDataChanged.value = true
}

const confirmChanges = async () => {
  const changedData = allTableData.flatMap((row, index) => {
    const originalRow = originalData.value[index]
    if (row.lwd !== originalRow.lwd) {
      if (row.lwd !== 0) {
        return {
          week: row.week,
          year: new Date().getFullYear(),
          lwd: row.lwd
        }
      } else if (originalRow.lwd !== 0) {
        return {
          week: row.week,
          year: new Date().getFullYear(),
          lwd: 0
        }
      }
    }
    return []
  })

  try {
    const response = await fetch('http://127.0.0.1:8000/ehs/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(changedData)
    })
    if (response.ok) {
      console.log('修改确认')
      isDataChanged.value = false
      await fetchLWDData()
    } else {
      console.error('Failed to confirm changes')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

const fetchLWDData = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/ehs')
    if (response.ok) {
      const fetchedData = await response.json()
      fetchedData.forEach(item => {
        const week = allTableData.find(week => week.week === item.week)
        if (week) {
          week.lwd = item.lwd
        }
      })
      originalData.value = JSON.parse(JSON.stringify(allTableData))
    } else {
      console.error('Failed to fetch LWD data')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

const cellClassName = ({ rowIndex, columnIndex }) => {
  return 'compact-cell'
}

const isDataChanged = ref(false)

onMounted(async () => {
  await fetchLWDData()
})
</script>

<style scoped>
.compact-cell {
  padding: 5px 0;
}

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