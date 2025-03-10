import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null, // 用户信息
    department: null, // 用户部门信息
    isLogin: false // 用户登录标志
  }),
  persist: true,
  actions: {
    login(user) {
      this.user = user
      this.department = user.department
      this.isLogin = true
    },
    logout() {
      this.user = null
      this.isLogin = false
    },
  },
})

