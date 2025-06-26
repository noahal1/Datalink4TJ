<template>
  <div class="chart-container">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>OEE和设备可动率趋势</span>
        <v-spacer></v-spacer>
        <v-chip v-if="chartData.length > 0" color="primary" size="small" class="ml-2">
          {{ chartData.length }} 条数据
        </v-chip>
      </v-card-title>
      <v-card-subtitle v-if="chartData.length === 0 && !loading" class="text-error">
        <v-icon small class="mr-1">mdi-alert</v-icon>
        未找到符合条件的数据
      </v-card-subtitle>
      <v-card-text class="position-relative">
        <!-- 加载状态指示器 -->
        <div v-if="loading" class="chart-loading-overlay d-flex justify-center align-center">
          <v-progress-circular indeterminate color="primary" class="me-2"></v-progress-circular>
          <span>加载数据中...</span>
        </div>
        <div id="oee-chart" style="height: 300px;">
          <v-skeleton-loader v-if="loading" type="image" height="300"></v-skeleton-loader>
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
import { computed } from 'vue';
import { getLineColor, getLineColorPair } from '../../../utils/colors';
import { format } from 'date-fns';

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// OEE和设备可动率趋势图配置
const chartOption = computed(() => {
  // 确保chartData是数组
  if (!Array.isArray(props.chartData)) {
    return {
      tooltip: {},
      xAxis: { data: [] },
      yAxis: {},
      series: []
    };
  }
  
  console.log('生成OEE趋势图配置，数据量:', props.chartData.length);
  
  // 按线体和班次分组数据
  const lineShiftGroups = {};
  
  props.chartData.forEach(item => {
    // 提取线体和班次信息
    const line = item.line || '未知线体';
    const shift = item.shift_code === 1 ? '白班' : (item.shift_code === 2 ? '夜班' : '全部班次');
    const key = `${line}-${shift}`;
    
    if (!lineShiftGroups[key]) {
      lineShiftGroups[key] = {
        line,
        shift,
        dates: [],
        oeeValues: [],
        availabilityValues: []
      };
    }
    
    // 确保不重复添加同一日期的数据
    if (!lineShiftGroups[key].dates.includes(item.date)) {
      lineShiftGroups[key].dates.push(item.date);
      
      // 确保数值有效
      const oeeValue = typeof item.oee === 'number' ? item.oee.toFixed(1) : 
                     (parseFloat(item.oee) || 0).toFixed(1);
      const availabilityValue = typeof item.availability === 'number' ? item.availability.toFixed(1) : 
                              (parseFloat(item.availability) || 0).toFixed(1);
      
      lineShiftGroups[key].oeeValues.push(oeeValue);
      lineShiftGroups[key].availabilityValues.push(availabilityValue);
    }
  });
  const formatDate = (date) => format(new Date(date), 'MM-dd');
  // 获取所有唯一日期并排序
  const allDates = [...new Set(props.chartData.map(item => item.date))].sort().map(date => formatDate(date));
  // 准备系列数据
  const series = [];
  const legendData = [];
  
  const processedGroups = [];
  
  // 为每个线体-班次组合创建OEE和可动率系列
  Object.values(lineShiftGroups).forEach((group, index) => {
    processedGroups.push(`${group.line}-${group.shift}`);
    
    // 使用工具类中的颜色函数
    const colors = getLineColorPair(group.line);
    
    // 确保日期和值的数组长度匹配
    if (group.dates.length === group.oeeValues.length && 
        group.dates.length === group.availabilityValues.length) {
      
      // OEE系列
      const oeeName = `${group.line} ${group.shift} OEE`;
      legendData.push(oeeName);
      series.push({
        name: oeeName,
        type: 'line',
        data: group.oeeValues,
        itemStyle: {
          color: colors[0]
        },
        lineStyle: {
          width: group.shift === '白班' ? 3 : 2,
          type: group.shift === '白班' ? 'solid' : 'dashed'
        },
        symbol: group.shift === '白班' ? 'circle' : 'diamond',
        symbolSize: 6
      });
      
      // 可动率系列
      const availName = `${group.line} ${group.shift} 可动率`;
      legendData.push(availName);
      series.push({
        name: availName,
        type: 'line',
        data: group.availabilityValues,
        itemStyle: {
          color: colors[1]
        },
        lineStyle: {
          width: group.shift === '白班' ? 3 : 2,
          type: group.shift === '白班' ? 'solid' : 'dashed'
        },
        symbol: group.shift === '白班' ? 'circle' : 'diamond',
        symbolSize: 6
      });
    } else {
      console.warn(`数据长度不匹配: ${group.line} ${group.shift}, 日期长度: ${group.dates.length}, OEE值长度: ${group.oeeValues.length}, 可动率值长度: ${group.availabilityValues.length}`);
    }
  });
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          // 确保显示为百分比
          const value = parseFloat(param.value);
          result += `${param.seriesName}: ${value}%<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: legendData,
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0
    },
    grid: {
      left: '1%',
      right: '1%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: allDates,
      axisLabel: {
        rotate: 40
      }
    },
    yAxis: {
      type: 'value',
      name: '百分比(%)',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: series
  };
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}

/* 图表加载状态指示器样式 */
.chart-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0 0 12px 12px;
}

.position-relative {
  position: relative;
}
</style> 