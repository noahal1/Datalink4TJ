<template>
  <v-app>
    <v-app-bar app>
      <v-container>
        <v-row align="center">
          <v-col cols="auto">
            <img src="@/assets/logo.png" alt="Logo" class="app-logo">
          </v-col>
          <v-col cols="auto">
            <v-toolbar-title>数据上报系统</v-toolbar-title>
          </v-col>
        </v-row>
      </v-container>
      <v-spacer></v-spacer>
      <v-btn v-if="user && (user.department === 'ASSY' || user.department === 'ADMIN')" text to="/assy">
        <v-icon>mdi-hammer-wrench</v-icon>生产
      </v-btn>
      <v-btn v-if="user && (user.department === 'QA' || user.department === 'ADMIN')" text to="/quality">
        <v-icon>mdi-checkbox-multiple-marked-circle-outline</v-icon>GP12
      </v-btn>
      <v-btn v-if="user && (user.department === 'QA' || user.department === 'ADMIN')" text to="/qa_others">
        <v-icon>mdi-account-group-outline</v-icon>质量杂项
      </v-btn>
      <v-btn v-if="user && (user.department === 'MAT' || user.department === 'ADMIN')" text to="/maintenance">
        <v-icon>mdi-wrench</v-icon>维修
      </v-btn>
      <v-btn v-if="user && (user.department === 'PCL' || user.department === 'ADMIN')" text to="/pcl">
        <v-icon>mdi-truck</v-icon>物流
      </v-btn>
      <v-btn v-if="user && (user.department === 'EHS' || user.department === 'ADMIN')" text to="/ehs">
        <v-icon>mdi-security</v-icon>EHS
      </v-btn>
      <v-btn v-if="user && (user.department === 'GMO' || user.department === 'ADMIN')"text to="/gmo">
        <v-icon>mdi-earth</v-icon>GMO
      </v-btn>
      <v-btn text to="/events">
        <v-icon>mdi-calendar-text</v-icon>重要事件
      </v-btn>
      <v-btn v-if="user && user.department === 'ADMIN'" text to="/admin">
        <v-icon>mdi-shield-account</v-icon>管理
      </v-btn>
      <v-btn v-if="user" text @click="logout">
        <v-icon left>mdi-logout</v-icon>登出
      </v-btn>
      <v-btn v-else text to="/login">
        <v-icon left>mdi-login</v-icon>登录
      </v-btn>
    </v-app-bar>
    <v-main>
      <transition name="fade" mode="out-in">
        <router-view></router-view>
      </transition>
    </v-main>
  </v-app>
</template>

<script setup>
import { useUserStore } from './stores/user.js'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const router = useRouter()

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style>
.app-logo {
  height: 40px;
  margin-right: 10px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>