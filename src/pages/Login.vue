<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-card-title class="headline text-center">登录</v-card-title>
          <v-card-text>
            <v-form>
              <v-text-field
                v-model="username"
                label="用户名"
                prepend-icon="mdi-account"
                required
                outlined
                dense
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="密码"
                type="password"
                prepend-icon="mdi-lock"
                required
                outlined
                dense
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="gery" @click="login" block>登录</v-btn>
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

const username = ref('')
const password = ref('')
const userStore = useUserStore()
const router = useRouter()

// 部门映射
const departmentMap = {
  'qa': 'qa',
  'assy': 'assy',
  'mat': 'mat',
  'ehs': 'ehs',
  'admin': 'admin',
}

const login = () => {
  const user = {
    name: username.value,
    department: departmentMap[username.value] || 'unknown', // 使用映射来确定部门
    role: username.value === 'admin' ? 'admin' : 'user', // 设置角色
  }
  userStore.login(user)
  router.push('/')
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
  overflow: hidden;
}

.v-card-title {
  background-color: #cecece69;
  color: rgb(0, 0, 0);
  padding: 16px;
}

.v-btn {
  margin-top: 10px;
}

.v-text-field {
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>