<!--
  权限控制组件
  用于基于用户权限条件性地渲染内容
  
  用法示例:
  1. 单一权限:
     <PermissionControl module="USER" level="READ">
       <template #default>仅具有用户读取权限的用户可见</template>
     </PermissionControl>
     
  2. 多权限 (OR 逻辑):
     <PermissionControl :permissions="['USER:READ', 'USER:WRITE']" logic="or">
       <template #default>具有用户读取或写入权限的用户可见</template>
     </PermissionControl>
     
  3. 多权限 (AND 逻辑):
     <PermissionControl :permissions="['USER:READ', 'DEPARTMENT:READ']" logic="and">
       <template #default>同时具有用户和部门读取权限的用户可见</template>
     </PermissionControl>
     
  4. 基于角色:
     <PermissionControl :roles="['管理员', '编辑']">
       <template #default>管理员或编辑角色可见</template>
     </PermissionControl>
     
  5. 无权限时显示替代内容:
     <PermissionControl module="USER" level="ADMIN">
       <template #default>管理员可见内容</template>
       <template #unauthorized>您没有权限查看此内容</template>
     </PermissionControl>
-->
<template>
  <div>
    <!-- 有权限时显示默认插槽 -->
    <slot v-if="hasPermission"></slot>
    
    <!-- 无权限时显示unauthorized插槽，如果提供 -->
    <slot 
      v-else
      name="unauthorized"
    >
      <!-- 默认无权限提示，仅在showUnauthorized为true时显示 -->
      <div v-if="showUnauthorized" class="permission-denied">
        <div class="permission-denied-icon">
          <i class="ri-lock-line"></i>
        </div>
        <div class="permission-denied-text">
          {{ unauthorizedText }}
        </div>
      </div>
    </slot>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { usePermissionStore, checkPermission } from '../stores/permission'

export default defineComponent({
  name: 'PermissionControl',
  
  props: {
    // 单一权限模式
    module: {
      type: String,
      default: null
    },
    level: {
      type: String,
      default: null
    },
    departmentId: {
      type: [Number, String],
      default: null
    },
    
    // 多权限模式
    permissions: {
      type: Array,
      default: () => []
    },
    
    // 权限检查逻辑: 'and' 或 'or'
    logic: {
      type: String,
      default: 'or',
      validator: (value) => ['and', 'or'].includes(value.toLowerCase())
    },
    
    // 角色模式
    roles: {
      type: Array,
      default: () => []
    },
    
    // 是否显示无权限提示
    showUnauthorized: {
      type: Boolean,
      default: false
    },
    
    // 无权限提示文本
    unauthorizedText: {
      type: String,
      default: '您没有权限查看此内容'
    }
  },
  
  setup(props) {
    const permissionStore = usePermissionStore()
    
    // 计算用户是否有权限
    const hasPermission = computed(() => {
      // 如果是超级管理员，直接通过
      if (permissionStore.isSuperUser) {
        return true
      }
      
      // 单一权限模式（简化版本）
      if (props.module && props.level) {
        const permissionCode = `${props.module}_${props.level}`.toLowerCase()
        return checkPermission(permissionCode)
      }

      // 多权限模式
      if (props.permissions && props.permissions.length > 0) {
        const checkMethod = props.logic.toLowerCase() === 'and' ? 'every' : 'some'

        return props.permissions[checkMethod]((permission) => {
          return checkPermission(permission)
        })
      }

      // 角色模式
      if (props.roles && props.roles.length > 0) {
        return props.roles.some(role => permissionStore.hasRole(role))
      }
      
      // 如果没有设置任何权限检查条件，默认不显示
      return false
    })
    
    return {
      hasPermission
    }
  }
})
</script>

<style scoped>
.permission-denied {
  padding: 16px;
  border-radius: 4px;
  background-color: #f8f9fa;
  text-align: center;
  color: #6c757d;
  border: 1px dashed #dee2e6;
  margin: 8px 0;
}

.permission-denied-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.permission-denied-text {
  font-size: 14px;
}
</style> 