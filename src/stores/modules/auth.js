import { defineStore } from 'pinia'
import { userService } from '../../services'
import router from '../../router'

// 调试模式标志
const isDebugMode = false // 默认关闭调试模式
const debug = (...args) => {
  if (isDebugMode) {
    console.log('[认证模块]', ...args)
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,        // 认证令牌
    tokenExpiry: null,  // 令牌过期时间
    isLogin: false,     // 是否已登录
  }),

  getters: {
    // 检查是否已登录
    isAuthenticated: (state) => {
      return state.isLogin && state.token
    }
  },

  actions: {
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
        
        debug('登录成功，获取到的数据');
        
        // 设置用户数据
        this.setAuthData(userData)
        
        // 更新token过期时间
        this.updateTokenExpiry()
        
        // 保存到本地存储
        this.saveToStorage()
        
        return true
      } catch (error) {
        const errorMessage = error.response?.data?.detail || error.message || '登录失败';
        debug('登录失败:', errorMessage);
        
        // 清除用户状态
        this.clearAuthState()
        
        // 重新抛出错误，包含更详细的信息
        throw new Error(errorMessage);
      }
    },

    // 用户登出
    async logout() {
      debug('用户登出')
      this.clearAuthState()
      
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

    // 设置认证数据
    setAuthData(authData) {
      if (authData.token) {
        this.token = authData.token
        this.isLogin = true
      }
    },

    // 更新令牌过期时间（默认2小时）
    updateTokenExpiry() {
      const expiryTime = new Date()
      expiryTime.setHours(expiryTime.getHours() + 2) // 2小时后过期
      this.tokenExpiry = expiryTime.getTime()
    },

    // 检查令牌是否有效
    isTokenValid() {
      if (!this.token || !this.tokenExpiry) return false
      const now = new Date().getTime()
      return now < this.tokenExpiry
    },

    // 检查令牌是否即将过期（30分钟内）
    isTokenExpiringSoon() {
      if (!this.token || !this.tokenExpiry) return false
      const now = new Date().getTime()
      const thirtyMinutesMs = 30 * 60 * 1000
      return (this.tokenExpiry - now) < thirtyMinutesMs
    },

    // 从本地存储加载认证状态
    loadFromStorage() {
      try {
        const storedAuth = localStorage.getItem('auth')
        if (storedAuth) {
          const authData = JSON.parse(storedAuth)
          this.token = authData.token
          this.tokenExpiry = authData.tokenExpiry
          this.isLogin = authData.isLogin || false
          debug('从本地存储加载认证状态')
        }
      } catch (error) {
        debug('从本地存储加载认证状态失败:', error)
        this.clearAuthState()
      }
    },

    // 保存认证状态到本地存储
    saveToStorage() {
      try {
        const authData = {
          token: this.token,
          tokenExpiry: this.tokenExpiry,
          isLogin: this.isLogin
        }
        localStorage.setItem('auth', JSON.stringify(authData))
        debug('认证状态已保存到本地存储')
      } catch (error) {
        debug('保存认证状态到本地存储失败:', error)
      }
    },

    // 清除认证状态
    clearAuthState() {
      this.token = null
      this.tokenExpiry = null
      this.isLogin = false
      
      // 清除本地存储
      localStorage.removeItem('auth')
      debug('认证状态已清除')
    }
  },
  
  // 启用该store的持久化
  persist: {
    // 只持久化以下字段
    paths: ['token', 'tokenExpiry', 'isLogin']
  }
}) 