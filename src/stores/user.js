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

// 从localStorage直接获取用户信息
const getUserFromStorage = () => {
  try {
    const userStoreStr = localStorage.getItem('user-store');
    if (userStoreStr) {
      const userData = JSON.parse(userStoreStr);
      console.log('从localStorage读取用户数据:', userData);
      return userData;
    }
  } catch (e) {
    console.error('解析localStorage中的用户数据失败:', e);
  }
  return null;
}

export const useUserStore = defineStore('user', {
  state: () => {
    // 尝试从localStorage恢复状态
    const storedData = getUserFromStorage();
    
    return {
      user: storedData?.user || null,
      department: storedData?.department || null,
      isLogin: storedData?.isLogin || false,
      roles: storedData?.roles || [],
      token: storedData?.token || null,
      tokenExpiresAt: storedData?.tokenExpiresAt || null,
      userId: storedData?.userId || null
    };
  },
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
      debug('初始化用户状态');
      console.log('初始化用户状态，当前用户:', this.user, '登录状态:', this.isLogin);
      
      // 如果已经从localStorage加载了状态，直接使用
      if (this.isLogin && this.token) {
        debug('已从localStorage加载用户状态');
        
        // 如果用户名为空但有其他信息，尝试从服务器获取完整信息
        if (!this.user && this.isLogin) {
          debug('用户名为空但已登录，尝试从服务器获取完整信息');
          await this.ensureUserInfoIntegrity();
        }
        
        // 验证token是否有效
        try {
          // 创建验证请求
          const response = await basicApi.get('/users/me', {
            headers: {
              'Authorization': `Bearer ${this.token}`
            },
            // 增加超时时间，避免网络波动导致登出
            timeout: 10000
          })
          
          // 更新用户信息
          if (response.data) {
            debug('令牌验证成功，更新用户信息')
            // 确保所有字段都正确处理
            this.user = this.processUserName(response.data.user_name)
            this.department = this.processDepartment(response.data.department)
            this.userId = this.processUserId(response.data.user_id)
            this.roles = this.processRoles(response.data.roles)
            this.isLogin = true
            
            // 刷新token有效期
            this.refreshToken()
            
            // 保存到localStorage
            this.saveToStorage();
            
            console.log('更新后的用户信息:', {
              user: this.user,
              department: this.department,
              userId: this.userId,
              roles: this.roles
            });
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
            // 连接超时或网络错误，保持当前登录状态
            debug('连接超时或网络错误，保持当前登录状态')
            console.warn('无法验证令牌，但保持登录状态')
            // 在网络错误的情况下，保持登录状态
            return true
          } else {
            // 其他服务器错误，保持当前登录状态
            debug('服务器错误，保持当前登录状态:', error.message)
            console.warn('无法验证令牌，但保持登录状态:', error.message)
            return true
          }
        }
      } else if (this.isLogin) {
        // 如果标记为已登录但没有token，这是不一致的状态
        debug('发现不一致状态：已登录但无token，执行登出')
        this.logout()
        return false
      }
      
      return false
    },
    
    // 手动保存到localStorage
    saveToStorage() {
      try {
        const stateToSave = {
          user: this.user,
          department: this.department,
          isLogin: this.isLogin,
          roles: this.roles,
          token: this.token,
          tokenExpiresAt: this.tokenExpiresAt,
          userId: this.userId
        };
        
        localStorage.setItem('user-store', JSON.stringify(stateToSave));
        debug('用户状态已保存到localStorage');
      } catch (e) {
        console.error('保存用户状态到localStorage失败:', e);
      }
    },
    
    // 处理用户名，确保返回字符串
    processUserName(userName) {
      if (!userName) return '';
      
      if (typeof userName === 'string') {
        return userName;
      }
      
      if (typeof userName === 'object' && userName !== null) {
        return userName.name || userName.username || '';
      }
      
      return String(userName);
    },
    
    // 处理部门信息，确保返回正确格式
    processDepartment(department) {
      if (!department) return '';
      
      // 如果是字符串，直接返回
      if (typeof department === 'string') {
        return department;
      }
      
      // 如果是对象，返回对象的name属性
      if (typeof department === 'object' && department !== null) {
        return department.name || '';
      }
      
      return String(department);
    },
    
    // 处理用户ID
    processUserId(userId) {
      if (userId === null || userId === undefined) return null;
      
      if (typeof userId === 'number') {
        return userId;
      }
      
      if (typeof userId === 'string') {
        const parsedId = parseInt(userId);
        return isNaN(parsedId) ? null : parsedId;
      }
      
      return null;
    },
    
    // 处理角色信息，确保返回字符串数组
    processRoles(roles) {
      if (!roles) return [];
      
      // 如果已经是数组
      if (Array.isArray(roles)) {
        return roles.map(role => {
          if (typeof role === 'string') {
            return role;
          }
          if (typeof role === 'object' && role !== null) {
            return role.name || '';
          }
          return String(role);
        }).filter(role => role); // 过滤掉空字符串
      }
      
      // 如果是字符串，可能是逗号分隔的角色列表
      if (typeof roles === 'string') {
        return roles.split(',').map(r => r.trim()).filter(r => r);
      }
      
      // 如果是单个对象
      if (typeof roles === 'object' && roles !== null) {
        if (roles.name) {
          return [roles.name];
        }
        
        // 尝试从对象中提取角色名称
        const roleNames = [];
        for (const key in roles) {
          if (typeof roles[key] === 'string') {
            roleNames.push(roles[key]);
          } else if (typeof roles[key] === 'object' && roles[key] && roles[key].name) {
            roleNames.push(roles[key].name);
          }
        }
        
        return roleNames.length ? roleNames : ['未知角色'];
      }
      
      return [];
    },
    
    // 刷新token有效期
    refreshToken() {
      debug('刷新token有效期')
      // 设置token过期时间 (14天)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 14)
      this.tokenExpiresAt = expiresAt
    },
    
    // 确保用户信息完整性
    async ensureUserInfoIntegrity() {
      debug('确保用户信息完整性')
      
      // 如果缺少关键信息，尝试从服务器获取
      if (this.isLogin && this.token && (!this.user || !this.userId || !this.department)) {
        debug('用户信息不完整，尝试从服务器获取')
        
        try {
          const response = await basicApi.get('/users/me', {
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          })
          
          if (response.data) {
            // 只更新缺失的字段
            if (!this.user) {
              this.user = this.processUserName(response.data.user_name)
            }
            
            if (!this.department) {
              this.department = this.processDepartment(response.data.department)
            }
            
            if (!this.userId) {
              this.userId = this.processUserId(response.data.user_id)
            }
            
            if (!this.roles || this.roles.length === 0) {
              this.roles = this.processRoles(response.data.roles)
            }
            
            // 保存到localStorage
            this.saveToStorage();
            
            debug('用户信息已补充完整:', {
              user: this.user,
              department: this.department,
              userId: this.userId,
              roles: this.roles
            })
          }
        } catch (error) {
          console.warn('获取完整用户信息失败:', error.message)
        }
      }
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
        this.user = this.processUserName(response.data.user_name)
        this.department = this.processDepartment(response.data.department)
        this.userId = this.processUserId(response.data.user_id)
        this.roles = this.processRoles(response.data.roles)
        this.isLogin = true
        
        // 设置token过期时间
        this.refreshToken()
        
        // 确保用户信息完整性
        this.ensureUserInfoIntegrity()
        
        // 手动保存到localStorage
        this.saveToStorage();
        
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
      
      // 清除localStorage中的用户数据
      localStorage.removeItem('user-store');
      
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
  },
  persist: {
    // 使用自定义持久化，不依赖pinia-plugin-persistedstate
    enabled: false
  }
})

