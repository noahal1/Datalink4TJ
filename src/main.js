import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@mdi/font/css/materialdesignicons.css'
import vuetify from './plugins/vuetify'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import pinia from './stores'

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(ElementPlus)
app.use(pinia)
app.mount('#app')