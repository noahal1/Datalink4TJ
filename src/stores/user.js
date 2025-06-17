import { defineStore } from 'pinia'
import Message from '../utils/notification'
import axios from 'axios'
import router from '../router'

// API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 调试功能 - 开发模式下打印详细日志
const isDebugMode = true;
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[用户模块]', ...args);
  }
};

// 创建一个不使用拦截器的axios实例，避免循环依赖
const basicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
})

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    department: null,
    isLogin: false,
    roles: [],
    token: null,
    tokenExpiresAt: null,
    userId: null // 添加单独的userId字段方便访问
  }),
  getters: {
    // 用户名
    username: (state) => state.user,
    
    // 部门名称
    departmentName: (state) => state.department,
    
    // 是否登录
    loggedIn: (state) => state.isLogin,
    
    // 是否是超级管理员
    isSuperUser: (state) => {
      return state.roles && state.roles.includes('超级管理员')
    },
    
    // 是否是管理员
    isAdmin: (state) => {
      return state.roles && state.roles.some(role => 
        role === '超级管理员' || role === '系统管理员' || role === '管理员'
      )
    }
  },
  actions: {
    // 初始化用户状态
    async initialize() {
      debug('初始化用户状态')
      // 尝试从本地存储加载用户信息
      const loaded = this.loadUserFromStorage()
      if (loaded) {
        debug('用户状态已从本地存储恢复')
        // 验证token是否有效
        try {
          // 创建验证请求
          const response = await basicApi.get('/users/me', {
            headers: {
              'Authorization': `Bearer ${this.token}`
            },
            // 设置较短的超时时间，避免长时间等待
            timeout: 5000
          })
          
          // 更新用户信息
          if (response.data) {
            debug('令牌验证成功，更新用户信息')
            this.user = response.data.user_name
            this.department = response.data.department
            this.userId = response.data.user_id
            this.roles = response.data.roles || []
            this.isLogin = true
            
            // 刷新本地存储
            this.saveUserToStorage()
          }
          
          return true
        } catch (error) {
          debug('令牌验证请求失败:', error.message)
          
          // 检查错误类型
          if (error.response && error.response.status === 401) {
            // 令牌无效，执行登出
            debug('令牌无效，执行登出')
            this.logout()
            return false
          } else if (error.code === 'ECONNABORTED' || !error.response) {
            // 连接超时或网络错误，保持当前登录状态并尝试重试一次
            debug('连接超时或网络错误，重试一次')
            try {
              // 延时1秒后重试
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              const retryResponse = await basicApi.get('/users/me', {
                headers: {
                  'Authorization': `Bearer ${this.token}`
                },
                timeout: 8000 // 增加超时时间
              })
              
              if (retryResponse.data) {
                debug('重试成功，更新用户信息')
                this.user = retryResponse.data.user_name
                this.department = retryResponse.data.department
                this.userId = retryResponse.data.user_id
                this.roles = retryResponse.data.roles || []
                this.isLogin = true
                
                // 刷新本地存储
                this.saveUserToStorage()
                return true
              }
            } catch (retryError) {
              debug('重试失败，保持当前登录状态:', retryError.message)
              console.warn('无法验证令牌，但保持登录状态')
              return true
            }
          } else {
            // 其他服务器错误，保持当前登录状态
            debug('服务器错误，保持当前登录状态:', error.message)
            console.warn('无法验证令牌，但保持登录状态:', error.message)
            return true
          }
        }
      }
      return false
    },
    
    // 从本地存储加载用户信息
    loadUserFromStorage() {
      debug('从本地存储加载用户信息')
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      const department = localStorage.getItem('department')
      const userId = localStorage.getItem('userId')
      const tokenExpiresAt = localStorage.getItem('tokenExpiresAt')
      const roles = JSON.parse(localStorage.getItem('roles') || '[]')
      
      if (token && user) {
        this.token = token
        this.user = user
        this.department = department
        this.userId = userId ? parseInt(userId) : null
        this.tokenExpiresAt = tokenExpiresAt ? new Date(tokenExpiresAt) : null
        this.roles = roles
        this.isLogin = true
        
        debug('用户信息加载成功:', { 
          user: this.user, 
          department: this.department,
          userId: this.userId,
          roles: this.roles
        })
        
        // 检查token是否过期
        if (this.tokenExpiresAt && new Date() > this.tokenExpiresAt) {
          debug('Token已过期，执行登出')
          this.logout()
          return false
        }
        
        return true
      }
      
      debug('没有找到存储的用户信息或token')
      return false
    },
    
    // 保存用户信息到本地存储
    saveUserToStorage() {
      debug('保存用户信息到本地存储')
      localStorage.setItem('token', this.token)
      localStorage.setItem('user', this.user)
      localStorage.setItem('department', this.department || '')
      localStorage.setItem('userId', this.userId || '')
      localStorage.setItem('roles', JSON.stringify(this.roles || []))
      
      // 设置token过期时间 (7天)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      this.tokenExpiresAt = expiresAt
      localStorage.setItem('tokenExpiresAt', expiresAt.toISOString())
    },
    
    // 登录
    async login(username, password) {
      debug('尝试登录:', username)
      try {
        // 构建表单数据
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)
        
        // 发送登录请求
        const response = await basicApi.post('/users/token', formData)
        
        debug('登录响应:', response.data)
        
        // 更新状态
        this.token = response.data.access_token
        this.user = response.data.user_name
        this.department = response.data.department
        this.userId = response.data.user_id
        this.roles = response.data.roles || []
        this.isLogin = true
        
        // 保存到本地存储
        this.saveUserToStorage()
        
        Message.success('登录成功')
        return true
      } catch (error) {
        console.error('登录失败:', error)
        const errorMessage = error.response?.data?.detail || '登录失败，请检查用户名和密码'
        Message.error(errorMessage)
        return false
      }
    },
    
    // 登出
    async logout() {
      debug('执行登出')
      // 清除状态
      this.token = null
      this.user = null
      this.department = null
      this.userId = null
      this.roles = []
      this.isLogin = false
      this.tokenExpiresAt = null
      
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('department')
      localStorage.removeItem('userId')
      localStorage.removeItem('tokenExpiresAt')
      localStorage.removeItem('roles')
      
      // 重定向到登录页
      router.push('/login')
    },
    
    // 获取用户详细信息
    async getUserInfo() {
      if (!this.isLogin || !this.userId) {
        debug('未登录，无法获取用户信息')
        return null
      }
      
      debug('获取用户详细信息:', this.userId)
      try {
        const response = await basicApi.get(`/users/${this.userId}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
        
        debug('用户详细信息:', response.data)
        return response.data
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return null
      }
    }
  }
})

