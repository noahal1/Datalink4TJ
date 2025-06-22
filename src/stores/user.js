import { defineStore } from 'pinia'
import { userService } from '../services'
import router from '../router'
import { usePermissionStore } from './permission'
import Message from '../utils/notification'

// 调试模式标志
const isDebugMode = true // 开启调试模式
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[用户模块]', ...args)
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,         // 用户信息
    userId: null,       // 用户ID
    token: null,        // 认证令牌
    tokenExpiry: null,  // 令牌过期时间
    isLogin: false,     // 是否已登录
    department: null,   // 用户部门
    roles: [],          // 用户角色列表
    permissions: []     // 用户权限列表
  }),

  getters: {
    // 用户显示名称
    displayName: (state) => {
      if (!state.user) return '未登录'
      return state.user
    },

    // 检查是否已登录
    isAuthenticated: (state) => {
      return state.isLogin && state.token
    },

    // 获取完整的用户信息对象
    userInfo: (state) => {
      return {
        user: state.user,
        userId: state.userId,
        department: state.department,
        isLogin: state.isLogin,
        roles: state.roles
      }
    }
  },

  actions: {
    // 初始化用户状态
    async initialize() {
      debug('初始化用户状态')
      
      // 首先从本地存储加载数据
      this.loadFromStorage()
      
      // 如果有token且未过期，尝试获取用户信息
      if (this.token && this.isTokenValid()) {
        try {
          debug('令牌有效，获取用户信息')
          await this.getCurrentUser()
          debug('用户信息获取成功')
          
          // 确保权限信息已加载
          const permissionStore = usePermissionStore()
          await permissionStore.initialize()
          
          debug('令牌验证成功，更新用户信息')
          debug('刷新token有效期')
          this.updateTokenExpiry()
          this.saveToStorage()
          debug('用户状态已保存到localStorage')
          
          console.log('更新后的用户信息:', this.userInfo)
          return true
        } catch (error) {
          console.error('初始化用户状态失败:', error)
          this.clearUserState()
          return false
        }
      } else {
        debug('令牌无效或不存在')
        this.clearUserState()
        return false
      }
    },

    // 用户登录
    async login(username, password) {
      try {
        debug('尝试登录:', username)
        
        // 验证输入
        if (!username || !password) {
          const errorMsg = !username ? '用户名不能为空' : '密码不能为空';
          debug('登录失败: ' + errorMsg);
          throw new Error(errorMsg);
        }
        
        // 调用登录API
        const userData = await userService.login(username, password)
        
        if (!userData || !userData.token) {
          debug('登录失败: 服务器返回无效数据');
          throw new Error('登录失败: 服务器返回无效数据');
        }
        
        debug('登录成功，获取到的数据:', JSON.stringify(userData));
        
        // 设置用户数据
        this.setUserData(userData)
        
        // 登录成功后获取用户详细信息
        await this.getCurrentUser()
        
        debug('登录成功，用户信息已更新')
        
        // 更新token过期时间
        this.updateTokenExpiry()
        
        // 保存到本地存储
        this.saveToStorage()
        
        return true
      } catch (error) {
        const errorMessage = error.response?.data?.detail || error.message || '登录失败';
        debug('登录失败:', errorMessage);
        
        // 清除用户状态
        this.clearUserState()
        
        // 重新抛出错误，包含更详细的信息
        throw new Error(errorMessage);
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
          this.isLogin = true
          
          debug('用户信息获取成功:', this.user)
          return userData
        } else {
          throw new Error('获取用户信息失败')
        }
      } catch (error) {
        debug('获取用户信息失败:', error)
        throw error
      }
    },

    // 用户登出
    async logout() {
      debug('用户登出')
      this.clearUserState()
      
      // 如果当前不在登录页面，重定向到登录页
      if (router.currentRoute.value.path !== '/login') {
        debug('重定向到登录页面')
        router.push('/login')
      }
    },

    // 更新令牌
    async refreshToken() {
      try {
        debug('尝试刷新令牌')
        
        // 调用刷新令牌API
        const tokenData = await userService.refreshToken()
        
        if (tokenData && tokenData.token) {
          this.token = tokenData.token
          this.updateTokenExpiry()
          this.saveToStorage()
          debug('令牌刷新成功')
          return true
        } else {
          throw new Error('刷新令牌失败')
        }
      } catch (error) {
        debug('刷新令牌失败:', error)
        return false
      }
    },

    // 确保用户信息完整
    async ensureUserInfoIntegrity() {
      debug('确保用户信息完整性')
      
      // 如果已登录但用户信息不完整，尝试重新获取
      if (this.isLogin && this.token && (!this.user || !this.userId || !this.department)) {
        try {
          debug('用户信息不完整，尝试重新获取')
          await this.getCurrentUser()
          this.saveToStorage()
          debug('用户信息已补充完整')
          return true
        } catch (error) {
          debug('补充用户信息失败:', error)
          
          // 如果获取失败但有token，不要清除状态，让用户继续使用
          // 只有在token无效时才清除状态
          if (error.response && error.response.status === 401) {
            debug('认证失败，清除用户状态')
            this.clearUserState()
          }
          
          return false
        }
      }
      
      return true
    },

    // 设置用户数据
    setUserData(userData) {
      if (!userData) return
      
      debug('设置用户数据:', userData)
      
      if (userData.token) {
        this.token = userData.token
      }
      
      if (userData.user) {
        // 处理不同格式的用户数据
        if (typeof userData.user === 'object') {
          this.user = userData.user.username || userData.user.name || userData.user.user_name
          this.userId = userData.user.id || userData.user.user_id
          this.department = userData.user.department
        } else {
          this.user = userData.user
        }
      }
      
      // 直接从userData中获取用户ID和部门（兼容不同API返回格式）
      if (!this.userId && userData.user_id) {
        this.userId = userData.user_id
      }
      
      if (!this.department && userData.department) {
        this.department = userData.department
      }
      
      // 处理用户名
      if (!this.user && userData.user_name) {
        this.user = userData.user_name
      }
      
      if (userData.roles) {
        this.roles = userData.roles
      }
      
      this.isLogin = true
      debug('用户数据设置完成:', this.userInfo)
    },

    // 更新token过期时间（默认24小时）
    updateTokenExpiry() {
      const now = new Date()
      const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24小时后
      this.tokenExpiry = expiryTime.toISOString()
    },

    // 检查令牌是否有效（未过期）
    isTokenValid() {
      if (!this.token || !this.tokenExpiry) return false
      
      const now = new Date()
      const expiry = new Date(this.tokenExpiry)
      
      // 如果过期时间在当前时间之后，令牌有效
      return expiry > now
    },
    
    // 检查令牌是否即将过期（少于1小时）
    isTokenExpiringSoon() {
      if (!this.token || !this.tokenExpiry) return false
      
      const now = new Date()
      const expiry = new Date(this.tokenExpiry)
      
      // 计算过期时间与当前时间差（毫秒）
      const timeToExpiry = expiry - now
      
      // 如果剩余时间小于1小时（3600000毫秒），则认为即将过期
      return timeToExpiry < 3600000 && timeToExpiry > 0
    },

    // 从本地存储加载用户状态
    loadFromStorage() {
      try {
        const savedState = localStorage.getItem('user-store')
        if (savedState) {
          const state = JSON.parse(savedState)
          
          this.user = state.user
          this.userId = state.userId
          this.token = state.token
          this.tokenExpiry = state.tokenExpiry
          this.isLogin = state.isLogin
          this.department = state.department
          this.roles = state.roles || []
          
          debug('从本地存储加载用户状态:', this.user)
        }
      } catch (error) {
        console.error('从本地存储加载数据失败:', error)
      }
    },

    // 保存用户状态到本地存储
    saveToStorage() {
      try {
        const state = {
          user: this.user,
          userId: this.userId,
          token: this.token,
          tokenExpiry: this.tokenExpiry,
          isLogin: this.isLogin,
          department: this.department,
          roles: this.roles
        }
        
        localStorage.setItem('user-store', JSON.stringify(state))
        debug('用户状态已保存到本地存储')
      } catch (error) {
        console.error('保存数据到本地存储失败:', error)
      }
    },

    // 清除用户状态
    clearUserState() {
      debug('清除用户状态')
      this.user = null
      this.userId = null
      this.token = null
      this.tokenExpiry = null
      this.isLogin = false
      this.department = null
      this.roles = []
      this.permissions = []
      
      // 清除本地存储
      try {
        localStorage.removeItem('user-store')
      } catch (error) {
        console.error('清除本地存储数据失败:', error)
      }
    },

    // 添加setRoles方法，用于更新用户角色
    setRoles(roles) {
      if (Array.isArray(roles)) {
        this.roles = roles;
      }
    }
  },
  // 持久化设置
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user-store',
        storage: localStorage,
        paths: ['user', 'userId', 'token', 'tokenExpiry', 'isLogin', 'department', 'roles']
      }
    ]
  }
})

