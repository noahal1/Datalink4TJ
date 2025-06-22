/**
 * 权限控制指令
 * 使用方法：
 * 1. 简单模式：v-permission="'permission_code'"
 * 2. 对象模式：v-permission="{ code: 'permission_code' }"
 * 3. 多权限模式：v-permission="{ codes: ['code1', 'code2'], logic: 'or' }"
 * 4. 角色模式：v-permission="{ roles: ['管理员', '编辑'] }"
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
  // 字符串模式: v-permission="'permission_code'"
  else if (typeof binding.value === 'string') {
    hasPermission = permissionStore.hasPermission(binding.value)
  } 
  // 对象模式
  else if (typeof binding.value === 'object' && binding.value !== null) {
    // 单一权限代码模式: v-permission="{ code: 'permission_code' }"
    if (binding.value.code) {
      hasPermission = permissionStore.hasPermission(binding.value.code)
    }
    // 旧版兼容 - 模块级别模式: v-permission="{ module: 'MODULE', level: 'LEVEL' }"
    else if (binding.value.module && binding.value.level) {
      // 使用PermissionHelper转换旧格式到新格式
      const permissionCode = PermissionHelper.convertLegacyPermission(binding.value.module, binding.value.level)
      if (permissionCode) {
        hasPermission = permissionStore.hasPermission(permissionCode)
      }
    }
    // 多权限模式: v-permission="{ codes: ['code1', 'code2'], logic: 'or' }"
    else if (Array.isArray(binding.value.codes) && binding.value.codes.length > 0) {
      // 使用 AND 或 OR 逻辑
      const logic = (binding.value.logic || 'or').toLowerCase()
      
      if (logic === 'and') {
        // 需要满足所有权限
        hasPermission = binding.value.codes.every(code => 
          permissionStore.hasPermission(code)
        )
      } else {
        // 默认为 OR 逻辑，满足任一权限即可
        hasPermission = binding.value.codes.some(code => 
          permissionStore.hasPermission(code)
        )
      }
    }
    // 角色模式: v-permission="{ roles: ['管理员', '编辑'] }"
    else if (Array.isArray(binding.value.roles) && binding.value.roles.length > 0) {
      // 获取用户角色
      const userRoles = permissionStore.userRoles
      
      // 检查用户是否有指定角色之一
      hasPermission = binding.value.roles.some(role => userRoles.includes(role))
    }
  }

  // 如果没有权限，从DOM中移除元素或应用其他效果
  if (!hasPermission) {
    const modifiers = binding.modifiers || {}
    
    // 默认行为：从DOM中移除元素
    if (!modifiers.disable && !modifiers.hidden) {
      // 从DOM中移除元素
      const comment = document.createComment(' 权限不足: 已隐藏元素 ')
      Object.defineProperty(comment, '__permissionElement', {
        value: el,
        enumerable: false,
      })
      el.parentNode?.replaceChild(comment, el)
    } 
    // 禁用模式：不移除元素，只禁用它
    else if (modifiers.disable) {
      // 添加禁用属性
      el.disabled = true
      el.classList.add('permission-disabled')
      // 添加禁用样式
      el.style.cursor = 'not-allowed'
      el.style.opacity = '0.6'
      
      // 防止点击事件
      el.addEventListener('click', preventDefault, true)
    }
    // 隐藏模式：不移除元素，只隐藏它
    else if (modifiers.hidden) {
      el.style.display = 'none'
    }
  }
}

// 阻止点击事件
function preventDefault(e) {
  e.stopPropagation()
  e.preventDefault()
}

// 在Vue应用中注册指令
export function registerPermissionDirective(app) {
  app.directive('permission', vPermission)
}

export default registerPermissionDirective 