<template>
  <div class="pa-4">
    <h2>API调试测试页面</h2>
    
    <v-card class="mb-4">
      <v-card-title>测试数据</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="testDataJson"
          label="测试数据 (JSON格式)"
          rows="10"
          variant="outlined"
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="testApi" color="primary" :loading="loading">
          测试 PUT /qa API
        </v-btn>
        <v-btn @click="resetTestData" color="secondary">
          重置测试数据
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>请求信息</v-card-title>
      <v-card-text>
        <div><strong>数据类型:</strong> {{ dataType }}</div>
        <div><strong>数据长度:</strong> {{ dataLength }}</div>
        <div><strong>是否为数组:</strong> {{ isArray }}</div>
      </v-card-text>
    </v-card>

    <v-card v-if="response">
      <v-card-title>响应结果</v-card-title>
      <v-card-text>
        <pre>{{ response }}</pre>
      </v-card-text>
    </v-card>

    <v-card v-if="error" color="error" class="mt-4">
      <v-card-title>错误信息</v-card-title>
      <v-card-text>
        <pre>{{ error }}</pre>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '../utils/api'

const loading = ref(false)
const testDataJson = ref('')
const response = ref(null)
const error = ref(null)

// 默认测试数据
const defaultTestData = [
  {
    line: "swi",
    day: "1",
    month: "7",
    year: "2025",
    value: "100",
    scrapflag: false
  },
  {
    line: "rwh",
    day: "1",
    month: "7", 
    year: "2025",
    value: "150",
    scrapflag: false
  }
]

// 初始化测试数据
testDataJson.value = JSON.stringify(defaultTestData, null, 2)

const parsedData = computed(() => {
  try {
    return JSON.parse(testDataJson.value)
  } catch (e) {
    return null
  }
})

const dataType = computed(() => {
  const data = parsedData.value
  return data ? typeof data : 'invalid'
})

const dataLength = computed(() => {
  const data = parsedData.value
  return Array.isArray(data) ? data.length : 'N/A'
})

const isArray = computed(() => {
  return Array.isArray(parsedData.value)
})

const testApi = async () => {
  loading.value = true
  response.value = null
  error.value = null

  try {
    const data = parsedData.value
    
    if (!data) {
      throw new Error('无效的JSON数据')
    }

    console.group('🧪 API测试')
    console.log('发送数据类型:', typeof data)
    console.log('是否为数组:', Array.isArray(data))
    console.log('数据内容:', data)
    console.groupEnd()

    const result = await api.put('/qa', data)
    response.value = JSON.stringify(result, null, 2)
    
  } catch (err) {
    console.error('API测试失败:', err)
    error.value = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        data: err.config?.data
      }
    }
  } finally {
    loading.value = false
  }
}

const resetTestData = () => {
  testDataJson.value = JSON.stringify(defaultTestData, null, 2)
  response.value = null
  error.value = null
}

// 测试不同的数据格式
const testFormats = () => {
  const formats = [
    {
      name: '正确格式 (数组)',
      data: defaultTestData
    },
    {
      name: '错误格式 (对象)',
      data: defaultTestData[0]
    },
    {
      name: '空数组',
      data: []
    },
    {
      name: 'null值',
      data: null
    }
  ]
  
  console.group('🧪 测试不同数据格式')
  formats.forEach(format => {
    console.log(`${format.name}:`, format.data)
  })
  console.groupEnd()
}

// 页面加载时运行测试
testFormats()
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>
