// Utilities
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 创建并配置pinia实例
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 导出pinia实例
export { pinia }

// 导出所有的模块化状态管理

// 重新导出旧的store (为保持兼容性)
export { useUserStore } from './user'
export { usePermissionStore } from './permission'
export { useActivityStore } from './activity'
export { useEventStore } from './event'
export { useAppStore } from './app'

// 导出新的模块化store
export { useAuthStore } from './modules/auth'
export { useUserStore as useModularUserStore } from './modules/user'
// 权限模块已简化，不再使用模块化权限存储

// 默认导出pinia实例
export default pinia
