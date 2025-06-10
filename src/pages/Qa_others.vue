<template>
  <unified-page-template 
    title="质量数据管理"
    icon="mdi-clipboard-check-outline"
    color="primary"
  >
    <template #header-actions>
      <v-chip 
        color="white" 
        text-color="primary"
        label 
        class="font-weight-bold"
        size="large"
      >
        {{ new Date().getFullYear() }}年 {{ selectedMonth }}月
      </v-chip>
    </template>
    
    <!-- 月份选择器 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
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
          prepend-inner-icon="mdi-calendar-month"
        ></v-select>
      </v-col>
    </v-row>

    <v-divider class="mb-6"></v-divider>

    <!-- 内容区域 -->
    <v-expand-transition>
      <div v-if="dataLoaded">
        <unified-form ref="form" @submit="submit">
          <!-- 关键指标卡片 -->
          <v-row class="mb-6">
            <v-col cols="12" md="6" lg="3">
              <unified-stats-card
                title="FTT (First Time Through)"
                icon="mdi-check-circle-outline"
                color="primary"
              >
                <template #value>
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="formData.fttValuesTjc[selectedMonth - 1]"
                        label="TJC"
                        type="number"
                        min="0"
                        max="100"
                        variant="outlined"
                        density="comfortable"
                        suffix="%"
                        :rules="[rules.required, rules.nonNegative]"
                        @input="handleInput"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="formData.fttValuesTjm[selectedMonth - 1]"
                        label="TJM"
                        type="number"
                        min="0"
                        max="100"
                        variant="outlined"
                        density="comfortable"
                        suffix="%"
                        :rules="[rules.required, rules.nonNegative]"
                        @input="handleInput"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </template>
              </unified-stats-card>
            </v-col>
            
            <v-col cols="12" md="6" lg="3">
              <unified-stats-card
                title="报废率 (Cost of Scrap)"
                icon="mdi-recycle"
                color="error"
              >
                <template #value>
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="formData.scrapRatesTjc[selectedMonth - 1]"
                        label="TJC"
                        type="number"
                        min="0"
                        max="100"
                        variant="outlined"
                        density="comfortable"
                        suffix="%"
                        :rules="[rules.required, rules.nonNegative]"
                        @input="handleInput"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="formData.scrapRatesTjm[selectedMonth - 1]"
                        label="TJM"
                        type="number"
                        min="0"
                        max="100"
                        variant="outlined"
                        density="comfortable"
                        suffix="%"
                        :rules="[rules.required, rules.nonNegative]"
                        @input="handleInput"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </template>
              </unified-stats-card>
            </v-col>
            
            <v-col cols="12" md="6" lg="3">
              <unified-stats-card
                title="供应商缺陷"
                icon="mdi-alert-circle-outline"
                color="warning"
              >
                <template #value>
                  <v-text-field
                    v-model.number="formData.supplierDefects[selectedMonth - 1]"
                    label="缺陷数量"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="comfortable"
                    :rules="[rules.required, rules.nonNegative]"
                    @input="handleInput"
                  ></v-text-field>
                </template>
              </unified-stats-card>
            </v-col>
            
            <v-col cols="12" md="6" lg="3">
              <unified-stats-card
                title="客户投诉"
                icon="mdi-comment-alert-outline"
                color="info"
              >
                <template #value>
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="formData.formalComplaints[selectedMonth - 1]"
                        label="正式"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required, rules.nonNegative]"
                        @input="handleInput"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model.number="formData.informalComplaints[selectedMonth - 1]"
                        label="非正式"
                        type="number"
                        min="0"
                        variant="outlined"
                        density="comfortable"
                        :rules="[rules.required, rules.nonNegative]"
                        @input="handleInput"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </template>
              </unified-stats-card>
            </v-col>
          </v-row>

          <!-- KPI 数据表格 -->
          <unified-data-table
            title="KPI 详细数据"
            icon="mdi-table"
            :headers="headers"
            :items="kpiData"
            :loading="loading"
            density="comfortable"
            class="mb-6"
          >
            <template v-slot:item.newFactory="{ item }">
              <v-text-field
                v-model.number="item.raw.newFactory"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                hide-details
                class="text-field-small"
                @input="handleInput"
              ></v-text-field>
            </template>
            
            <template v-slot:item.oldFactory="{ item }">
              <v-text-field
                v-model.number="item.raw.oldFactory"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                hide-details
                class="text-field-small"
                @input="handleInput"
              ></v-text-field>
            </template>
            
            <template v-slot:item.total="{ item }">
              <v-text-field
                v-model.number="item.raw.total"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                hide-details
                class="text-field-small"
                @input="handleInput"
              ></v-text-field>
            </template>
            
            <template v-slot:item.description="{ item }">
              <div :class="{'highlighted-row': isHighlightedKpi(item.raw.description)}">
                {{ item.raw.description }}
              </div>
            </template>
          </unified-data-table>

          <div class="d-flex justify-end">
            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="submitting"
              prepend-icon="mdi-content-save"
            >
              保存数据
            </v-btn>
          </div>
        </unified-form>
      </div>
      <div v-else class="d-flex justify-center align-center" style="height: 300px">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>
    </v-expand-transition>
  </unified-page-template>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import Message from '../utils/notification'
import { get, post, put } from '../utils/api'
import { debounce } from 'lodash'

// 表单引用
const form = ref(null);

// 状态变量
const selectedMonth = ref(new Date().getMonth() + 1); // 默认当前月
const submitting = ref(false);
const dataLoaded = ref(false);
const isDataChanged = ref(false);
const loading = ref(false);

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

// 表格头部
const headers = [
  { title: '区域', key: 'area', align: 'start', width: '100px' },
  { title: 'KPI 描述', key: 'description', align: 'start' },
  { title: '新厂', key: 'newFactory', align: 'center', width: '150px' },
  { title: '老厂', key: 'oldFactory', align: 'center', width: '150px' },
  { title: '汇总', key: 'total', align: 'center', width: '150px' },
];

// KPI 数据
const kpiData = ref([
  { id: 1, area: '新厂', description: 'Customer Defects', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 2, area: '老厂', description: 'Customer Defects', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 3, area: '汇总', description: 'Customer Defects', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 4, area: '新厂', description: 'PPM', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 5, area: '老厂', description: 'PPM', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 6, area: '汇总', description: 'PPM', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 7, area: '新厂', description: 'Supplier Defects', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 8, area: '老厂', description: 'Supplier Defects', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 9, area: '汇总', description: 'Supplier Defects', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 10, area: '新厂', description: 'Cost of Quality(failure cost only)', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 11, area: '老厂', description: 'Cost of Quality(failure cost only)', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 12, area: '汇总', description: 'Cost of Quality(failure cost only)', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 13, area: '新厂', description: 'Customer Chargebacks', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 14, area: '老厂', description: 'Customer Chargebacks', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 15, area: '汇总', description: 'Customer Chargebacks', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 16, area: '新厂', description: 'Customer Chargebacks%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 17, area: '老厂', description: 'Customer Chargebacks%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 18, area: '汇总', description: 'Customer Chargebacks%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 19, area: '新厂', description: 'Customer Warranty', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 20, area: '老厂', description: 'Customer Warranty', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 21, area: '汇总', description: 'Customer Warranty', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 22, area: '新厂', description: 'Customer Warranty%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 23, area: '老厂', description: 'Customer Warranty%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 24, area: '汇总', description: 'Customer Warranty%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 25, area: '新厂', description: 'Supplier RDR', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 26, area: '老厂', description: 'Supplier RDR', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 27, area: '汇总', description: 'Supplier RDR', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 28, area: '新厂', description: 'Supplier RDR%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 29, area: '老厂', description: 'Supplier RDR%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 30, area: '汇总', description: 'Supplier RDR%', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 31, area: '新厂', description: 'Cost of Scrap', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 32, area: '老厂', description: 'Cost of Scrap', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 33, area: '汇总', description: 'Cost of Scrap', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 34, area: '新厂', description: 'Magna FTT - Quality Performance (New)', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 35, area: '老厂', description: 'Magna FTT - Quality Performance (New)', newFactory: 0, oldFactory: 0, total: 0 },
  { id: 36, area: '汇总', description: 'Magna FTT - Quality Performance (New)', newFactory: 0, oldFactory: 0, total: 0 },
]);

// 原始数据，用于比较变更
const originalKpiData = ref([]);

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

// 检查是否是需要高亮的KPI
const isHighlightedKpi = (description) => {
  return description === 'Cost of Scrap' || description === 'Magna FTT - Quality Performance (New)';
};

// 输入处理
const handleInput = debounce(() => {
  isDataChanged.value = true;
}, 500);

// 获取月份数据
const fetchMonthData = async () => {
  dataLoaded.value = false;
  loading.value = true;
  
  try {
    // 获取基本数据
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
    
    // 获取KPI数据
    try {
      const kpiData = await get('/qa/kpi/', { month: selectedMonth.value });
      if (kpiData && kpiData.length > 0) {
        // 将API返回的数据映射到表格数据
        kpiData.forEach(item => {
          const existingItem = kpiData.value.find(
            k => k.area === item.area && k.description === item.description
          );
          
          if (existingItem) {
            existingItem.newFactory = item.new_factory;
            existingItem.oldFactory = item.old_factory;
            existingItem.total = item.total;
          }
        });
      }
    } catch (error) {
      console.error('获取KPI数据失败:', error);
      // 不阻止整个页面加载，使用默认值
    }
    
    // 保存原始数据用于比较
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value));
    
  } catch (error) {
    Message.error(`获取数据失败: ${error.message || '未知错误'}`);
  } finally {
    dataLoaded.value = true;
    loading.value = false;
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
    
    // 保存KPI数据
    const kpiPayload = {
      month: selectedMonth.value,
      year: new Date().getFullYear(),
      items: kpiData.value.map(item => ({
        area: item.area,
        description: item.description,
        new_factory: item.newFactory,
        old_factory: item.oldFactory,
        total: item.total
      }))
    };
    
    await put('/qa/kpi/', kpiPayload);
    
    // 重置数据变更标志
    isDataChanged.value = false;
    
    // 更新原始数据
    originalKpiData.value = JSON.parse(JSON.stringify(kpiData.value));
    
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
.month-selector {
  min-width: 180px;
}

.text-field-small {
  max-width: 120px;
  margin: 0 auto;
}

.highlighted-row {
  font-weight: 500;
  color: var(--primary);
}

@media (max-width: 960px) {
  .metric-card {
    margin-bottom: 16px;
  }
}
</style>
