// 任务类型定义
export const taskTypes = [
  { value: 1, label: '定期维护' },
  { value: 2, label: '设备调试' },
  { value: 3, label: '故障维修' },
  { value: 4, label: '备件更换' },
  { value: 5, label: '预防性维护' }
]

// 获取任务类型标签
export const getTaskTypeLabel = (typeId) => {
  const type = taskTypes.find(t => t.value === parseInt(typeId))
  return type ? type.label : '未知类型'
}

// 获取任务类型颜色
export const getTaskTypeColor = (typeId) => {
  const typeValue = parseInt(typeId)
  switch (typeValue) {
    case 1: return 'primary'   // 定期维护
    case 2: return 'info'      // 设备调试
    case 3: return 'error'     // 故障维修
    case 4: return 'warning'   // 备件更换
    case 5: return 'success'   // 预防性维护
    default: return 'grey'
  }
}

// 格式化日期
export const formatDate = (dateString, includeYear = true) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return includeYear 
    ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    : `${date.getMonth() + 1}月${date.getDate()}日`
} 