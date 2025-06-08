<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="title">软件工程课程智能助手</h1>
      <p class="subtitle">提升您的软件工程学习体验</p>
      <div class="buttons">
        <el-button type="primary" size="large" @click="goToFeature">开始使用</el-button>
        <el-button size="large" @click="goToLogin" v-if="!isLoggedIn">登录</el-button>
      </div>
    </div>
    
    <div class="features-section">
      <h2 class="section-title">功能特点</h2>
      <div class="features-grid">
        <div 
          class="feature-card" 
          v-for="(feature, index) in features" 
          :key="index"
          :class="{ 'locked': !isLoggedIn }"
          @click="navigateToFeature(feature.route)"
        >
          <div class="feature-icon">
            <el-icon :size="50"><component :is="feature.icon"></component></el-icon>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.description }}</p>
          <div v-if="!isLoggedIn" class="lock-overlay">
            <el-icon :size="24"><Lock /></el-icon>
            <span>请先登录</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="how-it-works">
      <h2 class="section-title">如何使用</h2>
      <el-steps :active="1" simple>
        <el-step title="注册账号" description="创建您的个人账号"></el-step>
        <el-step title="选择功能" description="选择您需要的学习工具"></el-step>
        <el-step title="提交需求" description="输入您的问题或需求"></el-step>
        <el-step title="获取结果" description="获取智能助手的解答和帮助"></el-step>
      </el-steps>
    </div>
    
    <div class="footer">
      <p>软件工程课程智能助手 © {{ currentYear }}</p>
      <p>专为软件工程课程学生打造</p>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'

export default {
  name: 'HomeView',
  components: {
    Lock
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const currentYear = new Date().getFullYear()
    
    const isLoggedIn = computed(() => store.getters.isLoggedIn)
    
    const features = ref([
      {
        title: '习题解答',
        icon: 'Document',
        description: '提供软件工程课程习题解答，帮助您更好地理解和掌握知识点',
        route: '/question'
      },
      {
        title: 'UML图生成',
        icon: 'Connection',
        description: '根据描述自动生成各类UML图，帮助您更好地理解系统设计',
        route: '/uml'
      },
      {
        title: '知识解析',
        icon: 'Reading',
        description: '解析软件工程相关概念，提供详细说明和案例',
        route: '/explain'
      },
      {
        title: '论文工具',
        icon: 'Files',
        description: '帮助您搜索、分析论文，构建学习路径',
        route: '/paper'
      },
      {
        title: '测试工具',
        icon: 'Operation',
        description: '生成测试用例，分析代码可测试性，解析测试概念',
        route: '/test'
      },
      {
        title: '知识库管理',
        icon: 'Collection',
        description: '管理您的个人知识库，随时查阅和更新',
        route: '/knowledge'
      }
    ])
    
    const goToFeature = () => {
      if (isLoggedIn.value) {
        router.push('/dashboard')
      } else {
        ElMessage.info('请先登录以使用所有功能')
        router.push('/login')
      }
    }
    
    const navigateToFeature = (route) => {
      if (isLoggedIn.value) {
        router.push(route)
      } else {
        ElMessage.warning('请先登录后再使用此功能')
        router.push('/login')
      }
    }
    
    const goToLogin = () => {
      router.push('/login')
    }
    
    return {
      features,
      currentYear,
      isLoggedIn,
      goToFeature,
      goToLogin,
      navigateToFeature
    }
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  padding: 60px 20px;
  background-color: #f0f9ff;
  border-radius: 8px;
  margin-bottom: 40px;
}

.title {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 20px;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin-bottom: 30px;
}

.buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.section-title {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 40px;
  color: var(--text-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.feature-card {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: var(--shadow);
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.feature-card.locked {
  opacity: 0.8;
}

.feature-icon {
  color: var(--primary-color);
  margin-bottom: 20px;
}

.feature-title {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: var(--text-color);
}

.feature-desc {
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--primary-color);
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s;
}

.feature-card.locked:hover .lock-overlay {
  opacity: 1;
}

.lock-overlay .el-icon {
  margin-bottom: 10px;
}

.how-it-works {
  margin-bottom: 60px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.footer {
  text-align: center;
  padding: 30px 0;
  color: var(--text-color-secondary);
  border-top: 1px solid var(--border-color);
  margin-top: 40px;
}
</style> 