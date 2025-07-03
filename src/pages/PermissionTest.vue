<template>
  <v-container fluid>
    <v-card elevation="3">
      <v-card-title class="d-flex align-center py-4 px-6">
        <v-icon class="mr-2" color="primary">mdi-shield-check</v-icon>
        <div class="text-h5 font-weight-medium">权限系统测试</div>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="refreshPermissions" :loading="loading">
          <v-icon start>mdi-refresh</v-icon>
          刷新权限
        </v-btn>
      </v-card-title>
      
      <v-card-text class="pa-6">
        <v-row>
          <!-- 用户信息 -->
          <v-col cols="12" md="6">
            <v-card outlined>
              <v-card-title class="text-h6">用户信息</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item>
                    <v-list-item-title>用户名</v-list-item-title>
                    <v-list-item-subtitle>{{ userStore.user || '未登录' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>部门</v-list-item-title>
                    <v-list-item-subtitle>{{ userStore.department || '未分配' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>登录状态</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="userStore.isLogin ? 'success' : 'error'" size="small">
                        {{ userStore.isLogin ? '已登录' : '未登录' }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 角色信息 -->
          <v-col cols="12" md="6">
            <v-card outlined>
              <v-card-title class="text-h6">角色信息</v-card-title>
              <v-card-text>
                <v-chip-group column>
                  <v-chip
                    v-for="role in userRoles"
                    :key="role.id || role"
                    color="primary"
                    variant="outlined"
                  >
                    {{ typeof role === 'object' ? role.name : role }}
                  </v-chip>
                </v-chip-group>
                <div v-if="!userRoles.length" class="text-grey">
                  未分配角色
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 权限代码 -->
          <v-col cols="12">
            <v-card outlined>
              <v-card-title class="text-h6">权限代码</v-card-title>
              <v-card-text>
                <v-chip-group column>
                  <v-chip
                    v-for="code in permissionCodes"
                    :key="code"
                    color="success"
                    variant="outlined"
                    size="small"
                  >
                    {{ code }}
                  </v-chip>
                </v-chip-group>
                <div v-if="!permissionCodes.length" class="text-grey">
                  无权限代码
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 权限测试 -->
          <v-col cols="12">
            <v-card outlined>
              <v-card-title class="text-h6">权限测试</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="testPermissionCode"
                      label="测试权限代码"
                      placeholder="例如: admin_access"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center">
                    <v-btn
                      color="primary"
                      @click="testPermission"
                      :disabled="!testPermissionCode"
                    >
                      测试权限
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-chip
                      v-if="testResult !== null"
                      :color="testResult ? 'success' : 'error'"
                    >
                      {{ testResult ? '有权限' : '无权限' }}
                    </v-chip>
                  </v-col>
                </v-row>
                
                <!-- 常用权限测试 -->
                <v-divider class="my-4"></v-divider>
                <div class="text-subtitle-1 mb-3">常用权限测试</div>
                <v-row>
                  <v-col
                    v-for="permission in commonPermissions"
                    :key="permission.code"
                    cols="12" sm="6" md="4"
                  >
                    <v-card outlined>
                      <v-card-text class="text-center">
                        <div class="text-subtitle-2">{{ permission.name }}</div>
                        <div class="text-caption text-grey mb-2">{{ permission.code }}</div>
                        <v-chip
                          :color="permissionStore.hasPermission(permission.code) ? 'success' : 'error'"
                          size="small"
                        >
                          {{ permissionStore.hasPermission(permission.code) ? '有权限' : '无权限' }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 可访问路由 -->
          <v-col cols="12">
            <v-card outlined>
              <v-card-title class="text-h6">可访问路由</v-card-title>
              <v-card-text>
                <v-expansion-panels>
                  <v-expansion-panel
                    v-for="route in accessibleRoutes"
                    :key="route.id"
                  >
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">{{ route.meta?.icon || 'mdi-link' }}</v-icon>
                      {{ route.meta?.title || route.name }}
                      <v-spacer></v-spacer>
                      <v-chip size="small" color="primary" variant="outlined">
                        {{ route.path }}
                      </v-chip>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div v-if="route.children && route.children.length">
                        <div class="text-subtitle-2 mb-2">子路由:</div>
                        <v-list dense>
                          <v-list-item
                            v-for="child in route.children"
                            :key="child.id"
                          >
                            <template v-slot:prepend>
                              <v-icon size="small">{{ child.meta?.icon || 'mdi-link' }}</v-icon>
                            </template>
                            <v-list-item-title>{{ child.meta?.title || child.name }}</v-list-item-title>
                            <v-list-item-subtitle>{{ child.path }}</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </div>
                      <div v-else class="text-grey">
                        无子路由
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
                <div v-if="!accessibleRoutes.length" class="text-grey text-center py-4">
                  无可访问路由
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
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { usePermissionStore, checkPermission } from '../stores/permission'
import { permissionService } from '../services'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 状态变量
const loading = ref(false)
const testPermissionCode = ref('')
const testResult = ref(null)
const accessibleRoutes = ref([])

// 计算属性
const userRoles = computed(() => {
  return permissionStore.roles || userStore.roles || []
})

const permissionCodes = computed(() => {
  return permissionStore.permissionCodes || []
})

// 常用权限列表
const commonPermissions = ref([
  { name: '管理员访问', code: 'admin_access' },
  { name: '用户管理', code: 'manage_users' },
  { name: '部门管理', code: 'manage_departments' },
  { name: '权限管理', code: 'manage_permissions' },
  { name: '路由管理', code: 'manage_routes' },
  { name: '质量查看', code: 'view_quality' },
  { name: 'EHS查看', code: 'view_ehs' },
  { name: '生产访问', code: 'access_assy' },
  { name: '物流访问', code: 'access_pcl' }
])

// 方法
const refreshPermissions = async () => {
  loading.value = true
  try {
    // 重新初始化权限
    await permissionStore.initPermissions()
    
    // 获取可访问路由
    const routes = await permissionService.getUserRoutes()
    accessibleRoutes.value = routes || []
    
    console.log('权限刷新完成:', {
      roles: userRoles.value,
      permissionCodes: permissionCodes.value,
      routes: accessibleRoutes.value.length
    })
  } catch (error) {
    console.error('刷新权限失败:', error)
  } finally {
    loading.value = false
  }
}

const testPermission = () => {
  if (!testPermissionCode.value) return
  
  testResult.value = checkPermission(testPermissionCode.value)
  console.log('权限测试:', testPermissionCode.value, testResult.value)
}

// 组件挂载时加载数据
onMounted(() => {
  refreshPermissions()
})
</script>

<style scoped>
.v-chip-group {
  max-height: 200px;
  overflow-y: auto;
}
</style>
