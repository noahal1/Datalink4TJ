<template>
  <v-container fluid>
    <v-card class="admin-page-card" elevation="3">
      <!-- 页面标题栏 -->
      <v-card-title class="admin-page-header d-flex align-center py-4 px-6">
        <v-icon class="mr-2" color="secondary">mdi-shield-account</v-icon>
        <div class="text-h5 font-weight-medium">系统管理</div>
      </v-card-title>
      
      <v-card-text class="admin-page-content pa-6">
        <!-- 管理页面导航 -->
        <v-tabs
          v-model="activeTab"
          color="primary"
          align-tabs="start"
          class="mb-4"
        >
          <v-tab :to="'/admin/users'" value="users">
            <v-icon start>mdi-account-group</v-icon>
            用户管理
          </v-tab>
          <v-tab :to="'/admin/departments'" value="departments">
            <v-icon start>mdi-domain</v-icon>
            部门管理
          </v-tab>
          <v-tab :to="'/admin/activities'" value="activities">
            <v-icon start>mdi-history</v-icon>
            操作记录
          </v-tab>
          <v-tab :to="'/admin/routes'" value="routes">
            <v-icon start>mdi-routes</v-icon>
            路由管理
          </v-tab>
          <v-tab :to="'/admin/permissions'" value="permissions">
            <v-icon start>mdi-shield-account</v-icon>
            权限管理
          </v-tab>
        </v-tabs>
        
        <!-- 子路由视图 -->
        <router-view />
      </v-card-text>
    </v-card>
  </v-container>
</template>
 
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 当前活动标签
const activeTab = ref(null);

// 根据路由路径设置活动标签
const setActiveTabFromRoute = () => {
  const path = route.path;
  if (path === '/admin' || path === '/admin/users/') {
    activeTab.value = 'users';
  } else if (path.includes('/admin/')) {
    activeTab.value = path.split('/').pop();
  }
};

// 监听路由变化
onMounted(() => {
  setActiveTabFromRoute();
});
</script>

<style scoped>
.admin-page-card {
  border-radius: 12px;
  overflow: hidden;
}

.admin-page-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: white;
}

.admin-page-content {
  min-height: 300px;
}

@media (max-width: 600px) {
  .admin-page-header {
    padding: 12px 16px !important;
  }
  
  .admin-page-content {
    padding: 16px !important;
  }
}
</style>