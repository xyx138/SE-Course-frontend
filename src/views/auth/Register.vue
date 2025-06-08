<template>
  <div class="register-container">
    <div class="register-card">
      <div class="logo">
        <h2>软件工程课程智能助手</h2>
      </div>
      <h3 class="title">用户注册</h3>
      
      <el-form ref="formRef" :model="registerForm" :rules="rules" label-position="top" @submit.prevent="handleRegister">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" prefix-icon="Message" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        
        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" class="submit-btn">注册</el-button>
        </el-form-item>
      </el-form>
      
      <div class="links">
        <router-link to="/login">已有账号？立即登录</router-link>
        <router-link to="/">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const errorMessage = ref('')
    
    const registerForm = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    const validatePass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'))
      } else {
        if (registerForm.confirmPassword !== '') {
          formRef.value.validateField('confirmPassword')
        }
        callback()
      }
    }
    
    const validateConfirmPass = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== registerForm.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在3到20个字符之间', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
        { validator: validatePass, trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { validator: validateConfirmPass, trigger: 'blur' }
      ]
    }
    
    const handleRegister = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          errorMessage.value = ''
          
          try {
            // 构建注册数据，去除确认密码字段
            const userData = {
              username: registerForm.username,
              email: registerForm.email,
              password: registerForm.password
            }
            
            await api.auth.register(userData)
            
            ElMessage.success('注册成功，请登录')
            router.push('/login')
          } catch (error) {
            console.error('注册失败:', error)
            errorMessage.value = error.response && error.response.data.detail
              ? error.response.data.detail
              : '注册失败，请稍后重试'
          } finally {
            loading.value = false
          }
        }
      })
    }
    
    return {
      formRef,
      registerForm,
      rules,
      loading,
      errorMessage,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.register-card {
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