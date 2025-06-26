import { defineStore } from 'pinia'
import { userService } from '../../services'
import { useAuthStore } from './auth'

// 调试模式标志
const isDebugMode = false // 默认关闭调试模式
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[用户模块]', ...args)
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,         // 用户名称
    userId: null,       // 用户ID
    department: null,   // 用户部门
    roles: [],          // 用户角色列表
  }),

  getters: {
    // 用户显示名称
    displayName: (state) => {
      if (!state.user) return '未登录'
      return state.user
    },

    // 获取完整的用户信息对象
    userInfo: (state) => {
      return {
        user: state.user,
        userId: state.userId,
        department: state.department,
        roles: state.roles
      }
    },
    
    // 检查是否是超级管理员
    isSuperAdmin: (state) => {
      return state.roles.includes('超级管理员')
    }
  },

  actions: {
    // 初始化用户状态
    async initialize() {
      debug('初始化用户状态')
      
      // 获取认证存储
      const authStore = useAuthStore()
      
      // 首先从本地存储加载数据
      this.loadFromStorage()
      
      // 如果有token且未过期，尝试获取用户信息
      if (authStore.token && authStore.isTokenValid()) {
        try {
          debug('令牌有效，获取用户信息')
          await this.getCurrentUser()
          debug('用户信息获取成功')
          
          debug('更新token有效期')
          authStore.updateTokenExpiry()
          this.saveToStorage()
          debug('用户状态已保存到localStorage')
          
          return true
        } catch (error) {
          console.error('初始化用户状态失败:', error)
          this.clearUserData()
          return false
        }
      } else {
        debug('令牌无效或不存在')
        this.clearUserData()
        return false
      }
    },

    // 获取当前登录用户信息
    async getCurrentUser() {
      try {
        // 获取用户详情
        const userData = await userService.getCurrentUser()
        
        if (userData) {
          this.user = userData.name || userData.username
          this.userId = userData.id
          this.department = userData.department
          this.roles = userData.roles || []
          
          debug('用户信息获取成功:', this.user)
          
          // 保存到本地存储
          this.saveToStorage()
          
          return userData
        } else {
          throw new Error('获取用户信息失败')
        }
      } catch (error) {
        debug('获取用户信息失败:', error)
        throw error
      }
    },

    // 从本地存储加载用户状态
    loadFromStorage() {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          this.user = userData.user
          this.userId = userData.userId
          this.department = userData.department
          this.roles = userData.roles || []
          debug('从本地存储加载用户状态')
        }
      } catch (error) {
        debug('从本地存储加载用户状态失败:', error)
        this.clearUserData()
      }
    },

    // 保存用户状态到本地存储
    saveToStorage() {
      try {
        const userData = {
          user: this.user,
          userId: this.userId,
          department: this.department,
          roles: this.roles
        }
        localStorage.setItem('user', JSON.stringify(userData))
        debug('用户状态已保存到本地存储')
      } catch (error) {
        debug('保存用户状态到本地存储失败:', error)
      }
    },

    // 清除用户数据
    clearUserData() {
      this.user = null
      this.userId = null
      this.department = null
      this.roles = []
      
      // 清除本地存储
      localStorage.removeItem('user')
      debug('用户数据已清除')
    },

    // 设置角色
    setRoles(roles) {
      this.roles = roles
      this.saveToStorage()
    }
  },
  
  // 启用该store的持久化
  persist: {
    // 只持久化以下字段
    paths: ['user', 'userId', 'department', 'roles']
  }
}) 