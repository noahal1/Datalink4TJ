<template>
  <div class="pa-4">
    <v-card>
      <v-card-title>组件加载测试</v-card-title>
      <v-card-text>
        <v-btn
          color="primary"
          class="mr-2"
          @click="testAdminUserComponent"
        >
          测试 AdminUser 组件加载
        </v-btn>
        <v-btn
          color="secondary"
          class="mr-2"
          @click="testDirectImport"
        >
          测试直接导入
        </v-btn>
        <v-btn
          color="success"
          @click="testComponentMap"
        >
          测试组件映射表
        </v-btn>
        
        <v-divider class="my-4" />
        
        <div v-if="testResults.length > 0">
          <h3>测试结果:</h3>
          <v-list>
            <v-list-item
              v-for="(result, index) in testResults"
              :key="index"
            >
              <v-list-item-content>
                <v-list-item-title>{{ result.test }}</v-list-item-title>
                <v-list-item-subtitle :class="result.success ? 'success--text' : 'error--text'">
                  {{ result.message }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const testResults = ref([])

const addResult = (test, success, message) => {
  testResults.value.push({ test, success, message })
}

const testAdminUserComponent = async () => {
  try {
    console.log('开始测试 AdminUser 组件加载...')
    const { componentMap } = await import('../router/dynamic')
    
    if (componentMap.AdminUser) {
      console.log('AdminUser 组件在映射表中找到')
      const component = await componentMap.AdminUser()
      console.log('AdminUser 组件加载成功:', component)
      addResult('AdminUser 组件加载', true, '组件加载成功')
    } else {
      console.error('AdminUser 组件在映射表中未找到')
      addResult('AdminUser 组件加载', false, '组件在映射表中未找到')
    }
  } catch (error) {
    console.error('AdminUser 组件加载失败:', error)
    addResult('AdminUser 组件加载', false, `加载失败: ${error.message}`)
  }
}

const testDirectImport = async () => {
  try {
    console.log('开始测试直接导入...')
    const component = await import('../pages/admin/Users.vue')
    console.log('直接导入成功:', component)
    addResult('直接导入 Users.vue', true, '直接导入成功')
  } catch (error) {
    console.error('直接导入失败:', error)
    addResult('直接导入 Users.vue', false, `直接导入失败: ${error.message}`)
  }
}

const testComponentMap = async () => {
  try {
    console.log('开始测试组件映射表...')
    const { componentMap, getAvailableComponents } = await import('../router/dynamic')
    
    const availableComponents = getAvailableComponents()
    console.log('可用组件列表:', availableComponents)
    
    const hasAdminUser = availableComponents.includes('AdminUser')
    addResult('组件映射表检查', hasAdminUser, 
      hasAdminUser ? `AdminUser 在映射表中，共有 ${availableComponents.length} 个组件` 
                   : `AdminUser 不在映射表中，可用组件: ${availableComponents.join(', ')}`)
  } catch (error) {
    console.error('组件映射表测试失败:', error)
    addResult('组件映射表检查', false, `测试失败: ${error.message}`)
  }
}
</script>
