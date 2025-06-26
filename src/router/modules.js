// modules.js - 定义各业务功能模块路由

// 使用懒加载优化性能
const EHS = () => import('../pages/EHS.vue')
const Assy = () => import('../pages/Assy.vue')
const Quality = () => import('../pages/Quality.vue')
const Pcl = () => import('../pages/Pcl.vue')
const Admin = () => import('../pages/Admin.vue')
const Gmo = () => import('../pages/Gmo.vue')
const Maintenance = () => import('../pages/Maintenance.vue')
const MaintenanceMetrics = () => import('../pages/MaintenanceMetrics.vue')
const DowntimeRecords = () => import('../pages/DowntimeRecords.vue')  
const Events = () => import('../pages/Events.vue')
const Qa_others = () => import('../pages/Qa_others.vue')

// 功能模块路由配置
export const moduleRoutes = [
  { 
    path: '/quality', 
    component: Quality,
    alias: '/Quality', 
    meta: { 
      title: '质量',
      permission_code: 'view_quality',
      requiresAuth: true
    } 
  },
  { 
    path: '/ehs', 
    component: EHS,
    meta: { 
      title: 'EHS',
      permission_code: 'view_ehs', 
      requiresAuth: true
    } 
  },
  { 
    path: '/assy', 
    component: Assy,
    meta: { 
      title: '生产',
      permission_code: 'access_assy',
      requiresAuth: true
    }
  },
  { 
    path: '/pcl', 
    component: Pcl,
    meta: { 
      title: '物流',
      permission_code: 'access_pcl',
      requiresAuth: true
    } 
  },
  { 
    path: '/gmo', 
    component: Gmo,
    meta: { 
      title: 'GMO',
      permission_code: 'access_gmo', 
      requiresAuth: true
    } 
  },
  {
    path: '/qakpi',
    component: Qa_others,
    meta: { 
      title: '质量管理',
      requiresAuth: true
    }
  },
  { 
    path: '/maintenance', 
    component: Maintenance,
    meta: { 
      title: '维护',
      permission_code: 'access_maintenance', 
      requiresAuth: true
    } 
  },
  { 
    path: '/maintenance-metrics', 
    component: MaintenanceMetrics,
    meta: { 
      title: '维护指标',
      permission_code: 'view_maintenance_metrics', 
      requiresAuth: true
    } 
  },
  { 
    path: '/downtime-records', 
    component: DowntimeRecords,
    meta: { 
      title: '停机记录',
      permission_code: 'view_downtime_records', 
      requiresAuth: true
    } 
  },
  { 
    path: '/events', 
    component: Events,
    meta: { 
      title: '事件',
      permission_code: 'view_events', 
      requiresAuth: true
    } 
  }
] 