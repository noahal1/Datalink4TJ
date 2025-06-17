<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <metrics-list
          :metrics="metricsList"
          :loading="loadingMetrics"
          @add-metric="openMetricDialog()"
          @edit-metric="editMetric"
          @delete-metric="deleteMetric"
        />
      </v-col>
    </v-row>
    
    <!-- 维修数据指标对话框 -->
    <metrics-dialog
      v-model="metricDialog"
      v-model:metric="editedMetric"
      :is-new="editedMetricIndex === -1"
      :loading="savingMetric"
      @save="saveMetric"
      @close="closeMetricDialog"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user.js'
import Message from '../utils/notification'
import MetricsList from '../components/maintenance/MetricsList.vue'
import MetricsDialog from '../components/maintenance/MetricsDialog.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const userStore = useUserStore()

// 维修数据指标相关数据
const metricsList = ref([])
const loadingMetrics = ref(false)
const savingMetric = ref(false)
const metricDialog = ref(false)
const editedMetricIndex = ref(-1)
const editedMetric = ref({
  id: null,
  equipment_type: '',
  date: new Date().toISOString().split('T')[0],
  downtime_count: 0,
  downtime_minutes: 0,
  parts_produced: 0,
  user_id: userStore.userId
})

// 加载维修数据指标
const loadMetrics = async () => {
  try {
    loadingMetrics.value = true
    
    const response = await fetch(`${API_BASE_URL}/maint/metrics?user_id=${userStore.userId}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('获取维修数据指标失败')
    }
    
    const data = await response.json()
    metricsList.value = data
    
  } catch (error) {
    console.error('加载维修数据指标出错:', error)
    Message.error('加载维修数据指标失败')
  } finally {
    loadingMetrics.value = false
  }
}

// 打开维修数据指标对话框
const openMetricDialog = (metric = null) => {
  if (metric) {
    // 编辑现有指标
    editedMetricIndex.value = metricsList.value.indexOf(metric)
    editedMetric.value = { ...metric }
  } else {
    // 创建新指标
    editedMetricIndex.value = -1
    editedMetric.value = {
      id: null,
      equipment_type: '',
      date: new Date().toISOString().split('T')[0],
      downtime_count: 0,
      downtime_minutes: 0,
      parts_produced: 0,
      user_id: userStore.userId
    }
  }
  metricDialog.value = true
}

// 关闭维修数据指标对话框
const closeMetricDialog = () => {
  metricDialog.value = false
}

// 编辑维修数据指标
const editMetric = (metric) => {
  openMetricDialog(metric)
}

// 保存维修数据指标
const saveMetric = async () => {
  try {
    savingMetric.value = true
    
    // 验证表单
    if (!editedMetric.value.equipment_type) {
      Message.warning('请选择设备类型')
      return
    }
    
    // 准备请求数据
    const metricData = {
      equipment_type: editedMetric.value.equipment_type,
      date: editedMetric.value.date,
      downtime_count: parseInt(editedMetric.value.downtime_count),
      downtime_minutes: parseFloat(editedMetric.value.downtime_minutes),
      parts_produced: parseInt(editedMetric.value.parts_produced),
      user_id: userStore.userId
    }
    
    let response
    
    if (editedMetricIndex.value === -1) {
      // 创建新指标
      response = await fetch(`${API_BASE_URL}/maint/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(metricData)
      })
    } else {
      // 更新现有指标
      response = await fetch(`${API_BASE_URL}/maint/metrics/${editedMetric.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        },
        body: JSON.stringify(metricData)
      })
    }
    
    if (!response.ok) {
      throw new Error('保存维修数据指标失败')
    }
    
    // 关闭对话框
    metricDialog.value = false
    
    // 重新加载数据
    await loadMetrics()
    
    // 提示成功
    Message.success(editedMetricIndex.value === -1 ? '指标创建成功' : '指标更新成功')
    
  } catch (error) {
    console.error('保存维修数据指标出错:', error)
    Message.error('保存维修数据指标失败')
  } finally {
    savingMetric.value = false
  }
}

// 删除维修数据指标
const deleteMetric = async (metric) => {
  try {
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/maint/metrics/${metric.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('删除维修数据指标失败')
    }
    
    // 重新加载数据
    await loadMetrics()
    
    // 提示成功
    Message.success('维修数据指标删除成功')
    
  } catch (error) {
    console.error('删除维修数据指标出错:', error)
    Message.error('删除维修数据指标失败')
  }
}

// 生命周期钩子
onMounted(() => {
  loadMetrics()
})
</script>