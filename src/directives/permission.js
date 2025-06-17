/**
 * 权限控制指令
 * 使用方法：
 * 1. 简单模式：v-permission="'MODULE:LEVEL'"
 * 2. 对象模式：v-permission="{ module: 'MODULE', level: 'LEVEL', departmentId: 123 }"
 * 
 * 如果用户没有所需权限，元素将被从DOM中移除
 */
import { usePermissionStore } from '../stores/permission'
import { PermissionHelper } from '../utils/permissionConstants'

export const vPermission = {
  // 指令挂载时检查权限
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  // 指令更新时重新检查权限
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

// 检查权限的核心逻辑
function checkPermission(el, binding) {
  const permissionStore = usePermissionStore()
  let hasPermission = false

  // 如果是超级管理员，直接通过
  if (permissionStore.isSuperUser) {
    hasPermission = true
  } 
  // 字符串模式: v-permission="'MODULE:LEVEL'"
  else if (typeof binding.value === 'string') {
    hasPermission = permissionStore.hasPermissionByString(binding.value)
  } 
  // 对象模式: v-permission="{ module: 'MODULE', level: 'LEVEL' }"
  else if (typeof binding.value === 'object' && binding.value !== null) {
    const { module, level, departmentId } = binding.value
    if (module && level) {
      hasPermission = permissionStore.hasPermission(module, level, departmentId)
    }
  }

  // 如果没有权限，从DOM中移除元素
  if (!hasPermission) {
    // 从DOM中移除元素
    const comment = document.createComment(' 权限不足: 已隐藏元素 ')
    Object.defineProperty(comment, '__permissionElement', {
      value: el,
      enumerable: false,
    })
    el.parentNode?.replaceChild(comment, el)
  }
}

// 在Vue应用中注册指令
export function registerPermissionDirective(app) {
  app.directive('permission', vPermission)
}

export default registerPermissionDirective 