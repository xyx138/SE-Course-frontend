<template>
  <el-header class="app-header">
    <div class="header-content">
      <div class="logo">
        <router-link to="/">
          <h1>软件工程课程智能助手</h1>
        </router-link>
      </div>
      <div class="menu">
        <el-menu mode="horizontal" :ellipsis="false" :router="true" class="menu-items" background-color="transparent" text-color="#fff" active-text-color="#fff">
          <el-menu-item index="/dashboard" v-if="isLoggedIn">控制台</el-menu-item>
          <el-menu-item index="/question">习题解答</el-menu-item>
          <el-menu-item index="/uml">UML图生成</el-menu-item>
          <el-menu-item index="/explain">知识解析</el-menu-item>
          <el-menu-item index="/paper">论文工具</el-menu-item>
          <el-menu-item index="/test">测试工具</el-menu-item>
          <el-menu-item index="/knowledge">知识库管理</el-menu-item>
        </el-menu>
      </div>
      <div class="user-actions">
        <template v-if="isLoggedIn">
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="32" :src="userAvatar">{{ username.charAt(0) }}</el-avatar>
              <span class="username">{{ username }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToProfile">个人资料</el-dropdown-item>
                <!-- <el-dropdown-item @click="goToConversations">历史会话</el-dropdown-item> -->
                <el-dropdown-item @click="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button type="primary" plain @click="goToLogin">登录</el-button>
          <el-button @click="goToRegister">注册</el-button>
        </template>
      </div>
    </div>
  </el-header>
</template>

<script>
import { computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'AppHeader',
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    const isLoggedIn = computed(() => {
      return store.getters.isLoggedIn
    })
    
    watch(
      () => route.path,
      () => {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        if (token && !store.getters.isLoggedIn) {
          store.commit('SET_TOKEN', token)
          if (userStr) {
            try {
              const user = JSON.parse(userStr)
              store.commit('SET_USER', user)
            } catch (e) {
              console.error('解析用户信息失败', e)
            }
          }
        }
      }
    )

    const username = computed(() => store.state.user.username || '')
    const userAvatar = computed(() => store.state.user.avatar || '')

    const goToLogin = () => {
      router.push('/login')
    }

    const goToRegister = () => {
      router.push('/register')
    }

    const goToProfile = () => {
      router.push('/profile')
    }

    const goToConversations = () => {
      router.push('/conversations')
    }

    const logout = async () => {
      await store.dispatch('logout')
      router.push('/login')
    }

    return {
      isLoggedIn,
      username,
      userAvatar,
      goToLogin,
      goToRegister,
      goToProfile,
      goToConversations,
      logout
    }
  }
}
</script>

<style scoped>
.app-header {
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
}

.header-content {
  width: 100%;
  max-width: 1600px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo a {
  text-decoration: none;
  color: white;
}

.logo h1 {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.menu {
  flex: 1;
  margin-left: 30px;
}

.menu-items {
  border-bottom: none;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.username {
  margin: 0 5px;
  font-weight: 500;
}

:deep(.el-menu--horizontal .el-menu-item) {
  height: 60px;
  line-height: 60px;
  color: white;
  border-bottom: none !important;
  font-weight: 500;
}

:deep(.el-menu--horizontal .el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.15);
  border-bottom: 3px solid white !important;
}

:deep(.el-menu--horizontal .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.15);
}

@media (min-width: 1600px) {
  .header-content {
    max-width: 90%;
  }
}

@media (max-width: 768px) {
  .logo h1 {
    font-size: 1.2rem;
  }
  
  .menu {
    margin-left: 10px;
  }
  
  :deep(.el-menu--horizontal .el-menu-item) {
    padding: 0 10px;
  }
}
</style> 