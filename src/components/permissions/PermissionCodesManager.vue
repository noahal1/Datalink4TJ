<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">
        mdi-code-tags
      </v-icon>
      权限代码管理
      <v-spacer />
      <v-btn
        color="primary"
        :loading="loading"
        @click="refreshCodes"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        刷新
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-alert
        type="info"
        class="mb-4"
      >
        <strong>简化权限系统：</strong>权限代码基于角色自动分配，系统预定义权限规则。
      </v-alert>

      <!-- 权限代码说明 -->
      <v-expansion-panels class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-2">
              mdi-information
            </v-icon>
            权限代码说明
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>权限代码</th>
                  <th>描述</th>
                  <th>适用角色</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="code in permissionCodes"
                  :key="code.code"
                >
                  <td>
                    <v-chip
                      size="small"
                      color="primary"
                    >
                      {{ code.code }}
                    </v-chip>
                  </td>
                  <td>{{ code.description }}</td>
                  <td>
                    <v-chip-group>
                      <v-chip 
                        v-for="role in code.roles" 
                        :key="role"
                        size="small"
                        :color="getRoleColor(role)"
                      >
                        {{ role }}
                      </v-chip>
                    </v-chip-group>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- 角色权限代码矩阵 -->
      <v-card variant="outlined">
        <v-card-title class="text-h6">
          <v-icon class="mr-2">
            mdi-matrix
          </v-icon>
          角色权限代码矩阵
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="matrixHeaders"
            :items="rolePermissionMatrix"
            :loading="loading"
            class="elevation-1"
            item-key="roleName"
            density="compact"
          >
            <!-- 角色名称列 -->
            <template #item.roleName="{ item }">
              <v-chip
                :color="getRoleColor(item.roleName)"
                dark
                size="small"
              >
                {{ item.roleName }}
              </v-chip>
            </template>

            <!-- 权限代码列 -->
            <template
              v-for="code in permissionCodes"
              :key="code.code"
              #[`item.${code.code}`]="{ item }"
            >
              <v-icon 
                :color="item[code.code] ? 'success' : 'error'"
                size="small"
              >
                {{ item[code.code] ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>

      <!-- 权限代码统计 -->
      <v-row class="mt-4">
        <v-col
          cols="12"
          md="6"
        >
          <v-card variant="outlined">
            <v-card-title class="text-h6">
              <v-icon class="mr-2">
                mdi-chart-bar
              </v-icon>
              权限代码统计
            </v-card-title>
            <v-card-text>
              <div
                v-for="code in permissionCodes"
                :key="code.code"
                class="d-flex justify-space-between mb-2"
              >
                <span>{{ code.code }}</span>
                <v-chip
                  size="small"
                  color="info"
                >
                  {{ code.roles.length }} 个角色
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="6"
        >
          <v-card variant="outlined">
            <v-card-title class="text-h6">
              <v-icon class="mr-2">
                mdi-account-group
              </v-icon>
              角色权限统计
            </v-card-title>
            <v-card-text>
              <div
                v-for="role in rolesList"
                :key="role.name"
                class="d-flex justify-space-between mb-2"
              >
                <span>{{ role.name }}</span>
                <v-chip
                  size="small"
                  :color="getPermissionCountColor(role.permissionCount)"
                >
                  {{ role.permissionCount }} 个权限
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification'

const { showSuccess, showError } = useNotification()

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['refresh'])

// 状态变量
const permissionCodes = ref([
  {
    code: 'admin_access',
    description: '管理员访问权限',
    roles: ['超级管理员', '管理员']
  },
  {
    code: 'user_manage',
    description: '用户管理权限',
    roles: ['超级管理员', '管理员']
  },
  {
    code: 'role_manage',
    description: '角色管理权限',
    roles: ['超级管理员', '管理员']
  },
  {
    code: 'route_manage',
    description: '路由管理权限',
    roles: ['超级管理员', '管理员']
  },
  {
    code: 'quality_manage',
    description: '质量管理权限',
    roles: ['超级管理员', '管理员', '质量部门负责人', '质量班组负责人']
  },
  {
    code: 'maintenance_manage',
    description: '维修管理权限',
    roles: ['超级管理员', '管理员', '维修班组负责人']
  },
  {
    code: 'safety_manage',
    description: '安全管理权限',
    roles: ['超级管理员', '管理员', '安全负责人']
  },
  {
    code: 'dashboard_view',
    description: '仪表板查看权限',
    roles: ['超级管理员', '管理员', '普通用户', '质量部门负责人', '质量班组负责人', '维修班组负责人', '安全负责人']
  },
  {
    code: 'quality_view',
    description: '质量数据查看权限',
    roles: ['质量部门负责人', '质量班组负责人']
  },
  {
    code: 'maintenance_view',
    description: '维修数据查看权限',
    roles: ['维修班组负责人']
  },
  {
    code: 'safety_view',
    description: '安全数据查看权限',
    roles: ['安全负责人']
  }
])

// 计算属性
const matrixHeaders = computed(() => {
  const baseHeaders = [
    { title: '角色', key: 'roleName', sortable: true, width: '150px' }
  ]

  const codeHeaders = permissionCodes.value.map(code => ({
    title: code.code,
    key: code.code,
    sortable: false,
    width: '120px',
    align: 'center'
  }))

  return [...baseHeaders, ...codeHeaders]
})

const rolesList = computed(() => {
  const roles = ['超级管理员', '管理员', '普通用户', '质量部门负责人', '质量班组负责人', '维修班组负责人', '安全负责人']
  
  return roles.map(roleName => {
    const permissionCount = permissionCodes.value.filter(code => code.roles.includes(roleName)).length
    return {
      name: roleName,
      permissionCount
    }
  })
})

const rolePermissionMatrix = computed(() => {
  return rolesList.value.map(role => {
    const rowData = {
      roleName: role.name
    }

    // 为每个权限代码添加字段
    permissionCodes.value.forEach(code => {
      rowData[code.code] = code.roles.includes(role.name)
    })

    return rowData
  })
})

// 方法
const refreshCodes = () => {
  showSuccess('权限代码刷新成功')
  emit('refresh')
}

const getRoleColor = (roleName) => {
  const colorMap = {
    '超级管理员': 'red',
    '管理员': 'purple',
    '质量部门负责人': 'blue',
    '质量班组负责人': 'light-blue',
    '维修班组负责人': 'green',
    '安全负责人': 'orange',
    '普通用户': 'grey'
  }
  return colorMap[roleName] || 'primary'
}

const getPermissionCountColor = (count) => {
  if (count >= 6) return 'success'
  if (count >= 3) return 'warning'
  return 'error'
}

// 初始化
onMounted(() => {
  refreshCodes()
})
</script>

<style scoped>
.v-data-table {
  font-size: 0.875rem;
}

.v-chip {
  font-size: 0.75rem;
}

.v-chip-group {
  gap: 4px;
}
</style>
