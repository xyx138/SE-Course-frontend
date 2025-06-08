<template>
  <div class="profile-container">
    <h1 class="page-title">个人资料</h1>
    
    <el-card class="profile-card" shadow="hover">
      <el-row :gutter="30">
        <el-col :span="8">
          <div class="avatar-section">
            <el-avatar :size="120" :src="userInfo.avatar" class="user-avatar">
              {{ userInfo.username.charAt(0).toUpperCase() }}
            </el-avatar>
            <h2 class="username">{{ userInfo.username }}</h2>
          </div>
        </el-col>
        
        <el-col :span="16">
          <div class="user-info-container">
            <div class="info-header">
              <h3>个人信息</h3>
            </div>
            
            <div class="info-item">
              <div class="info-label">
                <el-icon><User /></el-icon>
                <span>用户名</span>
              </div>
              <div class="info-value">{{ userInfo.username }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">
                <el-icon><Message /></el-icon>
                <span>邮箱</span>
              </div>
              <div class="info-value">{{ userInfo.email || '未设置' }}</div>
            </div>
            
            <div class="info-footer">
              <el-tag type="info" effect="plain">软件工程课程智能助手</el-tag>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
    
    <el-card class="password-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>修改密码</h3>
        </div>
      </template>
      
      <el-form 
        ref="passwordFormRef" 
        :model="passwordForm" 
        :rules="passwordRules" 
        label-width="100px"
        status-icon
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            show-password
            placeholder="请输入当前密码"
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitPasswordForm" 
            :loading="passwordLoading"
          >
            更新密码
          </el-button>
          <el-button @click="resetPasswordForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { reactive, ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { User, Message } from '@element-plus/icons-vue'
import api from '@/api'

export default {
  name: 'ProfileView',
  components: {
    User,
    Message
  },
  setup() {
    const store = useStore()
    const passwordFormRef = ref(null)
    const passwordLoading = ref(false)
    
    // 从store获取用户信息
    const userInfo = computed(() => store.state.user)
    
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    // 验证两次输入的密码是否一致
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    const passwordRules = {
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    }
    
    // 提交密码表单
    const submitPasswordForm = () => {
      if (passwordFormRef.value) {
        passwordFormRef.value.validate(async (valid) => {
          if (valid) {
            // 检查新密码是否与当前密码相同
            if (passwordForm.currentPassword === passwordForm.newPassword) {
              ElMessage.warning('新密码不能与当前密码相同')
              return
            }
            
            passwordLoading.value = true
            try {
              const response = await api.auth.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
              )
              
              if (response && response.status === 'success') {
                ElMessage.success('密码修改成功')
                resetPasswordForm()
              } else {
                ElMessage.error(response?.message || '密码修改失败')
              }
            } catch (error) {
              console.error('修改密码时出错:', error)
              // 根据错误状态码提供更具体的错误信息
              if (error.response) {
                const status = error.response.status
                const detail = error.response.data?.detail
                
                if (status === 400) {
                  ElMessage.error(detail || '参数错误')
                } else if (status === 401) {
                  ElMessage.error(detail || '当前密码不正确')
                } else {
                  ElMessage.error(detail || '密码修改失败，请稍后重试')
                }
              } else {
                ElMessage.error('网络错误，请检查网络连接')
              }
            } finally {
              passwordLoading.value = false
            }
          }
        })
      }
    }
    
    // 重置密码表单
    const resetPasswordForm = () => {
      if (passwordFormRef.value) {
        passwordFormRef.value.resetFields()
      }
    }
    
    return {
      userInfo,
      passwordFormRef,
      passwordRules,
      passwordForm,
      passwordLoading,
      submitPasswordForm,
      resetPasswordForm
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  font-size: 1.8rem;
  color: var(--text-color);
}

.profile-card, .password-card {
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

.user-avatar {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border: 4px solid #fff;
}

.username {
  margin-top: 15px;
  font-size: 1.5rem;
  color: #303133;
  text-align: center;
}

.user-info-container {
  height: 100%;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.info-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.info-header h3 {
  font-size: 1.3rem;
  color: #303133;
  margin: 0;
}

.info-item {
  display: flex;
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.info-item:hover {
  background-color: #f0f2f5;
  transform: translateX(5px);
}

.info-label {
  width: 120px;
  font-weight: 600;
  color: #606266;
  display: flex;
  align-items: center;
}

.info-label .el-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #409EFF;
}

.info-value {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.info-footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 1.2rem;
  margin: 0;
  color: var(--text-color);
}
</style> 