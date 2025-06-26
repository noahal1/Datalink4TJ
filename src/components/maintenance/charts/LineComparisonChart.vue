<template>
  <div class="chart-container">
    <v-card>
      <v-card-title>线体性能对比</v-card-title>
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <span class="text-subtitle-2 mr-4">对比指标:</span>
          <v-chip-group
            v-model="selectedMetrics"
            column
            multiple
            selected-class="bg-primary text-white"
          >
            <v-chip
              v-for="metric in availableMetrics"
              :key="metric.value"
              :value="metric.value"
              filter
              variant="outlined"
            >
              {{ metric.text }}
            </v-chip>
          </v-chip-group>
        </div>
        
        <div id="equipment-comparison" style="height: 350px;">
          <v-skeleton-loader v-if="loading" type="image" height="350"></v-skeleton-loader>
          <v-chart 
            v-else 
            class="chart" 
            :option="chartOption" 
            autoresize
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      lines: [],
      metrics: [],
      values: []
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// 可选的指标列表
const availableMetrics = [
  { text: 'OEE', value: 'oee' },
  { text: 'MTTR', value: 'mttr' },
  { text: 'MTBF', value: 'mtbf' },
  { text: '停机时间', value: 'downtime' },
  { text: '可动率', value: 'availability' }
];

// 默认选中所有指标
const selectedMetrics = ref(['oee', 'mttr', 'mtbf', 'downtime', 'availability']);

// 指标映射到原始数据中的索引
const metricIndexMap = {
  'availability': 0, // 可动率
  'downtime': 1,     // 计划停机
  'outplan_downtime': 2, // 非计划停机
  'oee': 3,          // OEE
  'stability': 4     // 运行稳定性
};

// 指标显示名称映射
const metricNameMap = {
  'oee': 'OEE',
  'mttr': 'MTTR',
  'mtbf': 'MTBF',
  'downtime': '停机时间',
  'availability': '可动率'
};

// 指标值转换函数 - 将原始数据转换为雷达图所需格式
const transformMetricValue = (metricName, value, isInverse = false) => {
  // MTTR和停机时间是越低越好，需要反转值
  if (isInverse) {
    return 100 - value;
  }
  return value;
};

// 线体对比图配置
const chartOption = computed(() => {
  const data = props.chartData;
  if (!data.lines || !data.metrics || !data.values || data.lines.length === 0) {
    return {
      tooltip: {},
      legend: { data: [] },
      radar: { indicator: [] },
      series: []
    };
  }
  
  // 根据选中的指标过滤显示的数据
  const filteredMetrics = [];
  const filteredValues = data.lines.map(() => []);
  
  // 构建指标和对应的最大值
  selectedMetrics.value.forEach(metric => {
    filteredMetrics.push({
      name: metricNameMap[metric] || metric,
      max: 100
    });
    
    // 获取该指标在原始数据中的索引
    let metricIndex = -1;
    
    if (metric === 'mttr') {
      // MTTR可能需要从其他数据源获取或计算
      metricIndex = -1; // 特殊处理
    } else if (metric === 'mtbf') {
      // MTBF可能需要从其他数据源获取或计算
      metricIndex = -1; // 特殊处理
    } else {
      metricIndex = metricIndexMap[metric];
    }
    
    // 为每个线体添加该指标的值
    data.lines.forEach((line, lineIndex) => {
      if (metricIndex >= 0 && metricIndex < data.values[lineIndex].length) {
        // 从原始数据获取值
        let value = data.values[lineIndex][metricIndex];
        
        // MTTR和停机时间是越低越好，需要反转值
        if (metric === 'downtime' || metric === 'outplan_downtime') {
          value = transformMetricValue(metric, value, true);
        }
        
        filteredValues[lineIndex].push(value);
      } else if (metric === 'mttr') {
        // 模拟MTTR数据 - 实际项目中应从真实数据源获取
        // MTTR值越低越好，所以用100减去模拟值
        const mockValue = 100 - Math.round(30 + Math.random() * 40);
        filteredValues[lineIndex].push(mockValue);
      } else if (metric === 'mtbf') {

        const mockValue = Math.round(60 + Math.random() * 40);
        filteredValues[lineIndex].push(mockValue);
      } else {
        // 如果没有数据，使用默认值
        filteredValues[lineIndex].push(50);
      }
    });
  });
  
  return {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: data.lines,
      bottom: 0
    },
    radar: {
      indicator: filteredMetrics,
      radius: '65%',
      center: ['50%', '50%'],
      name: {
        textStyle: {
          color: '#333',
          fontSize: 14
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: data.lines.map((line, index) => ({
          value: filteredValues[index],
          name: line,
          areaStyle: {
            opacity: 0.1
          }
        }))
      }
    ]
  };
});

// 监听选中指标变化
watch(selectedMetrics, () => {
  // 确保至少选择一个指标
  if (selectedMetrics.value.length === 0) {
    selectedMetrics.value = ['availability'];
  }
}, { deep: true });
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  margin-bottom: 24px;
}
</style> 