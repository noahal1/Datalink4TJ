<template>
  <slot v-if="hasPermission" />
</template>

<script setup>
import { computed } from 'vue';
import { usePermissionStore } from '../stores/permission';

const props = defineProps({
  // 模块名称
  module: {
    type: String,
    required: true
  },
  // 权限级别
  level: {
    type: String,
    default: 'READ'
  },
  // 部门ID限制
  departmentId: {
    type: [String, Number],
    default: null
  },
  // 权限字符串 (MODULE:LEVEL 格式，如果提供则优先于module和level)
  permission: {
    type: String,
    default: null
  }
});

const permissionStore = usePermissionStore();

// 检查用户是否拥有权限
const hasPermission = computed(() => {
  // 超级管理员拥有所有权限
  if (permissionStore.isSuperUser) {
    return true;
  }
  
  // 如果提供了permission字符串，优先使用它
  if (props.permission) {
    return permissionStore.hasPermissionByString(props.permission, props.departmentId);
  }
  
  // 否则使用module和level参数
  return permissionStore.hasPermission(props.module, props.level, props.departmentId);
});
</script> 