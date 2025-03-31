import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import router from '../router'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null, // 用户信息
    department: null, // 用户部门信息
    isLogin: false, // 用户登录标志
    permissions: [], // 用户权限列表
    token: null, // JWT token
    tokenExpiresAt: null // token过期时间
  }),
  
  getters: {
    // 检查用户是否拥有特定权限
    hasPermission: (state) => (permission) => {
      if (!state.isLogin) return false
      if (state.user?.department === 'ADMIN') return true
      return state.permissions.includes(permission)
    },
    
    // 用户是否是管理员
    isAdmin: (state) => {
      return state.user?.department === 'ADMIN'
    },
    
    // 检查token是否即将过期
    isTokenExpiring: (state) => {
      if (!state.tokenExpiresAt) return false
      // 如果剩余有效期小于5分钟，认为即将过期
      const fiveMinutesLater = Date.now() + 5 * 60 * 1000
      return new Date(state.tokenExpiresAt) <= new Date(fiveMinutesLater)
    }
  },
  
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['user', 'department', 'isLogin', 'permissions', 'token', 'tokenExpiresAt']
  },
  
  actions: {
    async login(userData) {
      console.log('登录用户:', userData)
      
      // 保存用户数据和token
      this.user = {
        name: userData.username || userData.name,
        id: userData.id || Date.now(), // 如果后端没有提供ID，生成一个临时ID
        department: userData.department
      }
      this.department = userData.department
      this.isLogin = true
      this.token = userData.token || 'mock-token' // 如果后端没有提供token，使用模拟token
      
      // 设置权限
      this.permissions = userData.permissions || []
      
      // 设置token过期时间 (假设7天后过期)
      const expiresIn = 7 * 24 * 60 * 60 * 1000 // 7天
      this.tokenExpiresAt = Date.now() + expiresIn
      
      console.log('用户登录成功:', this.user)
      return true
    },
    
    logout() {
      console.log('用户登出')
      this.user = null
      this.department = null
      this.isLogin = false
      this.permissions = []
      this.token = null
      this.tokenExpiresAt = null
      
      // 清除记住密码
      localStorage.removeItem('userInfo')
    },
    
    // 初始化用户状态(刷新页面时调用)
    async initialize() {
      console.log('初始化用户状态', this.isLogin, this.user)
      
      // 如果已经登录且有用户信息，保持登录状态
      if (this.isLogin && this.user) {
        console.log('用户已登录，维持状态')
        return true
      }
      
      // 如果有token但没有登录状态，尝试恢复登录
      if (this.token && !this.isLogin) {
        try {
          // 这里可以添加token验证逻辑，例如调用后端API验证token
          // 但为了简化，我们直接认为token有效并恢复用户状态
          
          console.log('从存储中恢复用户状态')
          this.isLogin = true
          
          // 确保用户和部门信息已正确设置
          if (!this.user || !this.department) {
            console.warn('用户信息不完整，需要修复')
            // 如果用户信息不完整，可能需要调用后端API获取
            // 但为了简化，这里使用一个默认值
            this.user = this.user || { name: '未知用户', department: this.department || 'UNKNOWN' }
            this.department = this.department || this.user.department
          }
          
          return true
        } catch (error) {
          console.error('恢复用户状态失败:', error)
          // 不要登出，只是返回失败
          return false
        }
      }
      
      console.log('无法恢复用户状态，需要重新登录')
      return false
    },
    
    // 简化版的token验证方法
    async validateToken() {
      // 实际应用中，应该调用后端API来验证token
      // 为了简化，我们只检查token是否存在和是否过期
      if (!this.token) return false
      
      // 如果设置了过期时间，检查是否过期
      if (this.tokenExpiresAt) {
        const now = Date.now()
        if (now > this.tokenExpiresAt) {
          console.log('Token已过期')
          return false
        }
      }
      
      return true
    }
  },
})

