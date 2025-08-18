<template>
  <div class="pa-4">
    <h2>行动计划测试页面</h2>
    
    <v-btn
      color="primary"
      @click="openDialog"
      class="mb-4"
    >
      测试行动计划对话框
    </v-btn>

    <v-btn
      color="secondary"
      @click="clearData"
      class="mb-4 ml-2"
    >
      清空数据测试
    </v-btn>

    <div v-if="testItem">
      <h3>当前测试数据：</h3>
      <pre>{{ JSON.stringify(testItem, null, 2) }}</pre>
    </div>

    <!-- 测试对话框 -->
    <kpi-remark-dialog
      v-model="dialog"
      :item="testItem"
      title="测试行动计划"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KpiRemarkDialog from '@/components/KpiRemarkDialog.vue'

const dialog = ref(false)
const testItem = ref({
  id: 1,
  description: '测试KPI指标',
  area: 'TJC',
  actual_value: 80,
  target_value: 100,
  root_cause_analysis: '这是一个测试的原因分析',
  action_plan_content: '', // 行动计划内容
  expected_close_date: '', // 预计关闭日期
  actual_close_date: '' // 实际关闭日期
})

const openDialog = () => {
  dialog.value = true
}

const handleSave = (data) => {
  console.log('保存的数据:', data)
  testItem.value.root_cause_analysis = data.root_cause_analysis
  testItem.value.action_plan_content = data.action_plan_content
  testItem.value.expected_close_date = data.expected_close_date
  testItem.value.actual_close_date = data.actual_close_date
}

const clearData = () => {
  testItem.value.root_cause_analysis = ''
  testItem.value.action_plan_content = ''
  testItem.value.expected_close_date = ''
  testItem.value.actual_close_date = ''
}
</script>
</template>
