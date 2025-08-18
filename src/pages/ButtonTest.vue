<template>
  <div class="pa-6">
    <h2 class="mb-6">按钮高度测试页面</h2>
    
    <!-- 不同尺寸的按钮 -->
    <v-card class="mb-6">
      <v-card-title>不同尺寸的按钮</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-3 align-center">
          <v-btn size="x-small" color="primary">超小按钮</v-btn>
          <v-btn size="small" color="primary">小按钮</v-btn>
          <v-btn size="default" color="primary">默认按钮</v-btn>
          <v-btn size="large" color="primary">大按钮</v-btn>
          <v-btn size="x-large" color="primary">超大按钮</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 不同变体的按钮 -->
    <v-card class="mb-6">
      <v-card-title>不同变体的按钮</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-3 align-center">
          <v-btn variant="flat" color="primary">实心按钮</v-btn>
          <v-btn variant="outlined" color="primary">轮廓按钮</v-btn>
          <v-btn variant="text" color="primary">文本按钮</v-btn>
          <v-btn variant="tonal" color="primary">色调按钮</v-btn>
          <v-btn variant="elevated" color="primary">阴影按钮</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 图标按钮 -->
    <v-card class="mb-6">
      <v-card-title>图标按钮</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-3 align-center">
          <v-btn icon="mdi-heart" size="x-small" color="primary"></v-btn>
          <v-btn icon="mdi-heart" size="small" color="primary"></v-btn>
          <v-btn icon="mdi-heart" size="default" color="primary"></v-btn>
          <v-btn icon="mdi-heart" size="large" color="primary"></v-btn>
          <v-btn icon="mdi-heart" size="x-large" color="primary"></v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 带图标的按钮 -->
    <v-card class="mb-6">
      <v-card-title>带图标的按钮</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-3 align-center">
          <v-btn prepend-icon="mdi-plus" color="success">添加</v-btn>
          <v-btn append-icon="mdi-arrow-right" color="info">下一步</v-btn>
          <v-btn prepend-icon="mdi-download" variant="outlined" color="primary">下载</v-btn>
          <v-btn prepend-icon="mdi-delete" color="error">删除</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 表格中的按钮示例 -->
    <v-card class="mb-6">
      <v-card-title>表格中的按钮</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="items"
          class="elevation-1"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              color="primary"
              variant="text"
              @click="editItem(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              color="error"
              variant="text"
              @click="deleteItem(item)"
            ></v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 对话框按钮测试 -->
    <v-card>
      <v-card-title>对话框按钮</v-card-title>
      <v-card-text>
        <v-btn @click="dialog = true" color="primary">打开对话框</v-btn>
      </v-card-text>
    </v-card>

    <!-- 测试对话框 -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>测试对话框</v-card-title>
        <v-card-text>
          这是一个测试对话框，用于验证对话框中按钮的高度。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" @click="dialog = false">确认</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dialog = ref(false)

const headers = [
  { title: '名称', key: 'name' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'actions', sortable: false }
]

const items = [
  { name: '项目1', status: '活跃' },
  { name: '项目2', status: '暂停' },
  { name: '项目3', status: '完成' }
]

const editItem = (item) => {
  console.log('编辑:', item)
}

const deleteItem = (item) => {
  console.log('删除:', item)
}
</script>
</template>
