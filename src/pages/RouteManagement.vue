<template>
  <unified-page-template 
    title="路由管理"
    icon="mdi-routes"
    color="secondary"
  >
    <v-row>
      <v-col cols="12">
        <unified-data-table
          title="路由列表"
          icon="mdi-routes"
          :headers="[
            { title: '路径', key: 'path', align: 'start', sortable: true },
            { title: '名称', key: 'name', align: 'start', sortable: true },
            { title: '标题', key: 'meta.title', align: 'start', sortable: true },
            { title: '组件', key: 'component', align: 'start' },
            { title: '类型', key: 'type', align: 'center', width: '100px' },
            { title: '权限', key: 'permission', align: 'center', width: '120px' },
            { title: '排序', key: 'sort_order', align: 'center', width: '80px' },
            { title: '操作', key: 'actions', align: 'center', sortable: false }
          ]"
          :items="routesList"
          :loading="loadingRoutes"
        >
          <template v-slot:item.meta.title="{ item }">
            <div class="d-flex align-center">
              <v-icon v-if="item.meta && item.meta.icon" size="small" class="mr-2">
                {{ item.meta.icon }}
              </v-icon>
              {{ item.meta && item.meta.title ? item.meta.title : '无标题' }}
            </div>
          </template>
          
          <template v-slot:item.component="{ item }">
            <span class="text-caption">{{ item.component || (isParentMenu(item) ? '父级菜单' : '') }}</span>
          </template>

          <template v-slot:item.type="{ item }">
            <v-chip
              size="small"
              :color="isParentMenu(item) ? 'info' : 'default'"
              :variant="isParentMenu(item) ? 'elevated' : 'outlined'"
            >
              {{ isParentMenu(item) ? '菜单组' : '页面' }}
            </v-chip>
          </template>
          
          <template v-slot:item.permission="{ item }">
            <v-chip
              size="small"
              :color="getPermissionColor(item)"
              variant="outlined"
              class="permission-chip"
              @click="openPermissionDialog(item)"
            >
              {{ getPermissionText(item) }}
            </v-chip>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn size="small" variant="text" color="primary" class="mr-1" @click="editRoute(item)">
              <v-icon>mdi-pencil</v-icon>
              编辑
            </v-btn>
            <v-btn size="small" variant="text" color="info" class="mr-1" @click="openPermissionDialog(item)">
              <v-icon>mdi-key</v-icon>
              权限
            </v-btn>
            <v-btn size="small" variant="text" color="error" @click="deleteRoute(item)">
              <v-icon>mdi-delete</v-icon>
              删除
            </v-btn>
          </template>
          
          <template #actions>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openRouteDialog()">
              添加路由
            </v-btn>
          </template>
        </unified-data-table>
      </v-col>
    </v-row>
    
    <!-- 路由管理对话框 -->
    <v-dialog v-model="routeDialog" max-width="800px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ editedRouteIndex === -1 ? '添加路由' : '编辑路由' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <unified-form :show-default-actions="false">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRoute.path"
                  label="路径"
                  placeholder="例如: /dashboard"
                  variant="outlined"
                  density="comfortable"
                  :rules="[routeTypeValue === 'page' ? rules.required : () => true]"
                  :disabled="routeTypeValue === 'parent_menu'"
                  :hint="routeTypeValue === 'parent_menu' ? '父级菜单不需要路径' : ''"
                  persistent-hint
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRoute.name"
                  label="名称"
                  placeholder="例如: Dashboard"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="editedRoute.component"
                  label="组件路径"
                  placeholder="例如: @/pages/Dashboard.vue"
                  variant="outlined"
                  density="comfortable"
                  :rules="[routeTypeValue === 'page' ? rules.required : () => true]"
                  :disabled="routeTypeValue === 'parent_menu'"
                  :hint="routeTypeValue === 'parent_menu' ? '父级菜单不需要组件' : ''"
                  persistent-hint
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="routeTypeValue"
                  :items="routeTypes"
                  item-title="text"
                  item-value="value"
                  label="路由类型"
                  placeholder="选择路由类型"
                  variant="outlined"
                  density="comfortable"
                  @update:modelValue="onRouteTypeChange"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="editedRoute.parent_id"
                  :items="parentRouteOptions"
                  item-title="name"
                  item-value="id"
                  label="父路由"
                  placeholder="选择父路由"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-divider class="mb-2">Meta 信息</v-divider>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRoute.meta.title"
                  label="标题"
                  placeholder="显示的菜单名称"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedRoute.meta.icon"
                  label="图标"
                  placeholder="例如: mdi-home"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="accessType"
                  :items="accessTypeOptions"
                  item-title="text"
                  item-value="value"
                  label="访问类型"
                  variant="outlined"
                  density="comfortable"
                  @update:modelValue="updateAccessType"
                >
                  <template v-slot:append>
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" color="grey">mdi-help-circle-outline</v-icon>
                      </template>
                      <div class="pa-2">
                        <p><strong>公开路由</strong>: 无需登录即可访问</p>
                        <p><strong>所有登录用户</strong>: 任何登录用户都可访问</p>
                        <p><strong>基于角色权限</strong>: 需要在权限设置中指定可访问的角色</p>
                      </div>
                    </v-tooltip>
                  </template>
                </v-select>
                <div v-if="accessType === 'role_based'" class="mt-2">
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                  >
                    保存路由后，请点击"权限"按钮设置可访问的角色
                  </v-alert>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedRoute.sort_order"
                  :items="[0,1,2,3,4,5,6,7,8,9,10]"
                  label="排序"
                  variant="outlined"
                  density="comfortable"
                  hint="数字越小排序越靠前"
                  persistent-hint
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  v-model="editedRoute.meta.requiresAuth"
                  label="需要认证"
                  color="primary"
                  :disabled="accessType === 'public'"
                  hint="选择公开路由时此选项自动禁用"
                  persistent-hint
                ></v-checkbox>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  v-model="editedRoute.meta.hideInMenu"
                  label="在菜单中隐藏"
                  color="primary"
                  hint="勾选后该路由不会显示在导航菜单中"
                  persistent-hint
                ></v-checkbox>
              </v-col>
            </v-row>
          </unified-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeRouteDialog">取消</v-btn>
          <v-btn color="primary" @click="saveRoute" :loading="savingRoute">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 路由权限分配对话框 -->
    <v-dialog v-model="permissionDialog" max-width="900px">
      <v-card>
        <v-card-title class="text-h5 bg-info text-white d-flex align-center">
          <v-icon class="mr-2">mdi-key-variant</v-icon>
          路由角色权限管理
          <v-chip class="ml-4" size="small" color="white" variant="outlined">
            {{ selectedRoute?.meta?.title || selectedRoute?.name || '未命名路由' }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert
            type="info"
            variant="tonal"
            border="start"
            class="mb-4"
            density="comfortable"
          >
            在此页面中，您可以设置哪些角色可以访问该路由。勾选角色表示允许该角色访问此路由。
          </v-alert>

          <div v-if="loadingRoles" class="d-flex justify-center my-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <span class="ml-2">加载角色数据...</span>
          </div>
          <div v-else>
            <v-alert
              v-if="!roles.length"
              type="info"
              text="没有找到可用的角色，请先创建角色。"
              class="mb-4"
            ></v-alert>
            
            <div v-else>
              <div class="d-flex align-center mb-4">
                <v-text-field
                  v-model="searchRole"
                  label="搜索角色"
                  placeholder="输入角色名称"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="mr-2"
                ></v-text-field>
                <v-btn-toggle 
                  v-model="roleFilter" 
                  color="primary" 
                  density="comfortable"
                  mandatory
                >
                  <v-btn value="all">全部</v-btn>
                  <v-btn value="granted">已授权</v-btn>
                  <v-btn value="denied">未授权</v-btn>
                </v-btn-toggle>
                <v-spacer></v-spacer>
                <v-chip
                  class="ml-2"
                  color="info"
                  variant="outlined"
                >
                  已选择: {{ roles.filter(r => r.hasAccess).length }} 个角色
                </v-chip>
              </div>
              
              <v-data-table
                :headers="[
                  { title: '角色名称', key: 'name', width: '30%' },
                  { title: '描述', key: 'description' },
                  { title: '授权访问', key: 'hasAccess', align: 'center', width: '120px' }
                ]"
                :items="filteredRoles"
                :loading="loadingRoles"
                density="comfortable"
                hover
              >
                <template v-slot:item.name="{ item }">
                  <div class="d-flex align-center">
                    <v-icon 
                      size="small" 
                      :color="item.hasAccess ? 'success' : 'grey'" 
                      class="mr-2"
                    >
                      {{ item.hasAccess ? 'mdi-check-circle' : 'mdi-account' }}
                    </v-icon>
                    <span>{{ item.name }}</span>
                  </div>
                </template>
                <template v-slot:item.hasAccess="{ item }">
                  <v-checkbox
                    v-model="item.hasAccess"
                    color="primary"
                    hide-details
                    density="compact"
                    @change="markUnsaved"
                  ></v-checkbox>
                </template>
              </v-data-table>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closePermissionDialog">取消</v-btn>
          <v-btn color="primary" @click="savePermissions" :loading="savingPermissions" :disabled="!hasPermissionChanges">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteRouteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-error text-white">
          确认删除
        </v-card-title>
        <v-card-text class="pt-4">
          您确定要删除路由 "{{ routeToDelete?.meta?.title || routeToDelete?.name || '未命名路由' }}" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteRouteDialog = false">取消</v-btn>
          <v-btn color="error" @click="confirmDeleteRoute" :loading="deletingRoute">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </unified-page-template>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user.js'
import { usePermissionStore } from '../stores/permission'
import { Module, PermissionLevel } from '../utils/permissionConstants'
import Message from '../utils/notification'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '../components/UnifiedDataTable.vue'
import UnifiedForm from '../components/UnifiedForm.vue'
import api from '../utils/api'

const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 表单验证规则
const rules = {
  required: v => (v !== undefined && v !== null && v !== '') || '此字段为必填项'
};

// 路由类型选项
const routeTypes = [
  { text: '常规页面', value: 'page' },
  { text: '父级菜单', value: 'parent_menu' }
];
const routeTypeValue = ref('page');

// 路由相关数据
const routesList = ref([])
const loadingRoutes = ref(false)
const savingRoute = ref(false)
const deletingRoute = ref(false)
const routeDialog = ref(false)
const deleteRouteDialog = ref(false)
const routeToDelete = ref(null)
const editedRouteIndex = ref(-1)
const editedRoute = ref({
  id: null,
  path: '',
  name: '',
  component: '',
  meta: {
    title: '',
    icon: '',
    requiresAuth: true,
    hideInMenu: false,
    permission: null
  },
  parent_id: null,
  sort_order: 0
})

// 访问类型选项
const accessTypeOptions = [
  { text: '公开路由 (无需登录)', value: 'public' },
  { text: '所有登录用户', value: 'all' },
  { text: '基于角色权限', value: 'role_based' }
]

// 路由权限相关数据
const permissionDialog = ref(false)
const selectedRoute = ref(null)
const roles = ref([])
const originalRoles = ref([]) // 用于检测变更
const loadingRoles = ref(false)
const savingPermissions = ref(false)
const searchRole = ref('')
const roleFilter = ref('all')
const accessType = ref('all')
const hasPermissionChanges = ref(false)

// 计算可作为父路由的选项
const parentRouteOptions = computed(() => {
  const options = [{ id: null, name: '顶级菜单' }];
  
  if (routesList.value && routesList.value.length > 0) {
    // 过滤掉当前正在编辑的路由，避免自身作为自己的父路由
    const availableRoutes = editedRoute.value.id 
      ? routesList.value.filter(route => route.id !== editedRoute.value.id)
      : routesList.value;
      
    const routeOptions = availableRoutes.map(route => ({
      id: route.id,
      name: route.meta?.title || route.name || `路由ID:${route.id}`
    }));
    return [...options, ...routeOptions];
  }
  
  return options;
})

// 加载路由数据
const loadRoutes = async () => {
  try {
    loadingRoutes.value = true;
    
    // 尝试从后端API获取路由数据
    const response = await api.get('/routes');
    if (response && response.data) {
      console.log("从后端获取的路由数据:", JSON.stringify(response.data, null, 2));
      
      // 确保每个路由对象都有完整的meta字段
      const processedRoutes = response.data.map(route => {
        const processedRoute = { ...route };
        
        // 如果meta是字符串，尝试解析
        if (typeof processedRoute.meta === 'string') {
          try {
            processedRoute.meta = JSON.parse(processedRoute.meta);
          } catch (e) {
            console.error(`解析路由ID ${processedRoute.id} 的meta字段失败:`, e);
            processedRoute.meta = {
              title: processedRoute.name || '未命名',
              icon: '',
              requiresAuth: false
            };
          }
        }
        
        // 如果meta不存在，创建默认值
        if (!processedRoute.meta) {
          processedRoute.meta = {
            title: processedRoute.name || '未命名',
            icon: '',
            requiresAuth: false
          };
        }
        
        return processedRoute;
      });
      
      routesList.value = processedRoutes;
    } else if (response && Array.isArray(response)) {
      // 处理直接返回数组的情况
      routesList.value = response.map(route => {
        if (!route.meta) {
          route.meta = {
            title: route.name || '未命名',
            icon: '',
            requiresAuth: false
          };
        }
        return route;
      });
    } else {
      console.warn("从后端获取路由数据失败");
      Message.error('获取路由数据失败');
      routesList.value = [];
    }
  } catch (error) {
    console.error('加载路由数据失败:', error);
    Message.error('加载路由数据失败');
    routesList.value = [];
  } finally {
    loadingRoutes.value = false;
  }
};

// 检查是否为父级菜单
const isParentMenu = (route) => {
  return !route.component && route.meta && route.meta.isParentMenu;
};

// 路由类型变化处理
const onRouteTypeChange = (value) => {
  if (value === 'parent_menu') {
    // 设置父级菜单的特殊属性
    editedRoute.value.path = '#'; // 使用hash符作为路径占位
    editedRoute.value.component = '';
    editedRoute.value.meta.isParentMenu = true;
    // 确保meta.requiresChildren属性存在
    if (!editedRoute.value.meta.requiresChildren) {
      editedRoute.value.meta.requiresChildren = true;
    }
  } else {
    // 常规页面，清除父级菜单标志
    if (editedRoute.value.meta.isParentMenu) {
      delete editedRoute.value.meta.isParentMenu;
    }
    if (editedRoute.value.meta.requiresChildren) {
      delete editedRoute.value.meta.requiresChildren;
    }
    // 如果路径是占位符，清除它
    if (editedRoute.value.path === '#') {
      editedRoute.value.path = '';
    }
  }
};

// 打开路由对话框
const openRouteDialog = (item = null) => {
  // 是否是编辑模式
  if (item) {
    editedRouteIndex.value = routesList.value.indexOf(item)
    editedRoute.value = JSON.parse(JSON.stringify(item)) // 深拷贝避免直接修改原对象
    
    // 确保meta对象和其中的permission对象存在
    if (!editedRoute.value.meta) {
      editedRoute.value.meta = {}
    }
    
    // 设置路由类型
    routeTypeValue.value = isParentMenu(editedRoute.value) ? 'parent_menu' : 'page'
    
    // 设置访问类型
    determineAccessType(editedRoute.value)
  } else {
    // 新增路由
    editedRouteIndex.value = -1
    editedRoute.value = {
      id: null,
      path: '',
      name: '',
      component: '',
      meta: {
        title: '',
        icon: '',
        requiresAuth: true,
        hideInMenu: false,
        permission: null
      },
      parent_id: null,
      sort_order: 0
    }
    routeTypeValue.value = 'page'
    accessType.value = 'all'
  }
  
  routeDialog.value = true
}

// 根据路由权限设置决定访问类型
const determineAccessType = (route) => {
  if (!route.meta) {
    accessType.value = 'all'
    return
  }
  
  if (route.meta.public === true) {
    accessType.value = 'public'
    return
  }
  
  if (route.meta.permission === '*') {
    accessType.value = 'all'
    return
  }
  
  // 如果有allowed_roles或其他权限设置，则认为是基于角色的权限
  accessType.value = 'role_based'
}

// 更新访问类型处理
const updateAccessType = (type) => {
  if (!editedRoute.value.meta) {
    editedRoute.value.meta = {}
  }
  
  // 根据类型设置权限
  switch (type) {
    case 'public':
      editedRoute.value.meta.public = true
      editedRoute.value.meta.permission = null
      editedRoute.value.meta.requiresAuth = false
      break
      
    case 'all':
      editedRoute.value.meta.public = false
      editedRoute.value.meta.permission = '*'
      editedRoute.value.meta.requiresAuth = true
      break
      
    case 'role_based':
      editedRoute.value.meta.public = false
      editedRoute.value.meta.permission = null
      editedRoute.value.meta.requiresAuth = true
      // 角色权限需要在权限对话框中设置
      break
  }
}

// 编辑路由
const editRoute = (route) => {
  editedRouteIndex.value = routesList.value.findIndex(r => r.id === route.id);
  // 深拷贝以避免直接修改原对象
  editedRoute.value = JSON.parse(JSON.stringify(route));
  // 确保meta对象存在
  if (!editedRoute.value.meta) {
    editedRoute.value.meta = {
      title: editedRoute.value.name || '',
      icon: '',
      requiresAuth: true,
      hideInMenu: false
    };
  }
  // 设置路由类型
  routeTypeValue.value = isParentMenu(route) ? 'parent_menu' : 'page';
  routeDialog.value = true;
};

// 关闭路由对话框
const closeRouteDialog = () => {
  routeDialog.value = false;
};

// 保存路由
const saveRoute = async () => {
  try {
    // 验证必填字段
    if (routeTypeValue.value === 'page') {
      if (!editedRoute.value.path || !editedRoute.value.name || !editedRoute.value.component || !editedRoute.value.meta.title) {
        Message.warning('请填写必填字段');
        return;
      }
    } else {
      if (!editedRoute.value.name || !editedRoute.value.meta.title) {
        Message.warning('请填写必填字段');
        return;
      }
    }
    
    savingRoute.value = true;
    
    // 准备要发送的数据
    const routeData = { ...editedRoute.value };
    
    // 如果是父级菜单，确保设置了正确的属性
    if (routeTypeValue.value === 'parent_menu') {
      routeData.path = '#';  // 使用特殊路径标记
      routeData.component = '';
      routeData.meta.isParentMenu = true;
      routeData.meta.requiresChildren = true;
    }
    
    // 确保权限设置正确
    if (!routeData.meta) {
      routeData.meta = {};
    }
    
    // 根据访问类型设置权限
    if (accessType.value === 'public') {
      routeData.meta.public = true;
      routeData.meta.requiresAuth = false;
    } else if (accessType.value === 'all') {
      routeData.meta.public = false;
      routeData.meta.permission = '*';
      routeData.meta.requiresAuth = true;
    } else if (accessType.value === 'role_based') {
      routeData.meta.public = false;
      routeData.meta.permission = null;
      routeData.meta.requiresAuth = true;
      // allowed_roles将在权限对话框中设置
    }
    
    let response;
    
    if (editedRouteIndex.value === -1) {
      // 创建新路由
      response = await api.post('/routes', routeData);
      Message.success('路由创建成功');
    } else {
      // 更新路由
      response = await api.put(`/routes/${routeData.id}`, routeData);
      Message.success('路由更新成功');
    }
    
    // 重新加载路由列表
    await loadRoutes();
    
    // 关闭对话框
    closeRouteDialog();
  } catch (error) {
    console.error('保存路由失败:', error);
    Message.error('保存路由失败: ' + (error.response?.data?.detail || error.message));
  } finally {
    savingRoute.value = false;
  }
};

// 删除路由
const deleteRoute = (route) => {
  routeToDelete.value = route;
  deleteRouteDialog.value = true;
};

// 确认删除路由
const confirmDeleteRoute = async () => {
  if (!routeToDelete.value || !routeToDelete.value.id) {
    deleteRouteDialog.value = false;
    return;
  }
  
  try {
    deletingRoute.value = true;
    
    // 调用API删除路由
    await api.delete(`/routes/${routeToDelete.value.id}`);
    
    // 从列表中移除
    const index = routesList.value.findIndex(r => r.id === routeToDelete.value.id);
    if (index !== -1) {
      routesList.value.splice(index, 1);
    }
    
    Message.success('路由删除成功');
    deleteRouteDialog.value = false;
    
    // 重新加载路由列表
    await loadRoutes();
  } catch (error) {
    console.error('删除路由失败:', error);
    Message.error('删除路由失败: ' + (error.response?.data?.detail || error.message));
  } finally {
    deletingRoute.value = false;
  }
};

// 打开权限管理对话框
const openPermissionDialog = async (route) => {
  selectedRoute.value = route
  
  // 加载角色和权限数据
  await loadRolesForRoute(route.id)
  
  permissionDialog.value = true
}

// 关闭权限管理对话框
const closePermissionDialog = () => {
  if (hasPermissionChanges.value) {
    if (!confirm('您有未保存的更改，确定要关闭吗？')) {
      return
    }
  }
  
  permissionDialog.value = false
  selectedRoute.value = null
  roles.value = []
  originalRoles.value = []
  hasPermissionChanges.value = false
}

// 标记有未保存的更改
const markUnsaved = () => {
  hasPermissionChanges.value = true
}

// 加载路由对应的角色权限
const loadRolesForRoute = async (routeId) => {
  loadingRoles.value = true
  try {
    // 获取所有角色
    const rolesResponse = await api.get('/roles')
    const allRoles = rolesResponse.data || []
    
    // 获取当前路由的权限配置
    const routePermResponse = await api.get(`/routes/${routeId}/permissions`)
    const routePermissions = routePermResponse.data || []
    
    // 合并角色和权限数据
    roles.value = allRoles.map(role => ({
      ...role,
      hasAccess: routePermissions.some(p => p.role_id === role.id)
    }))
    
    // 保存原始状态用于检测变更
    originalRoles.value = JSON.parse(JSON.stringify(roles.value))
    hasPermissionChanges.value = false
  } catch (error) {
    console.error('加载路由权限数据失败:', error)
    Message.error('加载角色权限数据失败')
  } finally {
    loadingRoles.value = false
  }
}

// 获取权限显示文本
const getPermissionText = (route) => {
  if (!route.meta) return '默认'
  
  if (route.meta.public === true) return '公开'
  
  if (route.meta.permission === '*') return '所有用户'
  
  // 检查是否有allowed_roles
  if (route.meta.allowed_roles && route.meta.allowed_roles.length > 0) {
    // 获取角色数量
    const roleCount = route.meta.allowed_roles.length
    
    // 根据角色数量返回不同的文本
    if (roleCount === 0) {
      return '无权限'
    } else if (roleCount === 1) {
      return '1个角色'
    } else {
      return `${roleCount}个角色`
    }
  }
  
  // 检查是否有模块权限
  if (route.meta.permission && typeof route.meta.permission === 'object') {
    if (route.meta.permission.module && route.meta.permission.level) {
      return `${route.meta.permission.module}:${route.meta.permission.level}`
    }
  }
  
  return '未设置'
}

// 获取权限显示颜色
const getPermissionColor = (route) => {
  if (!route.meta) return 'grey'
  
  if (route.meta.public === true) return 'success'
  
  if (route.meta.permission === '*') return 'primary'
  
  // 检查是否有allowed_roles
  if (route.meta.allowed_roles && route.meta.allowed_roles.length > 0) {
    return route.meta.allowed_roles.length > 0 ? 'info' : 'error'
  }
  
  // 检查是否有模块权限
  if (route.meta.permission && typeof route.meta.permission === 'object') {
    return 'warning'
  }
  
  return 'grey'
}

// 角色过滤
const filteredRoles = computed(() => {
  let result = roles.value
  
  // 按名称搜索
  if (searchRole.value) {
    const keyword = searchRole.value.toLowerCase()
    result = result.filter(role => 
      role.name.toLowerCase().includes(keyword) || 
      (role.description && role.description.toLowerCase().includes(keyword))
    )
  }
  
  // 按权限状态过滤
  if (roleFilter.value === 'granted') {
    result = result.filter(role => role.hasAccess)
  } else if (roleFilter.value === 'denied') {
    result = result.filter(role => !role.hasAccess)
  }
  
  return result
})

// 保存角色权限设置
const savePermissions = async () => {
  if (!selectedRoute.value) return
  
  savingPermissions.value = true
  
  try {
    // 保存基于角色的权限设置
    const roleIds = roles.value
      .filter(role => role.hasAccess)
      .map(role => role.id)
    
    // 调用API保存角色权限
    await api.post(`/routes/${selectedRoute.value.id}/permissions`, { 
      role_ids: roleIds 
    })
    
    // 同时更新本地路由对象的权限信息
    if (!selectedRoute.value.meta) {
      selectedRoute.value.meta = {}
    }
    selectedRoute.value.meta.allowed_roles = roleIds.map(id => String(id))
    
    // 更新本地路由列表中的路由对象
    const routeIndex = routesList.value.findIndex(r => r.id === selectedRoute.value.id)
    if (routeIndex !== -1) {
      if (!routesList.value[routeIndex].meta) {
        routesList.value[routeIndex].meta = {}
      }
      routesList.value[routeIndex].meta.allowed_roles = roleIds.map(id => String(id))
    }
    
    Message.success('路由权限设置已更新')
    
    // 更新状态并关闭对话框
    hasPermissionChanges.value = false
    permissionDialog.value = false
    
    // 重新加载权限
    await permissionStore.initialize()
    
  } catch (error) {
    console.error('保存权限设置失败:', error)
    Message.error('保存权限设置失败')
  } finally {
    savingPermissions.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadRoutes();
});
</script> 