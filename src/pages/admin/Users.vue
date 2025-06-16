// 加载角色列表
const loadRoles = async () => {
  try {
    const response = await api.get('/simple-roles')
    roles.value = response.data || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
    Message.error('获取角色列表失败')
  }
} 