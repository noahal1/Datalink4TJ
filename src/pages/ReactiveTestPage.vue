<template>
  <v-container>
    <v-card>
      <v-card-title>响应式对象处理测试</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <h3>测试表单</h3>
            <v-form>
              <v-text-field
                v-model="testForm.name"
                label="名称"
                variant="outlined"
                density="compact"
                class="mb-2"
              />
              <v-text-field
                v-model="testForm.email"
                label="邮箱"
                variant="outlined"
                density="compact"
                class="mb-2"
              />
              <v-textarea
                v-model="testForm.description"
                label="描述"
                variant="outlined"
                density="compact"
                class="mb-2"
              />
              <v-text-field
                v-model="testForm.age"
                label="年龄"
                type="number"
                variant="outlined"
                density="compact"
                class="mb-2"
              />
            </v-form>
            
            <v-btn 
              color="primary" 
              @click="testApiCall"
              :loading="testing"
              class="mr-2"
            >
              测试API调用
            </v-btn>
            
            <v-btn 
              color="secondary" 
              @click="testReactiveUtils"
              class="mr-2"
            >
              测试工具函数
            </v-btn>
            
            <v-btn 
              color="warning" 
              @click="createCircularRef"
            >
              创建循环引用
            </v-btn>
          </v-col>
          
          <v-col cols="12" md="6">
            <h3>测试结果</h3>
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1">原始表单数据</v-card-title>
              <v-card-text>
                <pre>{{ JSON.stringify(testForm, null, 2) }}</pre>
              </v-card-text>
            </v-card>
            
            <v-card variant="outlined" class="mb-4" v-if="processedData">
              <v-card-title class="text-subtitle-1">处理后数据</v-card-title>
              <v-card-text>
                <pre>{{ JSON.stringify(processedData, null, 2) }}</pre>
              </v-card-text>
            </v-card>
            
            <v-card variant="outlined" v-if="testResults.length > 0">
              <v-card-title class="text-subtitle-1">测试日志</v-card-title>
              <v-card-text>
                <div v-for="(result, index) in testResults" :key="index" class="mb-2">
                  <v-chip 
                    :color="result.type === 'success' ? 'success' : result.type === 'error' ? 'error' : 'info'"
                    size="small"
                    class="mr-2"
                  >
                    {{ result.type }}
                  </v-chip>
                  {{ result.message }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { post } from '@/utils/api'
import { 
  toPlainObject, 
  processFormData, 
  hasCircularReference, 
  debugReactiveState,
  safeStringify 
} from '@/utils/reactiveUtils'

// 响应式数据
const testing = ref(false)
const testResults = ref([])
const processedData = ref(null)

// 测试表单 - 使用reactive创建响应式对象
const testForm = reactive({
  name: '张三',
  email: 'zhangsan@example.com',
  description: '这是一个测试描述',
  age: 25
})

// 添加测试结果
const addResult = (type, message) => {
  testResults.value.push({
    type,
    message,
    timestamp: new Date().toLocaleTimeString()
  })
}

// 测试API调用
const testApiCall = async () => {
  testing.value = true
  testResults.value = []
  
  try {
    addResult('info', '开始测试API调用...')
    
    // 检查原始数据是否有循环引用
    const hasCircular = hasCircularReference(testForm)
    addResult(hasCircular ? 'warning' : 'success', 
      `原始数据循环引用检查: ${hasCircular ? '发现循环引用' : '无循环引用'}`)
    
    // 处理数据
    processedData.value = processFormData(testForm)
    addResult('success', '数据处理完成')
    
    // 模拟API调用（这里使用一个不存在的端点来测试）
    try {
      await post('/test/reactive-data', testForm)
      addResult('success', 'API调用成功')
    } catch (error) {
      if (error.message.includes('circular')) {
        addResult('error', 'API调用失败: 循环引用错误')
      } else {
        addResult('info', `API调用失败 (预期): ${error.message}`)
      }
    }
    
  } catch (error) {
    addResult('error', `测试失败: ${error.message}`)
  } finally {
    testing.value = false
  }
}

// 测试工具函数
const testReactiveUtils = () => {
  testResults.value = []
  
  addResult('info', '开始测试工具函数...')
  
  // 测试 toPlainObject
  const plainObj = toPlainObject(testForm)
  addResult('success', `toPlainObject 转换成功`)
  
  // 测试 processFormData
  const formData = processFormData(testForm, { trimStrings: true, removeEmpty: true })
  processedData.value = formData
  addResult('success', `processFormData 处理成功`)
  
  // 测试 safeStringify
  const jsonStr = safeStringify(testForm, 2)
  addResult('success', `safeStringify 序列化成功，长度: ${jsonStr.length}`)
  
  // 测试 hasCircularReference
  const hasCircular = hasCircularReference(testForm)
  addResult(hasCircular ? 'warning' : 'success', 
    `循环引用检查: ${hasCircular ? '发现循环引用' : '无循环引用'}`)
  
  // 调试响应式状态
  debugReactiveState(testForm, '测试表单')
  addResult('info', '响应式状态已输出到控制台')
}

// 创建循环引用进行测试
const createCircularRef = () => {
  testResults.value = []
  
  addResult('info', '创建循环引用对象进行测试...')
  
  // 创建一个有循环引用的对象
  const circularObj = {
    name: '循环引用测试',
    data: testForm
  }
  circularObj.self = circularObj // 创建循环引用
  
  // 测试检测
  const hasCircular = hasCircularReference(circularObj)
  addResult(hasCircular ? 'warning' : 'error', 
    `循环引用检测: ${hasCircular ? '成功检测到循环引用' : '未检测到循环引用'}`)
  
  // 测试处理
  try {
    const processed = toPlainObject(circularObj)
    addResult('success', '循环引用对象处理成功')
    processedData.value = processed
  } catch (error) {
    addResult('error', `循环引用对象处理失败: ${error.message}`)
  }
  
  // 测试安全序列化
  const safeJson = safeStringify(circularObj)
  addResult('success', `安全序列化成功，结果长度: ${safeJson.length}`)
}
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
