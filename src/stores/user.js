import { defineStore } from 'pinia'
import Message from '../utils/notification'
import api from '../utils/api'
import router from '../router'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    department: null,
    isLogin: false,
    permissions: [],
    token: null,
    tokenExpiresAt: null,
    userId: null // 添加单独的userId字段方便访问
  }),
  getters: {
    // 检查用户是否拥有特定权限
    hasPermission: (state) => (permission) => {
      if (!state.isLogin) return false
      if (state.department === 'ADMIN') return true
      return state.permissions.includes(permission)
    },
    
    // 用户是否是管理员
    isAdmin: (state) => {
      return state.department === 'ADMIN'
    }
  },
  
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['user', 'department', 'isLogin', 'permissions', 'token', 'tokenExpiresAt', 'userId']
  },
  
  actions: {
    // 添加初始化方法
    async initialize() {
      // 如果已登录，直接返回true
      if (this.isLogin && this.user && this.token) {
        console.log('用户已经登录，无需初始化')
        return true
      }
      
      // 从存储中恢复状态
      if (this.token && !this.isLogin) {
        try {
          // 验证token是否有效
          if (await this.validateToken()) {
            this.isLogin = true
            console.log('从存储中恢复用户状态成功')
            return true
          }
        } catch (error) {
          console.error('恢复用户状态失败:', error)
        }
      }
      
      return false
    },
    
    // 验证token的方法
    async validateToken() {
      // 实际应用中，应该调用后端API来验证token
      if (!this.token) return false
      
      // 检查token是否过期
      if (this.tokenExpiresAt) {
        const now = Date.now()
        if (now > this.tokenExpiresAt) {
          console.log('Token已过期')
          return false
        }
      }
      
      return true
    },
    
    async login(userData) {
      try {
        // 创建FormData对象
        const formData = new URLSearchParams();
        formData.append('username', userData.name);
        formData.append('password', userData.password);
        
        const response = await api.post('/users/token', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        // 保存用户数据和token
        this.user = {
          name: userData.name,
          id: null // 稍后更新
        };
        this.department = response.department;
        this.isLogin = true;
        this.token = response.access_token;
        
        // 设置token过期时间 (假设2小时后过期，与后端一致)
        const expiresIn = 120 * 60 * 1000; // 120分钟
        this.tokenExpiresAt = Date.now() + expiresIn;
        
        // 获取用户详细信息
        await this.fetchUserDetails();
        
        console.log('用户登录成功:', this.user);
        return true;
      } catch (error) {
        console.error('登录失败:', error);
        Message.error('登录失败: ' + (error.response?.data?.detail || error.message || '未知错误'));
        return false;
      }
    },
    
    // 登出方法
    logout() {
      this.user = null;
      this.department = null;
      this.isLogin = false;
      this.permissions = [];
      this.token = null;
      this.tokenExpiresAt = null;
      this.userId = null;
      
      console.log('用户已登出');
      Message.success('已成功登出');
    },
    
    // 获取用户详细信息的方法
    async fetchUserDetails() {
      try {
        const users = await api.get('/users/');
        const currentUser = users.find(user => user.name === this.user.name);
        
        if (currentUser) {
          this.user.id = currentUser.id;
          this.userId = currentUser.id;
          console.log('成功获取并保存用户ID:', currentUser.id);
        }
      } catch (error) {
        console.error('获取用户详情失败:', error);
      }
    }
  }
})

