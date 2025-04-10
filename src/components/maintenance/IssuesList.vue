<template>
  <v-card class="h-100 elevation-2">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
      问题记录
      <v-spacer></v-spacer>
      <v-btn color="error" size="small" variant="flat" prepend-icon="mdi-plus-circle" @click="$emit('add-issue')">
        记录问题
      </v-btn>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-card-text v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-subtitle-1">加载中...</div>
    </v-card-text>
    
    <v-card-text v-else-if="issues.length > 0" class="pa-2 issues-container">
      <div class="d-flex align-center mb-3">
        <v-chip-group>
          <v-chip variant="outlined" size="small" :color="filterActive === 'all' ? 'primary' : ''" @click="filterActive = 'all'">
            全部 ({{ issues.length }})
          </v-chip>
          <v-chip variant="outlined" size="small" :color="filterActive === 'open' ? 'error' : ''" @click="filterActive = 'open'">
            未解决 ({{ openIssuesCount }})
          </v-chip>
          <v-chip variant="outlined" size="small" :color="filterActive === 'resolved' ? 'success' : ''" @click="filterActive = 'resolved'">
            已解决 ({{ resolvedIssuesCount }})
          </v-chip>
        </v-chip-group>
      </div>
      
      <v-list density="compact">
        <v-list-item
          v-for="(issue, index) in filteredIssues"
          :key="index"
          :class="{'issue-resolved': issue.resolved}"
          class="mb-2 rounded issue-item"
        >
          <template v-slot:prepend>
            <v-icon :color="issue.resolved ? 'success' : 'error'" size="24">
              {{ issue.resolved ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
          </template>
          
          <v-list-item-title :class="{'text-decoration-line-through': issue.resolved}" class="font-weight-medium">
            {{ issue.description }}
          </v-list-item-title>
          
          <v-list-item-subtitle class="mt-1">
            <v-chip
              :color="getSeverityColor(issue.severity)"
              size="x-small"
              class="mr-2"
              text-color="white"
            >
              {{ issue.severity }}
            </v-chip>
            <span class="text-caption">{{ formatDate(issue.date) }}</span>
          </v-list-item-subtitle>
          
          <template v-slot:append>
            <div class="d-flex align-center">
              <v-btn
                :color="issue.resolved ? 'error' : 'success'"
                icon
                variant="text"
                size="small"
                @click="$emit('toggle-status', issue)"
                class="mr-1"
              >
                <v-icon>{{ issue.resolved ? 'mdi-close-circle' : 'mdi-check-circle' }}</v-icon>
              </v-btn>
              <v-btn icon="mdi-pencil" variant="text" size="small" @click="$emit('edit-issue', issue)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" @click="$emit('delete-issue', issue)"></v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    
    <v-card-text v-else class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-clipboard-check-outline</v-icon>
      <div class="mt-4 text-subtitle-1 text-grey">暂无问题记录</div>
      <v-btn color="error" class="mt-4" variant="flat" prepend-icon="mdi-plus-circle" @click="$emit('add-issue')">
        记录问题
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  issues: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['add-issue', 'edit-issue', 'delete-issue', 'toggle-status'])

// 过滤状态
const filterActive = ref('all')

// 计算属性: 过滤后的问题列表
const filteredIssues = computed(() => {
  if (filterActive.value === 'all') return props.issues
  if (filterActive.value === 'open') return props.issues.filter(i => !i.resolved)
  if (filterActive.value === 'resolved') return props.issues.filter(i => i.resolved)
  return props.issues
})

// 计算未解决和已解决的问题数量
const openIssuesCount = computed(() => props.issues.filter(i => !i.resolved).length)
const resolvedIssuesCount = computed(() => props.issues.filter(i => i.resolved).length)

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 获取严重程度颜色
const getSeverityColor = (severity) => {
  switch (severity) {
    case '严重': return 'error'
    case '中等': return 'warning'
    case '轻微': return 'info'
    default: return 'grey'
  }
}
</script>

<style scoped>
.issue-resolved {
  background-color: rgba(76, 175, 80, 0.08);
}

.issue-item {
  transition: background-color 0.3s ease, transform 0.2s ease;
  border-radius: 4px;
  margin-bottom: 4px;
}

.issue-item:hover {
  transform: translateX(4px);
  background-color: rgba(0, 0, 0, 0.03);
}

.issues-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style> 