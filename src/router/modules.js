// modules.js - 定义各业务功能模块路由

// 使用懒加载优化性能
const EHS = () => import('../pages/EHS.vue')
const Assy = () => import('../pages/Assy.vue')
const Quality = () => import('../pages/Quality.vue')
const Pcl = () => import('../pages/Pcl.vue')
const Gmo = () => import('../pages/Gmo.vue')
const Maintenance = () => import('../pages/Maintenance.vue')
const MaintenanceMetrics = () => import('../pages/MaintenanceMetrics.vue')
const PrManagement = () => import('../pages/PrManagement.vue')
const DowntimeRecords = () => import('../pages/DowntimeRecords.vue')  
const Events = () => import('../pages/Events.vue')
const QualityKpi = () => import('../pages/QualityKpi.vue')
const EhsKpi = () => import('../pages/EhsKpi.vue')
const MaintenanceKpi = () => import('../pages/MaintenanceKpi.vue')
const ProductionKpi = () => import('../pages/ProductionKpi.vue')
const GmoKpi = () => import('../pages/GmoKpi.vue')
const EngKpi = () => import('../pages/EngKpi.vue')
const KpiExport = () => import('../pages/KpiExport.vue')
const PrsKpi = () => import('../pages/PrsKpi.vue')
const HrKpi = () => import('../pages/HrKpi.vue')
const LogisticsKpi = () => import('../pages/LogisticsKpi.vue')
const DohDaily = () => import('../pages/DohDaily.vue')
const DohMasterData = () => import('../pages/DohMasterData.vue')
const AdminUser = () => import('../pages/admin/Users.vue')
const MaterialManagement = () => import('../pages/MaterialManagement.vue')


export const moduleRoutes = [
  {
    path: '/quality',
    component: Quality,
    alias: '/Quality',
    meta: {
      title: '质量',
      requiresAuth: true
    }
  },
  {
    path: '/ehs',
    component: EHS,
    meta: {
      title: 'EHS',
      requiresAuth: true
    }
  },
  {
    path: '/assy',
    component: Assy,
    meta: {
      title: '生产',
      requiresAuth: true
    }
  },
  {
    path: '/pcl',
    component: Pcl,
    meta: {
      title: '物流',
      requiresAuth: true
    }
  },
  {
    path: '/gmo',
    component: Gmo,
    meta: {
      title: 'GMO',
      requiresAuth: true
    }
  },
  {
    path: '/quality-kpi',
    component: QualityKpi,
    meta: {
      title: '质量KPI',
      requiresAuth: true
    }
  },
  {
    path: '/ehs-kpi',
    component: EhsKpi,
    meta: {
      title: 'EHS KPI',
      permission_code: 'view_ehs_kpi',
      requiresAuth: true
    }
  },
  {
    path: '/maintenance-kpi',
    component: MaintenanceKpi,
    meta: {
      title: '维修KPI',
      permission_code: 'view_maintenance_kpi',
      requiresAuth: true
    }
  },
  {
    path: '/production-kpi',
    component: ProductionKpi,
    meta: {
      title: '生产KPI',
      permission_code: 'view_production_kpi',
      requiresAuth: true
    }
  },
  {
    path: '/gmo-kpi',
    component: GmoKpi,
    meta: {
      title: 'GMO KPI',
      permission_code: 'view_gmo_kpi',
      requiresAuth: true
    }
  },
  {
    path: '/eng-kpi',
    component: EngKpi,
    meta: {
      title: '工程KPI',
      permission_code: 'view_eng_kpi',
      requiresAuth: true
    }
  },

  {
    path: '/prs-kpi',
    component: PrsKpi,
    meta: {
      title: '冲压KPI',
      permission_code: 'view_prs_kpi',
      requiresAuth: true
    }
  },
  {
    path: '/hr-kpi',
    component: HrKpi,
    meta: {
      title: 'HR-KPI',
      permission_code: 'view_hr_kpi',
      requiresAuth: true
    }
  },
  {
    path: '/logistics-kpi',
    component: LogisticsKpi,
    meta: {
      title: '物流KPI',
      permission_code: 'view_logistics_kpi',
      requiresAuth: true
    }
  },
  {
    path: '/doh-daily',
    component: DohDaily,
    meta: {
      title: 'DOH每日填报',
      permission_code: 'view_doh_daily',
      requiresAuth: true,
    }
  },
  {
    path: '/doh-master-data',
    component: DohMasterData,
    meta: {
      title: 'DOH主数据维护',
      permission_code: 'manage_doh_master',
      requiresAuth: true,
    }
  },
  { 
    path: '/maintenance', 
    component: Maintenance,
    meta: { 
      title: '维修',
      permission_code: 'access_maintenance', 
      requiresAuth: true
    } 
  },
  { 
    path: '/materialmanagement', 
    component: MaterialManagement,
    meta: { 
      title: '备件维护',
      requiresAuth: true
    } 
  },
  {
    path: '/maintenance-metrics',
    component: MaintenanceMetrics,
    meta: {
      title: '维修指标',
      permission_code: 'view_maintenance_metrics',
      requiresAuth: true
    }
  },
  {
    path: '/pr-management',
    component: PrManagement,
    meta: {
      title: 'PR管理',
      permission_code: 'access_maintenance',
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
  },
  {
    path: '/admin/users',
    component: AdminUser,
    meta: {
      title: '用户管理',
      permission_code: 'access_admin_users',
      requiresAuth: true,
  },
  {
    path: '/admin/kpiexport',
    component: KpiExport,
    meta: {
      title: 'Kpi导出',
      requiresAuth: true,
  }
}
] 