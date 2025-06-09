<template>
  <v-container>
    <v-card class="pa-6 quality-card">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-clipboard-check-outline</v-icon>
        <span class="text-h5">质量数据管理</span>
      </v-card-title>
      
      <!-- 月份选择器 -->
      <v-card-text>
        <v-row class="mb-6">
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedMonth"
              :items="months"
              label="选择月份"
              variant="outlined"
              density="comfortable"
              hide-details
              :rules="[rules.required]"
              @update:model-value="fetchMonthData"
              class="month-selector"
            ></v-select>
          </v-col>
          <v-col cols="12" md="8" class="d-flex align-center">
            <v-chip 
              color="primary" 
              label 
              class="ml-auto"
              size="large"
            >
              {{ new Date().getFullYear() }}年 {{ selectedMonth }}月
            </v-chip>
          </v-col>
        </v-row>

        <v-divider class="mb-6"></v-divider>

        <!-- 内容区域 -->
        <v-expand-transition>
          <div v-if="dataLoaded">
            <!-- 数据摘要卡片 -->
            <v-row class="mb-6">
              <v-col cols="12" md="3" sm="6">
                <v-card color="primary" dark class="metric-card">
                  <v-card-text class="d-flex flex-column align-center">
                    <div class="text-h6 mb-2">FTT - TJC</div>
                    <div class="text-h3 font-weight-bold">{{ formData.fttValuesTjc[selectedMonth - 1] }}%</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <v-card color="info" dark class="metric-card">
                  <v-card-text class="d-flex flex-column align-center">
                    <div class="text-h6 mb-2">FTT - TJM</div>
                    <div class="text-h3 font-weight-bold">{{ formData.fttValuesTjm[selectedMonth - 1] }}%</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <v-card color="warning" dark class="metric-card">
                  <v-card-text class="d-flex flex-column align-center">
                    <div class="text-h6 mb-2">客户投诉</div>
                    <div class="text-h3 font-weight-bold">{{ formData.formalComplaints[selectedMonth - 1] }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <v-card color="error" dark class="metric-card">
                  <v-card-text class="d-flex flex-column align-center">
                    <div class="text-h6 mb-2">报废率-TJC</div>
                    <div class="text-h3 font-weight-bold">{{ formData.scrapRatesTjc[selectedMonth - 1] }}%</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-form ref="form" @submit.prevent="submit">
              <!-- 报废率模块 -->
              <v-card class="mb-6 pa-4">
                <v-card-title class="subtitle-1">
                  <v-icon class="mr-2">mdi-recycle</v-icon>
                  报废率
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.scrapRatesTjc[selectedMonth - 1]"
                        label="TJC报废率 (%)"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入TJC厂区的报废率百分比"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.scrapRatesTjm[selectedMonth - 1]"
                        label="TJM报废率 (%)"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入TJM厂区的报废率百分比"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- FTT模块 -->
              <v-card class="mb-6 pa-4">
                <v-card-title class="subtitle-1">
                  <v-icon class="mr-2">mdi-check-circle-outline</v-icon>
                  FTT (First Time Through)
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.fttValuesTjc[selectedMonth - 1]"
                        label="TJC FTT值 (%)"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入TJC厂区的FTT百分比"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.fttValuesTjm[selectedMonth - 1]"
                        label="TJM FTT值 (%)"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入TJM厂区的FTT百分比"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- 供应商缺陷和QC漏检 -->
              <v-card class="mb-6 pa-4">
                <v-card-title class="subtitle-1">
                  <v-icon class="mr-2">mdi-alert-circle-outline</v-icon>
                  供应商和质检数据
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.supplierDefects[selectedMonth - 1]"
                        label="供应商缺陷数量"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入当月供应商缺陷总数"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.qcIgnoreAmounts[selectedMonth - 1]"
                        label="QC漏检数量"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入当月QC漏检总数"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- 客户投诉 -->
              <v-card class="mb-6 pa-4">
                <v-card-title class="subtitle-1">
                  <v-icon class="mr-2">mdi-account-voice</v-icon>
                  客户投诉
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.formalComplaints[selectedMonth - 1]"
                        label="正式投诉数量"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入当月正式客户投诉数量"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="formData.informalComplaints[selectedMonth - 1]"
                        label="非正式投诉数量"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        hint="输入当月非正式客户投诉数量"
                        :rules="[rules.required, rules.nonNegative]"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <div class="d-flex justify-end">
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  :loading="submitting"
                >
                  保存数据
                </v-btn>
              </div>
            </v-form>
          </div>
          <div v-else class="d-flex justify-center align-center" style="height: 300px">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import Message from '../utils/notification'
import { get, post, put } from '../utils/api'

// 表单引用
const form = ref(null);

// 状态变量
const selectedMonth = ref(new Date().getMonth() + 1); // 默认当前月
const submitting = ref(false);
const dataLoaded = ref(false);

// 月份选项
const months = Array.from({ length: 12 }, (_, i) => ({
  title: `${i + 1}月`,
  value: i + 1
}));

// 验证规则
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项',
  nonNegative: v => v >= 0 || '请输入大于等于0的数值'
};

// 表单数据
const formData = reactive({
  id: null,
  scrapRatesTjc: Array(12).fill(0),
  scrapRatesTjm: Array(12).fill(0),
  fttValuesTjc: Array(12).fill(0),
  fttValuesTjm: Array(12).fill(0),
  supplierDefects: Array(12).fill(0),
  qcIgnoreAmounts: Array(12).fill(0),
  formalComplaints: Array(12).fill(0),
  informalComplaints: Array(12).fill(0)
});

// 获取月份数据
const fetchMonthData = async () => {
  dataLoaded.value = false;
  
  try {
    const data = await get('/qa/qad/', { month: selectedMonth.value });
    
    if (data.length > 0) {
      const fetchedData = data[0];
      formData.id = fetchedData.id;
      
      // 更新月份数据 - 确保正确处理0值
      formData.scrapRatesTjc[selectedMonth.value - 1] = parseFloat(fetchedData.scrap_rate_c || 0);
      formData.scrapRatesTjm[selectedMonth.value - 1] = parseFloat(fetchedData.scrap_rate_m || 0);
      formData.fttValuesTjc[selectedMonth.value - 1] = parseFloat(fetchedData.Ftt_tjc || 0);
      formData.fttValuesTjm[selectedMonth.value - 1] = parseFloat(fetchedData.Ftt_tjm || 0);
      formData.supplierDefects[selectedMonth.value - 1] = parseInt(fetchedData.supplier_defect || 0, 10);
      formData.qcIgnoreAmounts[selectedMonth.value - 1] = parseInt(fetchedData.qc_ignore_amount || 0, 10);
      formData.formalComplaints[selectedMonth.value - 1] = parseInt(fetchedData.formal_amount || 0, 10);
      formData.informalComplaints[selectedMonth.value - 1] = parseInt(fetchedData.informal_amount || 0, 10);
    } else {
      // 如果没有数据，初始化为0
      formData.scrapRatesTjc[selectedMonth.value - 1] = 0;
      formData.scrapRatesTjm[selectedMonth.value - 1] = 0;
      formData.fttValuesTjc[selectedMonth.value - 1] = 0;
      formData.fttValuesTjm[selectedMonth.value - 1] = 0;
      formData.supplierDefects[selectedMonth.value - 1] = 0;
      formData.qcIgnoreAmounts[selectedMonth.value - 1] = 0;
      formData.formalComplaints[selectedMonth.value - 1] = 0;
      formData.informalComplaints[selectedMonth.value - 1] = 0;
      formData.id = null; // 重置ID，表示这是新数据
    }
  } catch (error) {
    Message.error(`获取数据失败: ${error.message || '未知错误'}`);
  } finally {
    dataLoaded.value = true;
  }
};

// 提交数据
const submit = async () => {
  const formIsValid = await form.value?.validate();
  if (!formIsValid.valid) return;
  
  submitting.value = true;
  
  try {
    const payload = {
      month: selectedMonth.value,
      year: new Date().getFullYear(),
      supplier_defect: formData.supplierDefects[selectedMonth.value - 1],
      formal_amount: formData.formalComplaints[selectedMonth.value - 1],
      informal_amount: formData.informalComplaints[selectedMonth.value - 1],
      qc_ignore_amount: formData.qcIgnoreAmounts[selectedMonth.value - 1],
      scrap_rate_c: formData.scrapRatesTjc[selectedMonth.value - 1],
      scrap_rate_m: formData.scrapRatesTjm[selectedMonth.value - 1],
      Ftt_tjm: formData.fttValuesTjm[selectedMonth.value - 1],
      Ftt_tjc: formData.fttValuesTjc[selectedMonth.value - 1]
    };
    
    let result;
    if (formData.id) {
      // 更新
      result = await put(`/qa/qad/${formData.id}`, payload);
      Message.success('数据更新成功');
    } else {
      // 新建
      result = await post('/qa/qad/', payload);
      formData.id = result.id;
      Message.success('数据保存成功');
    }
  } catch (error) {
    Message.error(`操作失败: ${error.message || '未知错误'}`);
  } finally {
    submitting.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  fetchMonthData();
});
</script>

<style scoped>
.quality-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.month-selector {
  min-width: 150px;
}

.metric-card {
  border-radius: 8px;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.subtitle-1 {
  font-size: 1.1rem;
  font-weight: 500;
  color: #1976d2;
}

@media (max-width: 768px) {
  .metric-card {
    margin-bottom: 16px;
  }
}
</style>
