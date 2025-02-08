import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import DepartmentData from '../pages/DepartmentData.vue'
import Login from '../pages/Login.vue'
import Quality from '../pages/Quality.vue' 

const routes = [
  { path: '/', component: Dashboard },
  { path: '/department', component: DepartmentData },
  { path: '/login', component: Login },
  { path: '/quality', component: Quality } 
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router