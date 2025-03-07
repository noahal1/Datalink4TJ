<template>
  <v-container class="quality-container">
    <v-btn-toggle
      v-model="selectedMonth"
      mandatory
      
      
      color="grey"
      @update:modelValue="handleMonthChange"
      class="month-selector"
    >
      <v-btn
        v-for="month in monthOptions"
        :key="month.value"
        :value="month.value"
        variant="flat"
        size="large"
      >
        {{ month.label }}
      </v-btn>
    </v-btn-toggle>

    <v-data-table
      :headers="headers"
      :items="paginatedData"
      :items-per-page="pageSize"
      hide-default-footer
      class="quality-table elevation-2 mt-4"
      density="compact"
      width="100%"
    >
    <template v-slot:item="{ item }">
        <tr>
          <td class="text-center" style="min-width: 60px">{{ item.date }}</td>
          <td class="text-center" style="min-width: 80px">{{ item.welding }}</td>
          <td class="text-center" style="min-width: 80px">{{ item.stamping }}</td>
          <!-- 正常品字段 -->
          <td v-for="field in standardFields" :key="field" style="min-width: 90px">
            <v-text-field
              v-model="item[field]"
              variant="outlined"
              density="compact"
              type="number"
              @input="handleInput(item, field)"
            />
          </td>
          <!-- 报废品字段 -->
          <td v-for="field in scrapFields" :key="field" style="min-width: 90px">
            <v-text-field
              v-model="item[field]"
              variant="outlined"
              density="compact"
              type="number"
              @input="handleInput(item, field)"
              class="scrap-field"
            />
          </td>
        </tr>
      </template>
    </v-data-table>

    <v-pagination
      v-model="currentPage"
      :length="Math.ceil(tableData.length / pageSize)"
      rounded="circle"
      class="mt-4"
    />

    <v-btn
      v-if="isDataChanged"
      class="floating-button"
      color="primary"
      @click="confirmChanges"
      fab
      dark
    >
    <v-icon dark>mdi-content-save</v-icon>
    </v-btn>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const currentMonth = ref((new Date().getMonth() + 1).toString())
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
const editableFields = ['swi', 'rwh', 'w01', 'hf', 'lc'];
const standardFields = ['swi', 'rwh', 'w01', 'hf', 'lc']
const scrapFields = ['scrapswi', 'scraprwh', 'scrapw01']

const headers = [
  { title: '日期', key: 'date', align: 'center', width: '100' },
  { title: '焊接', key: 'welding', align: 'center', width: '120' },
  { title: '冲压', key: 'stamping', align: 'center', width: '120' },
  ...standardFields.map(key => ({ 
    title: key.toUpperCase(), 
    key, 
    align: 'center',
    width: '130'
  })),
  ...scrapFields.map(key => ({ 
    title: `报废 ${key.replace('scrap','').toUpperCase()}`, 
    key, 
    align: 'center',
    width: '150'
  }))
]
const selectedMonth = currentMonth;

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

const handleInput = (row, field) => {
  try {
    row[field] = parseInt(row[field]) || 0;
    updateQAFields(row);
    isDataChanged.value = true;
  } catch (error) {
    console.error('输入处理错误:', error);
  }
}

const updateQAFields = (row) => {
  row.welding = row.swi + row.rwh + row.w01;
  row.stamping = row.hf + row.lc;
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
          day[item.scrapflag ? `scrap${line}` : line] = parseInt(item.value, 10);
          updateQAFields(day);
        }
      });

      tableData.value = generatedData;
      originalData.value = JSON.parse(JSON.stringify(generatedData));
    } else {
      console.error('获取数据失败');
    }
  } catch (error) {
    console.error('错误:', error);
  }
}

const confirmChanges = async () => {
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
      console.log('修改确认');
      isDataChanged.value = false;
      await fetchData(selectedMonth.value);
    } else {
      console.error('确认修改失败');
    }
  } catch (error) {
    console.error('错误:', error);
  }
}

const checkFieldChanges = (row, originalRow, entries, fields, scrapflag) => {
  fields.forEach(field => {
    if (row[field] !== originalRow[field]) {
      if (row[field] !== 0 || originalRow[field] !== 0) {
        entries.push({
          line: field.toUpperCase(),
          day: row.date,
          month: selectedMonth.value.toString(),
          year: new Date().getFullYear().toString(),
          value: row[field].toString(),
          scrapflag: scrapflag
        });
      }
    }
  });
}

const isDataChanged = ref(false)

onMounted(async () => {
  await fetchData(selectedMonth.value);
});
</script>

<style scoped>

.quality-container {
  max-width: 98vw;
  overflow-x: auto;
}
.floating-button {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
  transition: transform 0.4s;
}

.floating-button:hover {
  transform: scale(1.5);
}

.quality-table :deep(table) {
  min-width: 1200px;
}

.month-selector {
  gap: 12px;
  padding: 2px;
  background: rgba(var(--v-theme-grey), 0.1);
}
</style>
