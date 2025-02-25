<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-card-title class="headline text-center mb-4">欢迎登录</v-card-title>
          <v-card-text>
            <v-form ref="loginForm" v-model="formValid">
              <v-text-field 
                v-model="username"
                label="用户名"
                prepend-icon="mdi-account"
                required 
                outlined 
                dense 
                :rules="[v => !!v || '用户名不能为空']"
                class="mb-4"
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
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { de } from 'date-fns/locale'

const username = ref('')
const password = ref('')
const rememberPassword = ref(false)
const formValid = ref(false)
const loading = ref(false)
const userStore = useUserStore()
const router = useRouter()

// 初始化 - 从 localStorage 中读取记住的密码 
const savedUserInfo = localStorage.getItem('userInfo') 
if (savedUserInfo) {
  const userInfo = JSON.parse(savedUserInfo) 
  username.value = userInfo.username || ''
  password.value = userInfo.password || ''
  rememberPassword.value = true 
}

const login = async () => {
  try {
    loading.value = true 
    if (!formValid.value) return 

    const formData = new URLSearchParams({
      username: username.value, 
      password: password.value
    });

    const response = await fetch('http://10.227.122.217:8000/users/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '登录失败')
    }

    const data = await response.json()

    // 记住密码功能 
    if (rememberPassword.value) {
      localStorage.setItem('userInfo', JSON.stringify({ 
        username: username.value, 
        password: password.value 
      }))
    } else {
      localStorage.removeItem('userInfo') 
    }

    const user = {
      name: username.value, 
      department: data.department || '未知部门',
    }
    userStore.login(user) 

    // 跳转到主页 
    router.push('/') 
    ElMessage({
      type: 'success',
      message: '登录成功'
    })
  } catch (error) {
    ElMessage({
      type: 'error',
      message: error.message || '登录失败，请重试'
    })
  } finally {
    loading.value = false 
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.v-card-title {
  background-color: rgba(206, 206, 206, 0.4);
  color: rgb(0, 0, 0);
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.v-btn {
  margin-top: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.v-btn:hover {
  opacity: 0.9;
}

.v-text-field {
  margin-top: 10px;
  margin-bottom: 10px;
}

.v-checkbox {
  margin-top: 10px;
}

.v-btn--loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: inherit;
}

/* 鼠标悬停效果 */
.v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

/* 表单输入框聚焦效果 */
.v-input--is-focused .v-input__control {
  border-color: var(--primary-color);
}

/* 错误信息样式 */
.v-messages__message--error {
  color: var(--error-color);
  font-size: 13px;
}
</style>