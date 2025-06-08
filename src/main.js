import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './assets/main.css'
import api from './api'
import axios from 'axios'

// 配置axios默认值
axios.defaults.baseURL = '/api'

// 从本地存储获取token，如果存在则设置到axios头部
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = token
}

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局API
app.config.globalProperties.$api = api

app.use(router)
app.use(store)
app.use(ElementPlus, { size: 'default', zIndex: 3000 })

app.mount('#app') 