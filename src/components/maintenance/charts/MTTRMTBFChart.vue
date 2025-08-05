<template>
  <div class="chart-container">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>MTTR和MTBF趋势</span>
        <v-spacer />
        <v-chip
          v-if="chartData.length > 0"
          color="primary"
          size="small"
          class="ml-2"
        >
          {{ chartData.length }} 条数据
        </v-chip>
      </v-card-title>
      <v-card-subtitle
        v-if="chartData.length === 0 && !loading"
        class="text-error"
      >
        <v-icon
          small
          class="mr-1"
        >
          mdi-alert
        </v-icon>
        未找到符合条件的数据
      </v-card-subtitle>
      <v-card-text class="position-relative">
        <!-- 加载状态指示器 -->
        <div
          v-if="loading"
          class="chart-loading-overlay d-flex justify-center align-center"
        >
          <v-progress-circular
            indeterminate
            color="primary"
            class="me-2"
          />
          <span>加载数据中...</span>
        </div>
        <div
          id="mttr-mtbf-chart"
          style="height: 300px;"
        >
          <v-skeleton-loader
            v-if="loading"
            type="image"
            height="300"
          />
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
import { getLineColor, getMTTRMTBFColors } from '../../../utils/colors';
import { format } from 'date-fns';
const formatDate = (date) => format(date, 'MM-dd');
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

// MTTR和MTBF趋势图配置
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
        mttrValues: [],
        mtbfValues: [],
        unplannedCounts: []
      };
    }
    
    lineShiftGroups[key].dates.push(item.date);
    lineShiftGroups[key].mttrValues.push(item.mttr);
    lineShiftGroups[key].mtbfValues.push(item.mtbf);
    lineShiftGroups[key].unplannedCounts.push(item.unplanned_count || 0);
  });
  
  // 获取所有唯一日期并排序
  const allDates = [...new Set(props.chartData.map(item => item.date))].sort().map(date => formatDate(date));
  
  // 准备系列数据
  const series = [];
  const legendData = [];
  
  // 为每个线体-班次组合创建MTTR和MTBF系列
  Object.values(lineShiftGroups).forEach((group, index) => {
    // 使用工具类中的颜色函数
    const colors = getMTTRMTBFColors(group.line);
    
    // MTTR系列
    const mttrName = `${group.line} ${group.shift} MTTR`;
    legendData.push(mttrName);
    series.push({
      name: mttrName,
      type: 'bar',
      data: group.mttrValues,
      itemStyle: {
        color: colors[0]
      },
      barGap: group.shift === '白班' ? '30%' : '0%',
      barWidth: group.shift === '白班' ? 10 : 6
    });
    
    // MTBF系列
    const mtbfName = `${group.line} ${group.shift} MTBF`;
    legendData.push(mtbfName);
    series.push({
      name: mtbfName,
      type: 'line',
      yAxisIndex: 1,
      data: group.mtbfValues,
      itemStyle: {
        color: colors[1]
      },
      lineStyle: {
        width: group.shift === '白班' ? 3 : 2,
        type: group.shift === '白班' ? 'solid' : 'dashed'
      },
      symbol: group.shift === '白班' ? 'circle' : 'diamond',
      symbolSize: group.shift === '白班' ? 8 : 6
    });
    
    // 停机次数系列
    const countName = `${group.line} ${group.shift} 停机次数`;
    legendData.push(countName);
    series.push({
      name: countName,
      type: 'line',
      yAxisIndex: 2,
      data: group.unplannedCounts,
      itemStyle: {
        color: colors[2]
      },
      lineStyle: {
        width: 2,
        type: group.shift === '白班' ? 'solid' : 'dashed'
      },
      symbol: group.shift === '白班' ? 'square' : 'triangle',
      symbolSize: 6
    });
  });
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        
        // 按系列名称分组显示
        const mttrParams = params.filter(p => p.seriesName.includes('MTTR'));
        const mtbfParams = params.filter(p => p.seriesName.includes('MTBF'));
        const countParams = params.filter(p => p.seriesName.includes('停机次数'));
        
        // 添加MTTR信息
        mttrParams.forEach(param => {
            result += `${param.seriesName}: ${param.value}分钟<br/>`;
        });
        
        // 添加MTBF信息
        mtbfParams.forEach(param => {
            result += `${param.seriesName}: ${param.value}分钟<br/>`;
        });
        
        // 添加停机次数信息
        countParams.forEach(param => {
          result += `${param.seriesName}: ${param.value}次<br/>`;
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
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'MTTR (分钟)',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: 'MTBF (分钟)',
        position: 'right',
        axisLine: {
          lineStyle: {
            color: '#E53935'
          }
        },
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '停机次数',
        position: 'right',
        offset: 80,
        axisLine: {
          lineStyle: {
            color: '#9C27B0'
          }
        },
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
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