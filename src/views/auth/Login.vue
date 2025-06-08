<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo">
        <h2>软件工程课程智能助手</h2>
      </div>
      <h3 class="title">用户登录</h3>
      
      <el-form ref="formRef" :model="loginForm" :rules="rules" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        
        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" class="submit-btn">登录</el-button>
        </el-form-item>
      </el-form>
      
      <div class="links">
        <router-link to="/register">没有账号？立即注册</router-link>
        <router-link to="/">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

export default {
  name: 'LoginView',
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const formRef = ref(null)
    const loading = ref(false)
    const errorMessage = ref('')
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          errorMessage.value = ''
          
          try {
            const response = await api.auth.login(loginForm.username, loginForm.password)
            const { access_token, token_type, user_id, username, is_admin } = response.data
            
            // 存储令牌和用户信息
            const token = `${token_type} ${access_token}`
            const user = { id: user_id, username, is_admin }
            
            // 保存到本地存储
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            
            // 设置axios默认头部
            api.defaults && (api.defaults.headers.common['Authorization'] = token)
            
            // 更新Vuex状态
            store.commit('SET_TOKEN', token)
            store.commit('SET_USER', user)
            
            ElMessage.success('登录成功')
            
            // 如果有重定向路径，则跳转到该路径，否则跳转到首页
            const redirectPath = route.query.redirect || '/'
            router.push(redirectPath)
          } catch (error) {
            console.error('登录失败:', error)
            errorMessage.value = error.response && error.response.data.detail
              ? error.response.data.detail
              : '登录失败，请检查用户名和密码'
          } finally {
            loading.value = false
          }
        }
      })
    }
    
    return {
      formRef,
      loginForm,
      rules,
      loading,
      errorMessage,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.logo {
  text-align: center;
  margin-bottom: 20px;
}

.logo h2 {
  color: var(--primary-color);
  font-size: 1.8rem;
}

.title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.5rem;
  color: var(--text-color);
}

.submit-btn {
  width: 100%;
}

.error-message {
  color: var(--danger-color);
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.links {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.links a {
  color: var(--primary-color);
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}
</style> 