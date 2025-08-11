<template>
  <div class="pa-4">
    <h2>PR弹窗测试</h2>
    
    <v-btn 
      color="primary" 
      @click="openNewDialog"
      class="mr-4"
    >
      测试新建PR弹窗
    </v-btn>
    
    <v-btn 
      color="secondary" 
      @click="openEditDialog"
    >
      测试编辑PR弹窗
    </v-btn>

    <!-- PR弹窗组件 -->
    <pr-dialog
      v-model="dialog"
      :pr="editedPr"
      :is-new="isNew"
      :loading="loading"
      @save="handleSave"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PrDialog from './pr/PrDialog.vue'

// 响应式数据
const dialog = ref(false)
const loading = ref(false)
const isNew = ref(true)
const editedPr = ref({})

// 打开新建弹窗
const openNewDialog = () => {
  isNew.value = true
  editedPr.value = {
    material_name: '',
    description: '',
    required_date: '',
    specification: '',
    quantity: 1,
    brand: '',
    material_code: '',
    remarks: ''
  }
  dialog.value = true
}

// 打开编辑弹窗
const openEditDialog = () => {
  isNew.value = false
  editedPr.value = {
    id: 1,
    material_name: '测试物品',
    description: '这是一个测试描述',
    required_date: '2024-01-15',
    specification: '测试规格说明',
    quantity: 5,
    brand: '测试品牌',
    material_code: 'TEST001',
    remarks: '测试备注',
    approved_date: '',
    delivery_date: ''
  }
  dialog.value = true
}

// 处理保存
const handleSave = (prData) => {
  console.log('保存PR数据:', prData)
  loading.value = true
  
  // 模拟保存过程
  setTimeout(() => {
    loading.value = false
    dialog.value = false
    alert('PR保存成功！')
  }, 2000)
}

// 处理关闭
const handleClose = () => {
  dialog.value = false
  editedPr.value = {}
}
</script>
