<template>
  <v-container>
    <v-card class="pa-6">
      <v-card-title class="headline primary--text">
        质量数据管理
      </v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="submit">
          <!-- 报废率模块 -->
          <v-subheader class="pl-0">报废率</v-subheader>
          <v-row>
            <v-col cols="4">
              <v-select
                v-model="selectedMonths.scrapRate"
                :items="months"
                label="选择月份"
                :rules="[rules.required]"
                @change="fetchData('scrapRate')"></v-select>
            </v-col>
            <v-col cols="4">
              <v-select
                v-model="selectedFactory"
                :items="factory"
                label="选择厂区"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="currentScrapRate"
                label="当月报废率"
                type="number"
                min="0"
                :rules="[rules.required, rules.positive]"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-6"></v-divider>

          <!-- 供应商缺陷和QC漏检 -->
          <v-row>
            <v-col cols="6">
              <v-subheader class="pl-0">供应商缺陷</v-subheader>
              <v-row>
                <v-col cols="6">
                  <v-select
                    v-model="selectedMonths.defect"
                    :items="months"
                    label="选择月份"
                    :rules="[rules.required]"
                    @change="fetchData('defect')"></v-select>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="formData.supplierDefects[selectedMonths.defect - 1]"
                    label="缺陷数量"
                    type="number"
                    min="0"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="6">
              <v-subheader class="pl-0">QC漏检数量</v-subheader>
              <v-row>
                <v-col cols="6">
                  <v-select
                    v-model="selectedMonths.qcIgnore"
                    :items="months"
                    label="选择月份"
                    :rules="[rules.required]"
                    @change="fetchData('qcIgnore')"></v-select>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="formData.qcIgnoreAmounts[selectedMonths.qcIgnore - 1]"
                    label="漏检数量"
                    type="number"
                    min="0"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <v-divider class="my-6"></v-divider>

          <!-- 客户投诉模块 -->
          <v-row>
            <v-col cols="6">
              <v-subheader class="pl-0">正式客户投诉</v-subheader>
              <v-row>
                <v-col cols="6">
                  <v-select
                    v-model="selectedMonths.formalComplaint"
                    :items="months"
                    label="选择月份"
                    :rules="[rules.required]"
                    @change="fetchData('formalComplaint')"></v-select>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="formData.formalComplaints[selectedMonths.formalComplaint - 1]"
                    label="客诉数量"
                    type="number"
                    min="0"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="6">
              <v-subheader class="pl-0">非正式客户投诉</v-subheader>
              <v-row>
                <v-col cols="6">
                  <v-select
                    v-model="selectedMonths.informalComplaint"
                    :items="months"
                    label="选择月份"
                    :rules="[rules.required]"
                    @change="fetchData('informalComplaint')"></v-select>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="formData.informalComplaints[selectedMonths.informalComplaint - 1]"
                    label="客诉数量"
                    type="number"
                    min="0"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <v-divider class="my-6"></v-divider>

          <!-- FTT模块 -->
          <v-subheader class="pl-0">FTT</v-subheader>
          <v-row>
            <v-col cols="4">
              <v-select
                v-model="selectedMonths.ftt"
                :items="months"
                label="选择月份"
                :rules="[rules.required]"
                @change="fetchData('ftt')"></v-select>
            </v-col>
            <v-col cols="4">
              <v-select
                v-model="selectedFactory"
                :items="factory"
                label="选择厂区"
                :rules="[rules.required]"
              ></v-select>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="currentFttValue"
                label="FTT值"
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
            :loading="submitting">
            {{ formData.id ? '更新数据' : '提交数据' }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const currentMonth = new Date().getMonth() + 1;

// 统一管理所有月份选择
const selectedMonths = reactive({
  scrapRate: currentMonth,
  defect: currentMonth,
  qcIgnore: currentMonth,
  formalComplaint: currentMonth,
  informalComplaint: currentMonth,
  ftt: currentMonth
});

const selectedFactory = ref('TJM');
const factory = ["TJM", "TJC"];
const months = Array.from({ length: 12 }, (_, i) => ({ 
  title: `${i + 1}月`, 
  value: i + 1 
}));

// 表单数据结构
const formData = reactive({
  id: null,
  scrapRatesTjm: Array(12).fill(0),
  scrapRatesTjc: Array(12).fill(0),
  supplierDefects: Array(12).fill(0),
  qcIgnoreAmounts: Array(12).fill(0),
  formalComplaints: Array(12).fill(0),
  informalComplaints: Array(12).fill(0),
  fttValuesTjm: Array(12).fill(0),
  fttValuesTjc: Array(12).fill(0)
});

// 校验规则
const rules = {
  required: value => !!value || '必填字段',
  positive: value => value >= 0 || '不能为负数'
};

const submitting = ref(false);
const form = ref(null);

// 计算属性
const currentScrapRate = computed({
  get: () => selectedFactory.value === 'TJM' 
    ? formData.scrapRatesTjm[selectedMonths.scrapRate - 1] 
    : formData.scrapRatesTjc[selectedMonths.scrapRate - 1],
  set: (val) => {
    if(selectedFactory.value === 'TJM') {
      formData.scrapRatesTjm[selectedMonths.scrapRate - 1] = val;
    } else {
      formData.scrapRatesTjc[selectedMonths.scrapRate - 1] = val;
    }
  }
});

const currentFttValue = computed({
  get: () => selectedFactory.value === 'TJM' 
    ? formData.fttValuesTjm[selectedMonths.ftt - 1] 
    : formData.fttValuesTjc[selectedMonths.ftt - 1],
  set: (val) => {
    if(selectedFactory.value === 'TJM') {
      formData.fttValuesTjm[selectedMonths.ftt - 1] = val;
    } else {
      formData.fttValuesTjc[selectedMonths.ftt - 1] = val;
    }
  }
});

// 数据提交
const submit = async () => {
  if (!await form.value.validate()) return;
  submitting.value = true;

  try {
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id 
      ? `${API_BASE_URL}/qa/qad/${formData.id}`
      : `${API_BASE_URL}/qa/qad/`;

    const payload = {
      month: selectedMonths.ftt,
      year: new Date().getFullYear(),
      supplier_defect: formData.supplierDefects[selectedMonths.ftt - 1],
      formal_amount: formData.formalComplaints[selectedMonths.ftt - 1],
      informal_amount: formData.informalComplaints[selectedMonths.ftt - 1],
      qc_ignore_amount: formData.qcIgnoreAmounts[selectedMonths.ftt - 1],
      scrap_rate_c: formData.scrapRatesTjc[selectedMonths.ftt - 1],
      scrap_rate_m: formData.scrapRatesTjm[selectedMonths.ftt - 1],
      Ftt_tjm: formData.fttValuesTjm[selectedMonths.ftt - 1],
      Ftt_tjc: formData.fttValuesTjc[selectedMonths.ftt - 1]
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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

// 带防抖的数据获取
const fetchData = debounce(async (type) => {
  try {
    const response = await fetch(`${API_BASE_URL}/qa/qad/?month=${selectedMonths[type]}`);
    const data = await response.json();
    
    if (data.length > 0) {
      const fetchedData = data[0];
      formData.id = fetchedData.id;
      
      // 更新对应模块的数据
      const updateArray = (target, source, month) => {
        target[month - 1] = Number(source);
      };

      updateArray(formData.scrapRatesTjm, fetchedData.scrap_rate_m, fetchedData.month);
      updateArray(formData.scrapRatesTjc, fetchedData.scrap_rate_c, fetchedData.month);
      updateArray(formData.supplierDefects, fetchedData.supplier_defect, fetchedData.month);
      updateArray(formData.qcIgnoreAmounts, fetchedData.qc_ignore_amount, fetchedData.month);
      updateArray(formData.formalComplaints, fetchedData.formal_amount, fetchedData.month);
      updateArray(formData.informalComplaints, fetchedData.informal_amount, fetchedData.month);
      updateArray(formData.fttValuesTjm, fetchedData.Ftt_tjm, fetchedData.month);
      updateArray(formData.fttValuesTjc, fetchedData.Ftt_tjc, fetchedData.month);
    }
  } catch (error) {
    showMessage(`获取数据失败: ${error.message}`, 'error');
  }
}, 300);

// 消息提示
const showMessage = (message, type) => {
  console[type === 'error' ? 'error' : 'log'](message);
};

onMounted(() => {
  fetchData('ftt'); // 默认加载FTT数据
});
</script>

<style scoped>
.v-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.v-subheader {
  font-size: 1.1rem;
  font-weight: 500;
  color: #1976d2;
}

.v-divider {
  border-color: rgba(0, 0, 0, 0.1);
}

.v-btn {
  letter-spacing: 1px;
  font-weight: 500;
}
</style>
