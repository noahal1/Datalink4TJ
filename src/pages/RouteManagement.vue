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
          
          <template v-slot:item.actions="{ item }">
            <v-btn size="small" variant="text" color="primary" class="mr-1" @click="editRoute(item)">
              <v-icon>mdi-pencil</v-icon>
              编辑
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
              <v-col cols="12" md="4">
                <v-select
                  v-model="editedRoute.sort_order"
                  :items="[0,1,2,3,4,5,6,7,8,9,10]"
                  label="排序"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-checkbox
                  v-model="editedRoute.meta.requiresAuth"
                  label="需要认证"
                  color="primary"
                ></v-checkbox>
              </v-col>
              <v-col cols="12" md="4">
                <v-checkbox
                  v-model="editedRoute.meta.hideInMenu"
                  label="在菜单中隐藏"
                  color="primary"
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
import Message from '../utils/notification'
import UnifiedPageTemplate from '../components/UnifiedPageTemplate.vue'
import UnifiedDataTable from '../components/UnifiedDataTable.vue'
import UnifiedForm from '../components/UnifiedForm.vue'
import api from '../utils/api'

const userStore = useUserStore()

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
    hideInMenu: false
  },
  parent_id: null,
  sort_order: 0
})

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
const openRouteDialog = () => {
  editedRouteIndex.value = -1;
  routeTypeValue.value = 'page'; // 默认为页面类型
    editedRoute.value = {
      id: null,
      path: '',
      name: '',
      component: '',
      meta: {
        title: '',
        icon: '',
        requiresAuth: true,
      hideInMenu: false
      },
      parent_id: null,
      sort_order: 0
  };
  routeDialog.value = true;
};

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
    
    // 如果meta是对象，转换为字符串(如果API需要)
    if (typeof routeData.meta === 'object') {
      try {
        // 注意：根据API要求，可能需要将meta序列化为字符串
        // routeData.meta = JSON.stringify(routeData.meta);
      } catch (e) {
        console.error('序列化meta字段失败:', e);
      }
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

// 页面加载时获取数据
onMounted(() => {
  loadRoutes();
});
</script> 