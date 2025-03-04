<template>
  <v-container>
    <v-card class="pa-6">
      <v-card-title class="headline primary--text">
        质量数据管理
      </v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="submit">
          <v-subheader class="pl-0">月度YTD数据</v-subheader>
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="selectedDefectMonth"
                :items="months"
                label="选择月份"
                :rules="[rules.required]"></v-select>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.monthsYtd[selectedYtdMonth - 1]"
                label="当月YTD值"
                type="number"
                min="0"
                :rules="[rules.required, rules.positive]"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-6"></v-divider>

          <v-subheader class="pl-0">供应商缺陷</v-subheader>
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="selectedDefectMonth"
                :items="months"
                label="选择月份"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.supplierDefects[selectedDefectMonth - 1]"
                label="缺陷数量"
                type="number"
                min="0"
                :rules="[rules.required, rules.positive]"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-btn 
            type="submit" 
            color="primary" 
            large
            class="mt-6"
            :loading="submitting"
          >
            {{ formData.id ? '更新数据' : '提交数据' }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const selectedYtdMonth = ref(1);
const selectedDefectMonth = ref(1);
const months = Array.from({ length: 12 }, (_, i) => ({ 
  title: `${i+1}月`, 
  value: i+1 
}));
const formData = reactive({
  id: null, // 用于PUT操作
  monthsYtd: Array(12).fill(null),
  supplierDefects: Array(12).fill(null),
  formalComplaints: null,
  informalComplaints: null
});
const rules = {
  required: value => !!value || '必填字段',
  positive: value => value >= 0 || '不能为负数'
};
const submitting = ref(false);
const form = ref(null);

watch(selectedYtdMonth, (newVal) => {
});

const submit = async () => {
  if (!form.value.validate()) return;
  submitting.value = true;
  
  const method = formData.id ? 'PUT' : 'POST';
  const url = formData.id 
    ? `${API_BASE_URL}/qa/quality-data/${formData.id}`
    : `${API_BASE_URL}/qa/quality-data`;

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (!formData.id) formData.id = data.id;
    showMessage(`数据${method === 'PUT' ? '更新' : '提交'}成功`, 'success');
    
  } catch (error) {
    showMessage(`操作失败: ${error.message}`, 'error');
  } finally {
    submitting.value = false;
  }
};

const showMessage = (message, type) => {
  console.log(message, type);
};
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
