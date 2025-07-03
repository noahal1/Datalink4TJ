<template>
  <div class="component-mapping-debug">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-puzzle</v-icon>
              组件映射调试工具
            </v-card-title>
            <v-card-subtitle>
              检查API返回组件与硬编码组件映射表的一致性
            </v-card-subtitle>
            
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title class="text-h6">
                      <v-icon left color="primary">mdi-server</v-icon>
                      API返回组件 ({{ apiComponents.length }})
                    </v-card-title>
                    <v-card-text>
                      <v-chip-group column>
                        <v-chip
                          v-for="component in apiComponents"
                          :key="component"
                          :color="isComponentMapped(component) ? 'success' : 'error'"
                          text-color="white"
                          small
                        >
                          {{ component }}
                          <v-icon right small v-if="!isComponentMapped(component)">
                            mdi-alert
                          </v-icon>
                        </v-chip>
                      </v-chip-group>
                      <v-alert
                        v-if="apiComponents.length === 0"
                        type="warning"
                        dense
                        text
                      >
                        未获取到API组件数据
                      </v-alert>
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-title class="text-h6">
                      <v-icon left color="orange">mdi-code-braces</v-icon>
                      硬编码组件映射 ({{ mappedComponents.length }})
                    </v-card-title>
                    <v-card-text>
                      <v-chip-group column>
                        <v-chip
                          v-for="component in mappedComponents"
                          :key="component"
                          :color="isComponentUsedByApi(component) ? 'success' : 'warning'"
                          text-color="white"
                          small
                        >
                          {{ component }}
                          <v-icon right small v-if="!isComponentUsedByApi(component) && component !== 'DefaultLayout'">
                            mdi-help
                          </v-icon>
                        </v-chip>
                      </v-chip-group>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              
              <!-- 一致性检查结果 -->
              <v-row class="mt-4">
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title class="text-h6">
                      <v-icon left :color="validationResult.isConsistent ? 'success' : 'error'">
                        {{ validationResult.isConsistent ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                      </v-icon>
                      一致性检查结果
                    </v-card-title>
                    <v-card-text>
                      <v-alert
                        :type="validationResult.isConsistent ? 'success' : 'error'"
                        dense
                        text
                      >
                        {{ validationResult.isConsistent ? '✅ 组件映射一致' : '❌ 组件映射不一致' }}
                      </v-alert>
                      
                      <div v-if="!validationResult.isConsistent">
                        <v-alert
                          v-if="validationResult.missingInMap.length > 0"
                          type="error"
                          dense
                          text
                          class="mt-2"
                        >
                          <strong>缺失映射的组件：</strong>
                          <v-chip-group class="mt-2">
                            <v-chip
                              v-for="component in validationResult.missingInMap"
                              :key="component"
                              color="error"
                              text-color="white"
                              small
                            >
                              {{ component }}
                            </v-chip>
                          </v-chip-group>
                        </v-alert>
                        
                        <v-alert
                          v-if="validationResult.missingInApi.length > 0"
                          type="warning"
                          dense
                          text
                          class="mt-2"
                        >
                          <strong>未被API使用的组件：</strong>
                          <v-chip-group class="mt-2">
                            <v-chip
                              v-for="component in validationResult.missingInApi"
                              :key="component"
                              color="warning"
                              text-color="white"
                              small
                            >
                              {{ component }}
                            </v-chip>
                          </v-chip-group>
                        </v-alert>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              
              <!-- 操作按钮 -->
              <v-row class="mt-4">
                <v-col cols="12">
                  <v-btn
                    @click="refreshData"
                    color="primary"
                    :loading="loading"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    刷新数据
                  </v-btn>
                  
                  <v-btn
                    @click="showGeneratedCode = !showGeneratedCode"
                    color="info"
                    class="ml-2"
                  >
                    <v-icon left>mdi-code-tags</v-icon>
                    {{ showGeneratedCode ? '隐藏' : '显示' }}生成的代码
                  </v-btn>
                </v-col>
              </v-row>
              
              <!-- 生成的代码 -->
              <v-row v-if="showGeneratedCode" class="mt-4">
                <v-col cols="12">
                  <v-card outlined>
                    <v-card-title class="text-h6">
                      <v-icon left>mdi-code-braces</v-icon>
                      建议的组件映射代码
                    </v-card-title>
                    <v-card-text>
                      <pre class="generated-code">{{ generatedCode }}</pre>
                      <v-btn
                        @click="copyToClipboard"
                        color="success"
                        small
                        class="mt-2"
                      >
                        <v-icon left small>mdi-content-copy</v-icon>
                        复制代码
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { 
  getAvailableComponents, 
  validateComponentMapping, 
  generateComponentMapCode 
} from '../router/dynamic'
import routeService from '../services/routeService'

export default {
  name: 'ComponentMappingDebug',
  data() {
    return {
      apiComponents: [],
      mappedComponents: [],
      validationResult: {
        isConsistent: true,
        missingInMap: [],
        missingInApi: [],
        totalMapped: 0,
        totalFromApi: 0
      },
      loading: false,
      showGeneratedCode: false,
      generatedCode: ''
    }
  },
  
  async mounted() {
    await this.refreshData()
  },
  
  methods: {
    async refreshData() {
      this.loading = true
      try {
        // 获取硬编码的组件映射
        this.mappedComponents = getAvailableComponents()
        
        // 获取API返回的路由数据
        const routes = await routeService.getNavigationTree()
        this.apiComponents = this.extractComponentsFromRoutes(routes)
        
        // 执行一致性检查
        this.validationResult = validateComponentMapping(this.apiComponents)
        
        // 生成建议的代码
        this.generatedCode = generateComponentMapCode(this.apiComponents)
        
      } catch (error) {
        console.error('刷新数据失败:', error)
        this.$toast.error('刷新数据失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    
    extractComponentsFromRoutes(routes) {
      const components = []
      if (!routes || !Array.isArray(routes)) return components
      
      routes.forEach(route => {
        if (route.component && typeof route.component === 'string') {
          components.push(route.component)
        }
        if (route.children && Array.isArray(route.children)) {
          components.push(...this.extractComponentsFromRoutes(route.children))
        }
      })
      
      return [...new Set(components)] // 去重
    },
    
    isComponentMapped(component) {
      return this.mappedComponents.includes(component)
    },
    
    isComponentUsedByApi(component) {
      return this.apiComponents.includes(component) || component === 'DefaultLayout'
    },
    
    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.generatedCode)
        this.$toast.success('代码已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        this.$toast.error('复制失败')
      }
    }
  }
}
</script>

<style scoped>
.component-mapping-debug {
  padding: 20px;
}

.generated-code {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
}
</style>
