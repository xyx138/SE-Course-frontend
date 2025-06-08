<template>
  <div class="question-container">
    <h1 class="page-title">习题解答</h1>
    
    <el-row :gutter="20">
      <el-col :span="12" v-for="(card, index) in featureCards" :key="index">
        <el-card class="feature-card" shadow="hover" @click="navigateTo(card.route)">
          <div class="card-content">
            <el-icon :size="48" class="card-icon">
              <component :is="card.icon"></component>
            </el-icon>
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-desc">{{ card.description }}</p>
            <el-button type="primary" class="card-btn">进入</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card class="tips-card mt-20">
      <template #header>
        <div class="card-header">
          <h3>使用提示</h3>
        </div>
      </template>
      
      <div class="tips-content">
        <h4>如何更好地使用习题解答功能？</h4>
        <ul>
          <li>练习题生成：选择合适的知识点和难度，生成针对性练习题</li>
          <li>习题解析：提供清晰完整的题目描述，获取详细解答</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'QuestionIndexView',
  setup() {
    const router = useRouter()
    
    const featureCards = [
      {
        title: '练习题生成',
        icon: 'DocumentAdd',
        description: '根据知识点、难度等生成个性化的软件工程练习题',
        route: '/question/practice'
      },
      {
        title: '习题解析',
        icon: 'QuestionFilled',
        description: '输入软件工程习题，获取详细解答和分析',
        route: '/question/explain'
      }
    ]
    
    const navigateTo = (route) => {
      router.push(route)
    }
    
    return {
      featureCards,
      navigateTo
    }
  }
}
</script>

<style scoped>
.question-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  font-size: 1.8rem;
  color: var(--text-color);
}

.feature-card {
  height: 260px;
  border-radius: 8px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.card-icon {
  color: var(--primary-color);
  margin-bottom: 15px;
}

.card-title {
  font-size: 1.3rem;
  margin-bottom: 10px;
  color: var(--text-color);
}

.card-desc {
  color: var(--text-color-secondary);
  margin-bottom: 20px;
  flex-grow: 1;
}

.card-btn {
  width: 100%;
}

.tips-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.tips-content {
  color: var(--text-color-secondary);
}

.tips-content h4 {
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 15px;
}

.tips-content ul {
  padding-left: 20px;
  margin-bottom: 20px;
}

.tips-content li {
  margin-bottom: 8px;
}

.mt-20 {
  margin-top: 20px;
}
</style> 