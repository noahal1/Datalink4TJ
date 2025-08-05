<template>
  <unified-page-template 
    title="KPI数据导出"
    icon="mdi-export"
    color="success"
  >
    <!-- 导出控制面板 -->
    <div class="export-controls-container">
      <v-card class="export-config-card elevation-2">
        <v-card-title class="export-config-header">
          <div class="config-title-content">
            <v-icon class="config-icon">
              mdi-cog
            </v-icon>
            <span class="config-title-text">导出配置</span>
          </div>
        </v-card-title>
        
        <div class="unified-config-section">
          <!-- 时间范围选择 -->
          <div class="config-group">
            <div class="group-header">
              <div class="group-header-content">
                <v-icon class="group-icon">
                  mdi-calendar-range
                </v-icon>
                <span class="group-title">时间范围</span>
              </div>
              <v-divider class="group-divider" />
            </div>
            
            <div class="group-content">
              <!-- 时间范围选择模式 -->
              <v-radio-group
                v-model="timeRangeMode"
                density="compact"
                class="time-mode-group"
              >
                <v-radio 
                  label="按月导出" 
                  value="month"
                  color="primary"
                />
                <v-radio 
                  label="全年导出" 
                  value="year"
                  color="primary"
                />
              </v-radio-group>
              
              <v-row class="time-selectors">
                <v-col cols="6">
                  <v-select
                    v-model="selectedYear"
                    :items="yearOptions"
                    label="年份"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="time-select"
                  />
                </v-col>
                <v-col
                  v-if="timeRangeMode === 'month'"
                  cols="6"
                >
                  <v-select
                    v-model="selectedMonth"
                    :items="monthOptions"
                    label="月份"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="time-select"
                  />
                </v-col>
                <v-col
                  v-else
                  cols="6"
                >
                  <div class="year-indicator">
                    <v-chip 
                      color="success" 
                      variant="elevated"
                      class="full-year-chip"
                    >
                      <v-icon start>
                        mdi-calendar-check
                      </v-icon>
                      全年数据 (1-12月)
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
            </div>
          </div>

          <!-- KPI类型选择 -->
          <div class="config-group">
            <div class="group-header">
              <div class="group-header-content">
                <v-icon class="group-icon">
                  mdi-chart-line
                </v-icon>
                <span class="group-title">KPI类型选择</span>
              </div>
              <v-chip 
                :color="selectedKpiTypes.length > 0 ? 'success' : 'default'" 
                variant="outlined" 
                size="small"
              >
                已选择 {{ selectedKpiTypes.length }}/{{ kpiTypes.length }}
              </v-chip>
              <v-divider class="group-divider" />
            </div>
            
            <div class="group-content">
              <div class="kpi-selection-controls">
                <v-checkbox-btn
                  v-model="selectAll"
                  label="全选"
                  color="primary"
                  class="select-all-checkbox"
                  @update:model-value="toggleSelectAll"
                />
              </div>
              
              <div class="kpi-types-grid">
                <v-card
                  v-for="kpiType in kpiTypes" 
                  :key="kpiType.key"
                  class="kpi-type-item"
                  :class="{ 'selected': selectedKpiTypes.includes(kpiType.key) }"
                  variant="outlined"
                  @click="toggleKpiType(kpiType.key)"
                >
                  <v-card-text class="kpi-type-content">
                    <v-icon
                      :icon="kpiType.icon"
                      class="kpi-type-icon"
                      size="20"
                    />
                    <span class="kpi-type-name">{{ kpiType.name }}</span>
                    <v-checkbox-btn
                      v-model="selectedKpiTypes"
                      :value="kpiType.key"
                      color="primary"
                      density="compact"
                      class="kpi-type-checkbox"
                      @click.stop
                    />
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </div>

          <!-- 导出格式选择 -->
          <div class="config-group">
            <div class="group-header">
              <div class="group-header-content">
                <v-icon class="group-icon">
                  mdi-file-export
                </v-icon>
                <span class="group-title">导出格式</span>
              </div>
              <v-chip
                color="info"
                variant="outlined"
                size="small"
              >
                {{ exportFormats.find(f => f.key === selectedFormat)?.name || '未选择' }}
              </v-chip>
              <v-divider class="group-divider" />
            </div>
            
            <div class="group-content">
              <div class="format-options">
                <v-card
                  v-for="format in exportFormats"
                  :key="format.key"
                  class="format-option"
                  :class="{ 'selected': selectedFormat === format.key }"
                  variant="outlined"
                  @click="selectedFormat = format.key"
                >
                  <v-card-text class="format-content">
                    <v-icon
                      :icon="format.icon"
                      class="format-icon"
                      size="24"
                    />
                    <div class="format-info">
                      <div class="format-name">
                        {{ format.name }}
                      </div>
                      <div class="format-desc">
                        {{ getFormatDescription(format.key) }}
                      </div>
                    </div>
                    <v-radio
                      v-model="selectedFormat"
                      :value="format.key"
                      color="primary"
                      class="format-radio"
                      @click.stop
                    />
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出按钮区域 -->
        <v-card-actions class="export-actions">
          <div class="export-summary">
            <v-icon class="summary-icon">
              mdi-information
            </v-icon>
            <div class="summary-text">
              <div class="summary-main">
                准备导出 {{ selectedKpiTypes.length }} 种KPI类型
              </div>
              <div class="summary-sub">
                {{ getTimeRangeText() }} • {{ exportFormats.find(f => f.key === selectedFormat)?.name }}
              </div>
            </div>
          </div>
          
          <v-spacer />
          
          <div class="export-buttons">
            <v-btn
              v-if="previewData.length > 0"
              color="default"
              variant="outlined"
              prepend-icon="mdi-refresh"
              class="mr-3"
              @click="previewData.length = 0"
            >
              重置预览
            </v-btn>
            
            <v-btn
              :loading="exporting"
              :disabled="selectedKpiTypes.length === 0"
              color="success"
              size="large"
              prepend-icon="mdi-download"
              variant="elevated"
              class="export-btn"
              @click="exportAllKpiData"
            >
              <template v-if="exporting">
                正在导出...
              </template>
              <template v-else>
                {{ previewData.length > 0 ? '确认导出' : '一键导出' }}
              </template>
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </div>

    <!-- 数据预览区域 -->
    <div
      v-if="previewData.length > 0"
      class="preview-container"
    >
      <v-card class="pa-4">
        <v-card-title class="text-h6 mb-4">
          <v-icon class="mr-2">
            mdi-eye
          </v-icon>
          数据预览 ({{ previewData.length }} 条记录)
        </v-card-title>
        
        <v-data-table
          :headers="previewHeaders"
          :items="previewData"
          :loading="loading"
          density="compact"
          :items-per-page="-1"
          class="preview-table"
        >
          <template #item.achievement_rate="{ item }">
            <v-chip
              :color="getAchievementColor(item.achievement_rate)"
              size="small"
              variant="flat"
            >
              {{ item.achievement_rate }}%
            </v-chip>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- 导出历史 -->
    <div
      v-if="exportHistory.length > 0"
      class="history-container mt-4"
    >
      <v-card class="pa-4">
        <v-card-title class="text-h6 mb-4">
          <v-icon class="mr-2">
            mdi-history
          </v-icon>
          导出历史
        </v-card-title>
        
        <v-list>
          <v-list-item
            v-for="(record, index) in exportHistory"
            :key="index"
            class="mb-2"
          >
            <template #prepend>
              <v-icon :color="record.status === 'success' ? 'success' : 'error'">
                {{ record.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
            </template>
            
            <v-list-item-title>
              {{ record.filename }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              {{ record.date }} - {{ record.types.join(', ') }} - {{ record.format.toUpperCase() }}
            </v-list-item-subtitle>
            
            <template
              v-if="record.status === 'success'"
              #append
            >
              <v-btn
                icon="mdi-download"
                size="small"
                variant="text"
                @click="downloadFile(record)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
  </unified-page-template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '../utils/api'
import Message from '../utils/notification'
import * as XLSX from 'xlsx'

const loading = ref(false)
const exporting = ref(false)

// 时间选择
const timeRangeMode = ref('month') 
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

const monthOptions = [
  { title: '全年', value: 'all' }, // 新增全年选项
  { title: '1月', value: 1 },
  { title: '2月', value: 2 },
  { title: '3月', value: 3 },
  { title: '4月', value: 4 },
  { title: '5月', value: 5 },
  { title: '6月', value: 6 },
  { title: '7月', value: 7 },
  { title: '8月', value: 8 },
  { title: '9月', value: 9 },
  { title: '10月', value: 10 },
  { title: '11月', value: 11 },
  { title: '12月', value: 12 }
]

// KPI类型定义
const kpiTypes = [
  { key: 'production', name: 'Assy', endpoint: '/production/kpi/', icon: 'mdi-factory' },
  { key: 'quality', name: 'QA', endpoint: '/qa/kpi/', icon: 'mdi-quality-high' },
  { key: 'maintenance', name: 'MAT', endpoint: '/maint/kpi/', icon: 'mdi-wrench' },
  { key: 'hr', name: 'HR', endpoint: '/hr/kpi/', icon: 'mdi-account-group' },
  { key: 'ehs', name: 'EHS', endpoint: '/ehs/kpi/', icon: 'mdi-shield-check' },
  { key: 'eng', name: 'ENG', endpoint: '/eng/kpi/', icon: 'mdi-cog' },
  { key: 'logistics', name: 'PC&L', endpoint: '/logistics/kpi/', icon: 'mdi-truck' },
  { key: 'prs', name: 'PRS', endpoint: '/prs/kpi/', icon: 'mdi-stamper' },
  { key: 'gmo', name: 'GMO', endpoint: '/gmo/kpi/', icon: 'mdi-dna' },
]

// 选择状态
const selectedKpiTypes = ref([])
const selectAll = ref(false)

// 导出格式
const exportFormats = [
  { key: 'excel', name: 'Excel (.xlsx)', icon: 'mdi-microsoft-excel' },
  { key: 'csv', name: 'CSV (.csv)', icon: 'mdi-file-delimited' },
  { key: 'json', name: 'JSON (.json)', icon: 'mdi-code-json' }
]
const selectedFormat = ref('excel')

// 数据预览
const previewData = ref([])
const previewHeaders = [
  { title: 'KPI类型', key: 'kpi_type', width: '120px' },
  { title: '时间', key: 'date', width: '100px' },
  { title: '区域', key: 'area', width: '100px' },
  { title: '描述', key: 'description', width: '200px' },
  { title: '实际值', key: 'actual_value', width: '100px' },
  { title: '目标值', key: 'target_value', width: '100px' },
  { title: 'YTD', key: 'ytd_value', width: '100px' }
]

// 导出历史
const exportHistory = ref([])

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedKpiTypes.value = kpiTypes.map(type => type.key)
  } else {
    selectedKpiTypes.value = []
  }
}

// 切换KPI类型选择
const toggleKpiType = (key) => {
  const index = selectedKpiTypes.value.indexOf(key)
  if (index > -1) {
    selectedKpiTypes.value.splice(index, 1)
  } else {
    selectedKpiTypes.value.push(key)
  }
  // 更新全选状态
  selectAll.value = selectedKpiTypes.value.length === kpiTypes.length
}

// 获取格式描述
const getFormatDescription = (format) => {
  const descriptions = {
    excel: '适合数据分析，支持多工作表',
    csv: '轻量级格式，易于导入其他系统',
    json: '结构化数据，适合程序处理'
  }
  return descriptions[format] || ''
}

// 获取时间范围文本
const getTimeRangeText = () => {
  if (timeRangeMode.value === 'year') {
    return `${selectedYear.value}年全年`
  } else {
    return `${selectedYear.value}年${selectedMonth.value}月`
  }
}

// 获取达成率颜色
const getAchievementColor = (rate) => {
  if (rate >= 100) return 'success'
  if (rate >= 80) return 'warning'
  return 'error'
}

// 获取所有KPI数据
const getAllKpiData = async () => {
  loading.value = true
  const allData = []
  
  try {
    for (const kpiType of selectedKpiTypes.value) {
      const typeConfig = kpiTypes.find(t => t.key === kpiType)
      if (!typeConfig) continue
      
      try {
        // 根据时间范围模式确定API调用参数
        if (timeRangeMode.value === 'year') {
          // 全年模式：不传month参数，让后端返回全年数据
          const response = await get(typeConfig.endpoint, {
            params: {
              year: selectedYear.value
            }
          })
          
          if (response.data && response.data.length > 0) {
            const formattedData = response.data.map(item => ({
              kpi_type: typeConfig.name,
              area: item.area || '未指定',
              description: item.description || '未指定',
              ytd_value: item.ytd_value || 0,
              actual_value: item.actual_value || 0,
              target_value: item.target_value || 0,
              month: item.month, // 使用后端返回的月份
              year: selectedYear.value,
            }))
            
            allData.push(...formattedData)
          }
        } else {
          // 按月模式：传递具体的month参数
          const response = await get(typeConfig.endpoint, {
            params: {
              month: selectedMonth.value,
              year: selectedYear.value
            }
          })
          
          if (response.data && response.data.length > 0) {
            const formattedData = response.data.map(item => ({
              kpi_type: typeConfig.name,
              area: item.area || '未指定',
              description: item.description || '未指定',
              ytd_value: item.ytd_value || 0,
              actual_value: item.actual_value || 0,
              target_value: item.target_value || 0,
              month: selectedMonth.value,
              year: selectedYear.value,
            }))
            
            allData.push(...formattedData)
          }
        }
      } catch (error) {
        console.warn(`获取${typeConfig.name}数据失败:`, error)
        Message.warning(`获取${typeConfig.name}数据失败`)
      }
    }
    
    previewData.value = allData
    return allData
    
  } catch (error) {
    console.error('获取KPI数据失败:', error)
    Message.error('获取KPI数据失败')
    return []
  } finally {
    loading.value = false
  }
}

// 导出数据
const exportAllKpiData = async () => {
  if (selectedKpiTypes.value.length === 0) {
    Message.warning('请至少选择一种KPI类型')
    return
  }
  
  exporting.value = true
  
  try {
    // 获取数据
    const data = await getAllKpiData()
    
    if (data.length === 0) {
      Message.warning('没有可导出的数据')
      return
    }
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const typeNames = selectedKpiTypes.value.map(key => 
      kpiTypes.find(t => t.key === key)?.name
    ).join('-')
    const timeRange = timeRangeMode.value === 'year' ? 
      `${selectedYear.value}年全年` : 
      `${selectedYear.value}年${selectedMonth.value}月`
    const filename = `KPI数据导出_${typeNames}_${timeRange}_${timestamp}`
    
    // 根据格式导出
    switch (selectedFormat.value) {
      case 'excel':
        await exportToExcel(data, filename)
        break
      case 'csv':
        await exportToCsv(data, filename)
        break
      case 'json':
        await exportToJson(data, filename)
        break
    }
    
    // 记录导出历史
    exportHistory.value.unshift({
      filename: `${filename}.${selectedFormat.value}`,
      date: new Date().toLocaleString(),
      types: selectedKpiTypes.value.map(key => 
        kpiTypes.find(t => t.key === key)?.name
      ),
      format: selectedFormat.value,
      status: 'success',
      data: data
    })
    
    Message.success(`成功导出 ${data.length} 条KPI数据`)
    
  } catch (error) {
    console.error('导出失败:', error)
    Message.error('导出失败: ' + error.message)
    
    // 记录失败历史
    exportHistory.value.unshift({
      filename: '导出失败',
      date: new Date().toLocaleString(),
      types: selectedKpiTypes.value.map(key => 
        kpiTypes.find(t => t.key === key)?.name
      ),
      format: selectedFormat.value,
      status: 'error'
    })
  } finally {
    exporting.value = false
  }
}

// 导出为Excel
const exportToExcel = async (data, filename) => {
  // 创建工作簿
  const wb = XLSX.utils.book_new()
  
  // 按KPI类型分组数据
  const groupedData = {}
  data.forEach(item => {
    if (!groupedData[item.kpi_type]) {
      groupedData[item.kpi_type] = []
    }
    groupedData[item.kpi_type].push(item)
  })
  
  // 为每个KPI类型创建工作表
  Object.keys(groupedData).forEach(kpiType => {
    const sheetData = groupedData[kpiType]
    const ws = XLSX.utils.json_to_sheet(sheetData)
    
    // 设置列宽
    ws['!cols'] = [
      { width: 15 }, // KPI类型
      { width: 12 }, // 时间
      { width: 10 }, // 区域
      { width: 25 }, // 指标名称
      { width: 12 }, // 实际值
      { width: 12 }, // 目标值
      { width: 12 }, // 达成率
      { width: 10 }  // 单位
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, kpiType)
  })
  
  // 保存文件
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// 导出为CSV
const exportToCsv = (data, filename) => {
  const csvContent = [
    // CSV头部
    ['KPI类型', '时间', '区域', '指标名称', '实际值', '目标值', '达成率(%)'].join(','),
    // CSV数据
    ...data.map(row => [
      `"${row.kpi_type}"`,
      `"${row.date}"`,
      `"${row.area}"`,
      `"${row.description}"`,
      row.actual_value,
      row.target_value
    ].join(','))
  ].join('\n')
  
  // 添加BOM以支持中文
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  
  URL.revokeObjectURL(link.href)
}

// 导出为JSON
const exportToJson = (data, filename) => {
  const jsonContent = JSON.stringify({
    export_info: {
      timestamp: new Date().toISOString(),
      year: selectedYear.value,
      month: selectedMonth.value,
      kpi_types: selectedKpiTypes.value,
      total_records: data.length
    },
    data: data
  }, null, 2)
  
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.json`
  link.click()
  
  URL.revokeObjectURL(link.href)
}

// 下载历史文件
const downloadFile = (record) => {
  if (record.data) {
    const filename = record.filename.substring(0, record.filename.lastIndexOf('.'))
    switch (record.format) {
      case 'excel':
        exportToExcel(record.data, filename)
        break
      case 'csv':
        exportToCsv(record.data, filename)
        break
      case 'json':
        exportToJson(record.data, filename)
        break
    }
  }
}

// 组件挂载时预加载数据
onMounted(() => {
  getAllKpiData()
})
</script>

<style scoped>
/* 导出页面主容器 */
.export-controls-container {
  margin-bottom: 32px;
}

/* 导出配置卡片 */
.export-config-card {
  border-radius: 16px !important;
  overflow: hidden;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.export-config-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* 配置标题区域 */
.export-config-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 24px 20px 24px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-title-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-icon {
  color: #3b82f6;
  font-size: 24px;
}

.config-title-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

/* 统一配置区域 */
.unified-config-section {
  padding: 24px;
}

/* 配置组 */
.config-group {
  margin-bottom: 32px;
}

.config-group:last-child {
  margin-bottom: 0;
}

/* 组标题 */
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.group-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-icon {
  color: #3b82f6;
  font-size: 22px;
}

.group-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.2rem;
}

.group-divider {
  width: 100%;
  margin: 16px 0 0 0;
  opacity: 0.3;
}

/* 组内容 */
.group-content {
  padding-left: 32px;
}

/* 时间范围样式 */
.time-mode-group {
  margin-bottom: 16px;
}

.time-selectors {
  margin: 0;
}

.time-select :deep(.v-field) {
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.02);
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.time-select :deep(.v-field:hover) {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.05);
}

.year-indicator {
  display: flex;
  align-items: center;
  height: 40px;
}

.full-year-chip {
  font-weight: 500;
}

/* KPI类型选择 */
.kpi-selection-controls {
  margin-bottom: 20px;
}

.select-all-checkbox {
  border-radius: 8px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
}

.kpi-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.kpi-type-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px !important;
  background: #ffffff;
}

.kpi-type-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.kpi-type-item.selected {
  border-color: #22c55e;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(134, 239, 172, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.kpi-type-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px !important;
}

.kpi-type-icon {
  color: #6b7280;
}

.kpi-type-item.selected .kpi-type-icon {
  color: #22c55e;
}

.kpi-type-name {
  flex: 1;
  font-weight: 500;
  color: #374151;
}

.kpi-type-item.selected .kpi-type-name {
  color: #059669;
  font-weight: 600;
}

.kpi-type-checkbox {
  margin: 0;
}

/* 格式选择区域 */
.format-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.format-option {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px !important;
  background: #ffffff;
}

.format-option:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.format-option.selected {
  border-color: #a855f7;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(196, 181, 253, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.2);
}

.format-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px !important;
}

.format-icon {
  color: #6b7280;
  flex-shrink: 0;
}

.format-option.selected .format-icon {
  color: #a855f7;
}

.format-info {
  flex: 1;
}

.format-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.format-option.selected .format-name {
  color: #7c3aed;
}

.format-desc {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.format-radio {
  margin: 0;
}

/* 导出操作区域 */
.export-actions {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #e2e8f0;
  padding: 20px 24px !important;
  display: flex;
  align-items: center;
  gap: 16px;
}

.export-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-icon {
  color: #3b82f6;
  font-size: 20px;
}

.summary-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-main {
  font-weight: 600;
  color: #1e293b;
}

.summary-sub {
  font-size: 0.875rem;
  color: #64748b;
}

.export-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-btn {
  border-radius: 8px !important;
  font-weight: 600;
  padding: 0 24px !important;
  height: 44px !important;
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
}

/* 数据预览和历史区域 */
.preview-container,
.history-container {
  margin-top: 32px;
}

.preview-container .v-card,
.history-container .v-card {
  border-radius: 16px !important;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.preview-table {
  border-radius: 12px;
  overflow: hidden;
}

.preview-table :deep(thead tr th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.preview-table :deep(tbody tr:hover) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 197, 253, 0.03) 100%);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .kpi-types-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .format-options {
    grid-template-columns: 1fr;
  }
  
  .group-content {
    padding-left: 20px;
  }
}

@media (max-width: 768px) {
  .export-config-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .unified-config-section {
    padding: 16px;
  }
  
  .group-content {
    padding-left: 16px;
  }
  
  .kpi-types-grid {
    grid-template-columns: 1fr;
  }
  
  .export-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .export-buttons {
    width: 100%;
    justify-content: flex-end;
  }
  
  .export-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .group-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .group-content {
    padding-left: 0;
  }
  
  .export-summary {
    width: 100%;
  }
  
  .summary-text {
    width: 100%;
  }
}
</style>