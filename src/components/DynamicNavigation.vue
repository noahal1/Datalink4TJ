<template>
  <div class="dynamic-nav">
    <!-- 主导航区域 -->
    <div class="nav-content">
      <v-list
        class="nav-list"
        density="compact"
      >
        <!-- 加载状态显示 -->
        <div
          v-if="loading"
          class="pa-4 d-flex justify-center align-center"
        >
          <v-progress-circular
            indeterminate
            color="primary"
            size="24"
          />
          <span class="ml-2 text-body-2">加载导航菜单...</span>
        </div>
      
        <!-- 加载失败显示 -->
        <div
          v-else-if="loadError"
          class="pa-4 text-center"
        >
          <v-icon
            color="error"
            icon="mdi-alert-circle-outline"
          />
          <div class="text-body-2 text-error mt-2">
            加载菜单失败
          </div>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            class="mt-2"
            @click="retryLoadRoutes"
          >
            重试
          </v-btn>
        </div>
      
        <!-- 搜索结果为空 -->
        <div
          v-else-if="searchQuery && filteredNavigationGroups.length === 0"
          class="pa-4 text-center"
        >
          <v-icon
            color="info"
            icon="mdi-information-outline"
          />
          <div class="text-body-2 mt-2">
            未找到匹配的菜单项
          </div>
        </div>
      
        <!-- 路由分组部分 -->
        <template
          v-for="(group, groupIndex) in filteredNavigationGroups"
          v-else
          :key="groupIndex"
        >
          <!-- 分组标题 -->
          <v-list-subheader
            v-if="group.title"
            class="nav-group-title"
          >
            {{ group.title }}
          </v-list-subheader>
        
          <!-- 组内路由项 -->
          <template
            v-for="(route, routeIndex) in group.routes"
            :key="route.path || routeIndex"
          >
            <!-- 常规菜单项 -->
            <v-list-item
              v-if="!route.children || route.children.length === 0"
              v-ripple
              :to="route.path"
              :value="route.path"
              :active="isActiveRoute(route.path)"
              class="nav-list-item"
              @click="logRouteClick(route)"
            >
              <template #prepend>
                <v-icon>{{ route.meta?.icon || 'mdi-link' }}</v-icon>
              </template>
              <v-list-item-title>{{ route.meta?.title || route.name || '未命名' }}</v-list-item-title>
              <template
                v-if="route.meta?.badge"
                #append
              >
                <v-badge
                  :content="route.meta.badge"
                  :color="route.meta.badgeColor || 'primary'"
                  dot
                  location="top start"
                />
              </template>
            </v-list-item>
          
            <!-- 有子菜单的菜单项 -->
            <div
              v-else
              class="nav-group-wrapper"
            >
              <!-- 父菜单项 -->
              <v-list-item
                v-ripple
                :active="isActiveGroupRoute(route)"
                class="nav-list-item nav-group-header"
                @click="toggleGroup(route.path || routeIndex)"
              >
                <template #prepend>
                  <v-icon>{{ route.meta?.icon || 'mdi-folder' }}</v-icon>
                </template>
                <v-list-item-title>{{ route.meta?.title || route.name || '未命名' }}</v-list-item-title>
                <template #append>
                  <v-icon
                    :icon="openGroups.includes(route.path || routeIndex) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                    class="transition-icon"
                  />
                </template>
              </v-list-item>
            
              <!-- 子菜单项 -->
              <v-expand-transition>
                <div
                  v-show="openGroups.includes(route.path || routeIndex)"
                  class="nav-child-items"
                >
                  <div class="nav-group-indicator" />
                  <v-list-item
                    v-for="(childRoute, childIndex) in route.children"
                    :key="childRoute.path || childIndex"
                    v-ripple
                    :to="childRoute.path"
                    :value="childRoute.path"
                    :active="isActiveRoute(childRoute.path)"
                    class="nav-list-subitem"
                  >
                    <template #prepend>
                      <v-icon size="small">
                        {{ childRoute.meta?.icon || 'mdi-link' }}
                      </v-icon>
                    </template>
                    <v-list-item-title>{{ childRoute.meta?.title || childRoute.name || '未命名' }}</v-list-item-title>
                  </v-list-item>
                </div>
              </v-expand-transition>
            </div>
          </template>
          <v-divider
            v-if="groupIndex < filteredNavigationGroups.length - 1"
            class="my-2"
          />
        </template>
      </v-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePermissionStore } from '../stores/permission'
import { useUserStore } from '../stores/user'
import routeService from '../services/routeService'

const props = defineProps({
  // 导航分组配置
  groupConfig: {
    type: Array,
    default: () => [
      { id: 'main', title: '主菜单', filter: route => !route.meta?.group || route.meta.group === 'main' },
      { id: 'qa', title: '质量', filter: route => route.meta?.group === 'qa' },
      { id: 'production', title: '生产', filter: route => route.meta?.group === 'production' },
      { id: 'logistics', title: '物流', filter: route => route.meta?.group === 'logistics' },
      { id: 'maintenance', title: '维修', filter: route => route.meta?.group === 'maintenance' },
      { id: 'ehs', title: 'EHS', filter: route => route.meta?.group === 'ehs' },
      { id: 'eng', title: '工程', filter: route => route.meta?.group === 'eng' },
      { id: 'assy', title: '生产', filter: route => route.meta?.group === 'assy' },
      { id: 'mat', title: '维修', filter: route => route.meta?.group === 'mat' },
      { id: 'pcl', title: '物流', filter: route => route.meta?.group === 'pcl' },
      { id: 'gmo',title: 'GMO', filter: route => route.meta?.group === 'gmo' },
      { id: 'fin', title: '财务', filter: route => route.meta?.group === 'fin' },
      { id: 'prs', title: 'PRS', filter: route => route.meta?.group === 'prs' },
      { id: 'hr',title: '人事', filter: route => route.meta?.group === 'hr' },
      { id: 'admin', title: '系统管理', filter: route => route.meta?.group === 'admin' },
      { id: 'other', title: '其他', filter: route => !route.meta?.group || route.meta.group === 'other' }
    ]
  },
  // 是否显示底部操作区
  showBottomActions: {
    type: Boolean,
    default: true
  },
  // 是否显示搜索框
  showSearch: {
    type: Boolean,
    default: true
  },
  // 自定义排序规则
  sortFunction: {
    type: Function,
    default: null
  },
  // 侧边栏引用，用于控制侧边栏可见性
  drawer: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:drawer']);

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()
const userStore = useUserStore()
const loading = ref(true)
const loadError = ref(false)
const navRoutes = ref([])
const openGroups = ref([]) // 当前展开的菜单组
const searchQuery = ref('') // 搜索查询
const recentlyUsed = ref([]) // 最近使用的路由

// 当前活动路由
const activeRoute = computed(() => route.path)

// 检查路由是否激活
const isActiveRoute = (path) => {
  if (!path) return false
  // 使用完全匹配或者路径前缀匹配
  return activeRoute.value === path || 
         (path !== '/' && activeRoute.value.startsWith(`${path}/`))
}

const isActiveGroupRoute = (routeObj) => {
  if (!routeObj) return false
  
  if (routeObj.path && routeObj.path !== '/' && activeRoute.value.startsWith(routeObj.path)) {
    return true
  }
  
  if (routeObj.children && routeObj.children.length > 0) {
    return routeObj.children.some(child => {
      if (!child.path) return false
      return isActiveRoute(child.path)
    })
  }
  
  return false
}

// 切换菜单组展开状态
const toggleGroup = (groupId) => {
  const index = openGroups.value.indexOf(groupId)
  if (index > -1) {
    // 如果已经打开，则关闭
    openGroups.value.splice(index, 1)
  } else {
    openGroups.value = [groupId]
  }
}

// 添加到最近使用
const addToRecentlyUsed = (path) => {
  if (!path) return
  
  // 将当前路由移到最前面或添加到最近使用列表
  const index = recentlyUsed.value.indexOf(path)
  if (index > -1) {
    recentlyUsed.value.splice(index, 1)
  }
  recentlyUsed.value.unshift(path)
  
  // 限制最近使用列表长度
  if (recentlyUsed.value.length > 5) {
    recentlyUsed.value.pop()
  }
  
  // 保存到本地存储
  try {
    localStorage.setItem('recentlyUsedRoutes', JSON.stringify(recentlyUsed.value))
  } catch (e) {
    console.error('无法保存最近使用路由', e)
  }
}

// 从本地存储加载最近使用的路由
const loadRecentlyUsed = () => {
  try {
    const saved = localStorage.getItem('recentlyUsedRoutes')
    if (saved) {
      recentlyUsed.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('无法加载最近使用路由', e)
  }
}

// 导航分组（带搜索过滤）
const filteredNavigationGroups = computed(() => {
  // 按分组配置将路由分类
  const routesToUse = navRoutes.value

  // 如果存在自定义排序函数，对路由进行排序
  const sortedRoutes = [...routesToUse]
  if (props.sortFunction) {
    sortedRoutes.sort(props.sortFunction)
  }

  // 如果有搜索查询，过滤匹配的路由
  const searchLower = searchQuery.value.toLowerCase()
  let filteredRoutes = sortedRoutes

  if (searchQuery.value) {
    const filterRoute = (route) => {
      // 检查路由标题、名称和路径是否包含搜索词
      const titleMatch = (route.meta?.title || '').toLowerCase().includes(searchLower)
      const nameMatch = (route.name || '').toLowerCase().includes(searchLower)
      const pathMatch = (route.path || '').toLowerCase().includes(searchLower)
      
      // 如果当前路由匹配，返回true
      if (titleMatch || nameMatch || pathMatch) {
        return true
      }
      
      // 如果有子路由，递归检查
      if (route.children && route.children.length > 0) {
        // 创建一个新的路由对象，只包含匹配的子路由
        const matchingChildren = route.children.filter(filterRoute)
        if (matchingChildren.length > 0) {
          // 如果有匹配的子路由，返回true，表示这个父路由应该显示
          return true
        }
      }
      
      return false
    }
    
    filteredRoutes = filteredRoutes.filter(filterRoute)
  }
  
  const groups = props.groupConfig.map(group => {
    return {
      id: group.id,
      title: group.title,
      routes: filteredRoutes.filter(route => group.filter(route))
    }
  })
  
  // 只返回有路由的分组
  return groups.filter(group => group.routes.length > 0)
})

// 自动展开包含当前活动路由的分组
const updateActiveGroups = () => {
  const newOpenGroups = []
  
  filteredNavigationGroups.value.forEach(group => {
    group.routes.forEach((route, index) => {
      if (route.children && route.children.length > 0) {
        const groupKey = route.path || `group-${group.id}-${index}`
        if (isActiveGroupRoute(route)) {
          newOpenGroups.push(groupKey)
        }
      }
    })
  })
  
  // 更新打开的组
  if (newOpenGroups.length > 0) {
    openGroups.value = newOpenGroups
  }
}

// 重置重试计数
const resetRetryCount = () => {
  if (window._navRetryCount) {
    window._navRetryCount = 0
  }
}

// 重试加载路由
const retryLoadRoutes = () => {
  resetRetryCount()
  loadRoutes()
}

// 初始加载路由
const loadRoutes = async () => {
  loading.value = true
  loadError.value = false

  try {
    console.log('DynamicNavigation: 开始加载路由...')

    // 确保用户已登录
    if (!userStore.isLogin) {
      console.log('DynamicNavigation: 用户未登录，跳过路由加载')
      navRoutes.value = []
      return
    }

    // 确保权限已初始化
    if (!permissionStore.isInitialized) {
      console.log('DynamicNavigation: 初始化权限...')
      await permissionStore.initPermissions()
    }

    // 使用多种方式获取路由
    let navigationMenu = []

    try {
      // 方式1: 优先使用权限存储中的路由列表
      if (permissionStore.accessibleRoutesList && permissionStore.accessibleRoutesList.length > 0) {
        console.log('DynamicNavigation: 使用权限存储中的路由列表')
        navigationMenu = permissionStore.accessibleRoutesList
        console.log('DynamicNavigation: 权限路由获取成功:', navigationMenu.length, '个')
      } else {
        // 方式2: 使用权限服务获取用户路由
        console.log('DynamicNavigation: 尝试获取用户权限路由...')
        const permissionService = (await import('../services')).permissionService
        navigationMenu = await permissionService.getUserRoutes()
        console.log('DynamicNavigation: 权限路由获取成功:', navigationMenu.length, '个')
      }
    } catch (permError) {
      console.warn('DynamicNavigation: 权限路由获取失败，尝试其他方式:', permError)

      try {
        // 方式3: 使用路由服务获取导航菜单
        console.log('DynamicNavigation: 尝试获取导航菜单...')
        navigationMenu = await routeService.getNavigationMenu()
        console.log('DynamicNavigation: 导航菜单获取成功:', navigationMenu.length, '个')
      } catch (routeError) {
        console.warn('DynamicNavigation: 导航菜单获取失败，使用默认路由:', routeError)

        // 方式4: 使用默认路由
        navigationMenu = getDefaultRoutes()
      }
    }

    // 验证和处理路由
    const processedRoutes = validateAndProcessRoutes(navigationMenu)
    navRoutes.value = processedRoutes

    console.log('DynamicNavigation: 最终路由数量:', processedRoutes.length)
    resetRetryCount()

    // 加载最近使用的路由
    loadRecentlyUsed()

    // 加载完路由后，自动展开当前活动路由所在的组
    updateActiveGroups()

  } catch (error) {
    console.error('DynamicNavigation: 加载路由失败:', error)
    loadError.value = true

    // 失败后尝试再次加载，最多重试3次
    if (!window._navRetryCount) {
      window._navRetryCount = 1;
    } else if (window._navRetryCount < 3) {
      window._navRetryCount++;
    } else {
      console.error('DynamicNavigation: 重试次数已达上限，停止重试')
      // 使用默认路由作为最后的备用方案
      navRoutes.value = getDefaultRoutes()
      return;
    }

    console.log(`DynamicNavigation: ${window._navRetryCount} 秒后重试...`)
    setTimeout(() => loadRoutes(), 1000 * window._navRetryCount);
  } finally {
    loading.value = false
  }
}

// 验证和处理路由
const validateAndProcessRoutes = (routeList) => {
  if (!Array.isArray(routeList)) {
    console.warn('DynamicNavigation: 路由列表不是数组，返回空数组')
    return []
  }

  const processRoute = (route) => {
    // 确保路由有基本属性
    if (!route || typeof route !== 'object') {
      return null
    }

    // 确保路由有有效的path
    if (!route.path) {
      if (route.name) {
        route.path = `/${route.name.toLowerCase().replace(/\s+/g, '-')}`
      } else {
        console.warn('DynamicNavigation: 路由缺少path和name:', route)
        return null
      }
    }

    // 确保meta存在
    if (!route.meta) {
      route.meta = {}
    }

    // 确保title存在
    if (!route.meta.title) {
      route.meta.title = route.name || route.path
    }

    // 确保icon存在
    if (!route.meta.icon) {
      route.meta.icon = 'mdi-link'
    }

    // 递归处理子路由
    if (route.children && Array.isArray(route.children)) {
      route.children = route.children
        .map(processRoute)
        .filter(child => child !== null)
    }

    return route
  }

  return routeList
    .map(processRoute)
    .filter(route => route !== null)
}

// 获取默认路由（当所有其他方式都失败时使用）
const getDefaultRoutes = () => {
  console.log('DynamicNavigation: 使用默认路由')

  const defaultRoutes = [
    {
      id: 'dashboard',
      path: '/dashboard',
      name: 'Dashboard',
      meta: {
        title: '仪表板',
        icon: 'mdi-view-dashboard',
        requiresAuth: true
      }
    }
  ]

  // 根据用户角色添加更多默认路由
  if (permissionStore.isSuperUser || permissionStore.hasRole('管理员') || permissionStore.hasRole('超级管理员')) {
    defaultRoutes.push({
      id: 'admin',
      path: '/admin',
      name: 'Admin',
      meta: {
        title: '系统管理',
        icon: 'mdi-cog',
        requiresAuth: true
      }
    })
  }

  return defaultRoutes
}

// 监听路由变化，更新活动分组和最近使用记录
watch(() => route.path, (newPath, oldPath) => {
  console.log('DynamicNavigation: 路由变化', { from: oldPath, to: newPath })

  updateActiveGroups()
  addToRecentlyUsed(newPath)

  // 确保侧边栏在非移动设备上保持可见
  if (window.innerWidth >= 1264 && !props.drawer) {
    emit('update:drawer', true)
  }

  // 检查路由是否存在，如果不存在则尝试重新加载
  const registeredRoutes = router.getRoutes()
  const routeExists = registeredRoutes.some(r => r.path === newPath)

  console.log(`DynamicNavigation: 检查路由 ${newPath}:`, routeExists ? '✅ 存在' : '❌ 不存在')
  console.log(`DynamicNavigation: 当前注册路由数量: ${registeredRoutes.length}`)

  if (!routeExists && newPath !== '/' && !newPath.startsWith('/login') && !newPath.startsWith('/dashboard')) {
    console.warn('DynamicNavigation: 路由不存在，尝试重新加载路由表', newPath)

    // 打印调试信息
    console.log('DynamicNavigation: 当前所有路由路径:', registeredRoutes.map(r => r.path))

    // 立即尝试重新加载，不延迟
    forceReloadRoutes()
  }
}, { immediate: true })

// 监听搜索查询变化
watch(() => searchQuery.value, () => {
  // 如果搜索查询变化，需要重新计算哪些分组应该打开
  updateActiveGroups()
})

// 监听用户登录状态变化
watch(() => userStore.isLogin, (newLoginState, oldLoginState) => {
  console.log('DynamicNavigation: 用户登录状态变化', { old: oldLoginState, new: newLoginState }, '用户:', userStore.user);
  if (newLoginState && !oldLoginState) {
    // 用户刚刚登录，重新加载路由
    console.log('DynamicNavigation: 用户刚刚登录，重新加载路由')
    loadRoutes()
  } else if (!newLoginState) {
    // 用户登出后，清空路由
    console.log('DynamicNavigation: 用户登出，清空路由')
    navRoutes.value = []
  }
}, { immediate: true })

// 监听权限初始化状态
watch(() => permissionStore.isInitialized, (isInitialized, wasInitialized) => {
  if (userStore.isLogin && isInitialized && !wasInitialized) {
    // 权限刚刚初始化完成，重新加载路由
    console.log('DynamicNavigation: 权限刚刚初始化完成，重新加载路由')
    loadRoutes()
  }
})

// 监听可访问路由列表变化
watch(() => permissionStore.accessibleRoutesList.length, (newLength, oldLength) => {
  if (userStore.isLogin && newLength > 0 && newLength !== oldLength) {
    // 可访问路由列表更新后，重新加载路由
    console.log('DynamicNavigation: 可访问路由列表更新，重新加载路由', { old: oldLength, new: newLength })
    loadRoutes()
  }
})

// 确保侧边栏显示方法（可从父组件调用）
const ensureDrawerVisible = () => {
  if (!props.drawer && window.innerWidth >= 1264) {
    emit('update:drawer', true)
  }
}

// 组件挂载时加载路由
onMounted(() => {
  loadRoutes()
  
  // 确保侧边栏在大屏幕上可见
  ensureDrawerVisible()
})

// 处理菜单项点击
const logRouteClick = (route) => {
  console.log('菜单项点击:', {
    路径: route.path,
    名称: route.name,
    组件: route.component,
    元数据: route.meta,
    是否激活: isActiveRoute(route.path),
    路由已注册: !!router.hasRoute(route.name)
  })

  // 检查路由是否存在于路由表中
  const registeredRoutes = router.getRoutes()
  const matchedRoute = registeredRoutes.find(r => r.path === route.path)

  console.log(`路由${matchedRoute ? '已' : '未'}在路由表中找到:`,
    matchedRoute ? {
      路径: matchedRoute.path,
      名称: matchedRoute.name,
      组件: matchedRoute.components,
      元数据: matchedRoute.meta
    } : '未找到'
  )

  // 如果路由不存在，尝试重新加载路由表
  if (!matchedRoute) {
    console.log('路由不存在，尝试重新加载路由表...', route.path)

    // 使用强制重新加载路由的方法
    forceReloadRoutes().then(() => {
      // 重新检查路由是否存在
      const updatedRoutes = router.getRoutes()
      const newMatchedRoute = updatedRoutes.find(r => r.path === route.path)

      if (newMatchedRoute) {
        console.log('路由现在可用，导航到:', route.path)
        // 使用 replace 而不是 push 避免历史记录重复
        router.replace(route.path)
      } else {
        console.warn('路由仍然不可用:', route.path)
        // 导航到仪表板作为备用方案
        router.replace('/dashboard')
      }
    }).catch(err => {
      console.error('重新加载动态路由失败:', err)
      // 如果重新加载失败，导航到仪表板
      router.replace('/dashboard')
    })
  }
}

// 添加强制重新加载路由的方法
const forceReloadRoutes = async () => {
  try {
    loading.value = true
    console.log('强制重新加载路由表...')

    // 清除路由缓存
    sessionStorage.removeItem('accessibleRoutes')
    localStorage.removeItem('accessibleRoutes')

    // 重新初始化权限存储
    await permissionStore.refreshPermissions()

    // 重新加载导航菜单
    await loadRoutes()

    // 手动触发动态路由注册
    try {
      // 动态导入路由模块中的addDynamicRoutes函数和状态重置函数
      const { addDynamicRoutes, resetDynamicRoutesState } = await import('../router')

      // 重置动态路由加载状态，强制重新加载
      resetDynamicRoutesState()

      // 调用函数添加动态路由
      console.log('调用addDynamicRoutes添加动态路由...')
      const routes = await addDynamicRoutes()
      console.log(`成功添加 ${routes.length} 个动态路由`)

      // 验证目标路由是否现在可用
      const currentPath = router.currentRoute.value.path
      const targetRoute = router.resolve(currentPath)

      if (targetRoute.matched.length > 0) {
        console.log(`路由 ${currentPath} 现在可用，重新导航`)
        // 使用 replace 而不是 push 避免历史记录重复
        router.replace(currentPath)
      } else {
        console.warn(`路由 ${currentPath} 仍然不可用`)
        // 如果当前路由仍然不可用，导航到仪表板
        router.replace('/dashboard')
      }

      console.log('路由表已刷新')
    } catch (error) {
      console.error('刷新路由表失败:', error)
    }
    
    loading.value = false
  } catch (error) {
    console.error('强制重新加载路由失败:', error)
    loading.value = false
    loadError.value = true
  }
}
</script>

<style scoped>
.dynamic-nav {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.nav-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.3) transparent;
  padding-bottom: 16px; /* 确保底部有足够空间 */
}

/* Webkit浏览器滚动条样式 */
.nav-content::-webkit-scrollbar {
  width: 6px;
}

.nav-content::-webkit-scrollbar-track {
  background: transparent;
}

.nav-content::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-primary), 0.3);
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

.nav-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-primary), 0.5);
}

.nav-list {
  padding: 8px 0 16px 0; /* 增加底部填充 */
}

.nav-bottom-actions {
  flex-shrink: 0;
  background-color: var(--v-surface-variant);
  padding: 8px;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
}

.nav-search {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--v-surface-variant);
  backdrop-filter: blur(10px);
}

.search-field {
  border-radius: 8px;
}

.search-field :deep(.v-field__input) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.nav-group-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--v-primary-base, #1976d2);
  letter-spacing: 0.1em;
  padding: 0 16px;
  opacity: 0.8;
  margin-top: 8px;
}

.nav-list-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  position: relative;
  overflow: hidden;
}

.nav-list-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: var(--v-primary-base, #1976d2);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-list-item.v-list-item--active::before {
  opacity: 1;
}

.nav-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: translateX(4px);
}

.nav-list-item.nav-group-header {
  font-weight: 500;
}

.nav-list-item.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: var(--v-primary-base, #1976d2);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-group-header {
  cursor: pointer;
}

.nav-group-indicator {
  position: absolute;
  left: 22px;
  width: 2px;
  height: calc(100% - 12px);
  background-color: rgba(var(--v-theme-primary), 0.2);
  border-radius: 1px;
}

.nav-child-items {
  padding-top: 4px;
  padding-bottom: 4px;
  position: relative;
  overflow: hidden;
}

.nav-list-subitem {
  border-radius: 6px;
  margin: 2px 8px 2px 20px;
  padding-left: 28px !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.nav-list-subitem:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  transform: translateX(4px);
}

.nav-group-wrapper {
  margin: 4px 0;
  position: relative;
}

/* 动画效果增强 */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式优化 */
@media (max-height: 600px) {
  .nav-search {
    padding: 8px 12px;
  }

  .nav-list-item {
    margin: 2px 8px;
  }

  .nav-group-title {
    margin-top: 4px;
    font-size: 0.75rem;
  }
}

/* 确保在小屏幕上也能正常滚动 */
@media (max-width: 600px) {
  .dynamic-nav {
    flex: 1;
    min-height: 0;
  }
  
  .nav-content {
    padding-bottom: 24px; /* 小屏幕上增加更多底部空间 */
  }
  
  .nav-list {
    padding: 4px 0 20px 0; /* 小屏幕上调整填充 */
  }
  
  .nav-list-item {
    margin: 2px 4px; /* 减少外边距 */
    padding: 8px 12px !important; /* 减少内边距 */
    font-size: 0.875rem; /* 稍微减小字体 */
  }
  
  .nav-list-subitem {
    margin: 2px 4px 2px 16px; /* 调整子项目边距 */
    padding: 6px 8px 6px 20px !important; /* 调整子项目内边距 */
    font-size: 0.8rem; /* 稍微减小子项目字体 */
  }
  
  .nav-group-title {
    padding: 0 12px; /* 减少分组标题内边距 */
    font-size: 0.7rem; /* 减小分组标题字体 */
  }
}

/* 针对非常小的屏幕进一步优化 */
@media (max-width: 480px) {
  .nav-content {
    padding-bottom: 32px; /* 极小屏幕上增加更多底部空间 */
  }
  
  .nav-list {
    padding: 2px 0 24px 0;
  }
  
  .nav-list-item {
    font-size: 0.8rem;
    padding: 6px 8px !important;
    margin: 1px 2px;
  }
  
  .nav-list-subitem {
    font-size: 0.75rem;
    padding: 4px 6px 4px 16px !important;
    margin: 1px 2px 1px 12px;
  }
}

/* 确保底部按钮区域有足够空间 */
@media (max-height: 600px) {
  .nav-content {
    padding-bottom: 20px;
  }
  
  .nav-list {
    padding: 4px 0 16px 0;
  }
}
</style>