<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 login-card">
          <v-card-title class="headline text-center mb-4">欢迎登录</v-card-title>
          <v-card-text>
            <v-form ref="loginForm" v-model="formValid" @submit.prevent="login">
              <v-text-field 
                v-model="username"
                label="用户名"
                prepend-icon="mdi-account"
                required 
                outlined 
                dense 
                :rules="[v => !!v || '用户名不能为空']"
                class="mb-4"
                @keyup.enter="login"
              ></v-text-field>
              <v-text-field 
                v-model="password"
                label="密码"
                type="password"
                prepend-icon="mdi-lock"
                required 
                outlined 
                dense 
                :rules="[v => !!v || '密码不能为空']"
                class="mb-4"
                @keyup.enter="login"
              ></v-text-field>
              <div class="d-flex justify-space-between align-center mb-4">
                <v-checkbox 
                  v-model="rememberPassword"
                  label="记住密码"
                  hide-details 
                  class="mt-0 pt-0"
                ></v-checkbox>
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary"
              @click="login"
              block 
              :loading="loading"
              :disabled="!formValid || loading"
              height="48"
            >
              登录 
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import { useRouter } from 'vue-router'
import Message from '../utils/notification'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const username = ref('')
const password = ref('')
const rememberPassword = ref(false)
const formValid = ref(false)
const loading = ref(false)
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const router = useRouter()

// 从localStorage中加载保存的用户信息
onMounted(() => {
  const savedUserInfo = localStorage.getItem('userInfo') 
  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo) 
      username.value = userInfo.username || ''
      password.value = userInfo.password || ''
      rememberPassword.value = true 
    } catch (e) {
      console.error('解析保存的用户信息时出错:', e)
      localStorage.removeItem('userInfo')
    }
  }
})

const login = async () => {
  try {
    loading.value = true 
    if (!formValid.value) return 

    // 调用store的登录方法，直接传递用户名和密码
    const success = await userStore.login(username.value, password.value)
    
    if (success) {
      // 初始化权限系统
      await permissionStore.initialize()
      
      // 保存记住的密码
      if (rememberPassword.value) {
        localStorage.setItem('userInfo', JSON.stringify({ 
          username: username.value, 
          password: password.value 
        }))
      } else {
        localStorage.removeItem('userInfo') 
      }
      
      // 重定向到首页或之前尝试访问的页面
      const redirectPath = sessionStorage.getItem('redirectPath') || '/'
      sessionStorage.removeItem('redirectPath')
      router.replace(redirectPath)
      
      Message.success('登录成功')
    }
  } catch (error) {
    Message.error(error.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.v-card-title {
  background-color: rgba(206, 206, 206, 0.4);
  color: rgb(0, 0, 0);
  padding: 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.v-btn {
  margin-top: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.v-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.v-text-field {
  margin-bottom: 16px;
}

.v-checkbox {
  margin-top: 8px;
}
</style>