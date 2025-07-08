<template>
  <v-container>
    <v-card>
      <v-card-title>路由调试信息</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <h3>当前路由信息</h3>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>路径: {{ $route.path }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>名称: {{ $route.name }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>匹配的路由: {{ $route.matched.length }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
          
          <v-col cols="12" md="6">
            <h3>路由统计</h3>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>总路由数: {{ totalRoutes }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>静态路由数: {{ staticRoutes }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>动态路由数: {{ dynamicRoutes }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
        
        <v-divider class="my-4"></v-divider>
        
        <h3>所有路由列表</h3>
        <v-data-table
          :headers="headers"
          :items="allRoutes"
          :items-per-page="10"
          class="elevation-1"
        >
          <template v-slot:item.component="{ item }">
            <v-chip size="small" :color="getComponentColor(item.component)">
              {{ getComponentName(item.component) }}
            </v-chip>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn 
              size="small" 
              variant="text" 
              color="primary"
              @click="testRoute(item.path)"
              :disabled="!item.path || item.path === $route.path"
            >
              测试
            </v-btn>
          </template>
        </v-data-table>
        
        <v-divider class="my-4"></v-divider>
        
        <h3>组件注册状态</h3>
        <v-card variant="outlined" class="mb-4">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>注册状态: {{ registrationStatus.isRegistered ? '✅ 已注册' : '❌ 未注册' }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>注册中: {{ registrationStatus.isRegistering ? '🔄 是' : '⏸️ 否' }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>前端组件数: {{ registrationStatus.componentCount }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <v-btn
                  color="primary"
                  @click="registerComponents"
                  :loading="registering"
                  class="mr-2"
                >
                  重新注册组件
                </v-btn>
                <v-btn
                  color="secondary"
                  @click="refreshRegistrationStatus"
                  :loading="refreshingStatus"
                >
                  刷新状态
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <h3>组件映射测试</h3>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedComponent"
              :items="componentOptions"
              label="选择组件进行测试"
              variant="outlined"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn
              color="primary"
              @click="testComponentImport"
              :loading="testingComponent"
              :disabled="!selectedComponent"
            >
              测试组件导入
            </v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="componentTestResult"
          :type="componentTestResult.success ? 'success' : 'error'"
          class="mt-4"
        >
          {{ componentTestResult.message }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { componentMap } from '../router/dynamic'
import componentRegistrationService from '../services/componentRegistrationService'

const router = useRouter()
const route = useRoute()

const selectedComponent = ref('')
const testingComponent = ref(false)
const componentTestResult = ref(null)

// 组件注册相关状态
const registering = ref(false)
const refreshingStatus = ref(false)
const registrationStatus = ref({
  isRegistered: false,
  isRegistering: false,
  componentCount: 0,
  availableComponents: []
})

const headers = [
  { title: '路径', key: 'path', align: 'start' },
  { title: '名称', key: 'name', align: 'start' },
  { title: '组件', key: 'component', align: 'start' },
  { title: '操作', key: 'actions', align: 'center', sortable: false }
]

const allRoutes = computed(() => {
  return router.getRoutes().map(route => ({
    path: route.path,
    name: route.name,
    component: route.component
  }))
})

const totalRoutes = computed(() => router.getRoutes().length)
const staticRoutes = computed(() => {
  // 假设静态路由是在初始化时就存在的
  return router.getRoutes().filter(r => 
    r.path.startsWith('/') && 
    !r.path.includes(':') && 
    r.path !== '/:pathMatch(.*)*'
  ).length
})
const dynamicRoutes = computed(() => totalRoutes.value - staticRoutes.value)

const componentOptions = computed(() => {
  return Object.keys(componentMap).map(name => ({
    title: name,
    value: name
  }))
})

const getComponentName = (component) => {
  if (!component) return '无'
  if (typeof component === 'function') return '懒加载组件'
  if (typeof component === 'string') return component
  return '未知类型'
}

const getComponentColor = (component) => {
  if (!component) return 'grey'
  if (typeof component === 'function') return 'success'
  if (typeof component === 'string') return 'info'
  return 'warning'
}

const testRoute = (path) => {
  if (path && path !== route.path) {
    router.push(path).catch(err => {
      console.error('路由跳转失败:', err)
    })
  }
}

const testComponentImport = async () => {
  if (!selectedComponent.value) return

  testingComponent.value = true
  componentTestResult.value = null

  try {
    const componentLoader = componentMap[selectedComponent.value]
    if (!componentLoader) {
      throw new Error(`组件 ${selectedComponent.value} 不存在于映射表中`)
    }

    const component = await componentLoader()
    componentTestResult.value = {
      success: true,
      message: `组件 ${selectedComponent.value} 导入成功！`
    }
    console.log('组件导入成功:', component)
  } catch (error) {
    componentTestResult.value = {
      success: false,
      message: `组件 ${selectedComponent.value} 导入失败: ${error.message}`
    }
    console.error('组件导入失败:', error)
  } finally {
    testingComponent.value = false
  }
}

// 组件注册相关方法
const registerComponents = async () => {
  registering.value = true
  try {
    const success = await componentRegistrationService.registerComponents()
    if (success) {
      await refreshRegistrationStatus()
    }
  } catch (error) {
    console.error('重新注册组件失败:', error)
  } finally {
    registering.value = false
  }
}

const refreshRegistrationStatus = async () => {
  refreshingStatus.value = true
  try {
    registrationStatus.value = componentRegistrationService.getRegistrationStatus()
  } finally {
    refreshingStatus.value = false
  }
}

onMounted(() => {
  console.log('RouteDebug 页面已挂载')
  console.log('当前路由:', route)
  console.log('所有路由:', router.getRoutes())

  // 初始化组件注册状态
  refreshRegistrationStatus()
})
</script>
