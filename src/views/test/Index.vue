<template>
  <div class="test-container">
    <h1 class="page-title">测试工具</h1>
    

    <!-- 工具卡片 -->
    <el-row :gutter="20" class="mt-30">
      <el-col :span="8" v-for="(card, index) in toolCards" :key="index">
        <el-card class="tool-card" shadow="hover" @click="navigateTo(card.route)">
          <div class="card-content">
            <el-icon :size="48" class="card-icon">
              <component :is="card.icon"></component>
            </el-icon>
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-desc">{{ card.description }}</p>
            <el-button type="primary" class="card-btn">使用工具</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 测试资源卡片 -->
    <el-card class="resources-card mt-30">
      <template #header>
        <div class="card-header">
          <h3>测试资源与学习材料</h3>
        </div>
      </template>
      
      <div class="resources-content">
        <el-tabs>
          <el-tab-pane label="测试框架">
            <div class="resources-grid">
              <div class="resource-item" v-for="(framework, index) in testFrameworks" :key="index">
                <h4>{{ framework.language }}</h4>
                <ul>
                  <li v-for="(item, i) in framework.frameworks" :key="i">
                    <a :href="item.url" target="_blank">{{ item.name }}</a>
                    - {{ item.description }}
                  </li>
                </ul>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="推荐书籍">
            <div class="resources-grid">
              <div class="resource-item" v-for="(book, index) in recommendedBooks" :key="index">
                <h4>{{ book.title }}</h4>
                <p class="book-author">{{ book.author }}</p>
                <p class="book-desc">{{ book.description }}</p>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="在线教程">
            <div class="resources-list">
              <ul>
                <li v-for="(tutorial, index) in onlineTutorials" :key="index">
                  <a :href="tutorial.url" target="_blank">{{ tutorial.title }}</a>
                  - {{ tutorial.description }}
                </li>
              </ul>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  DocumentAdd, 
  DataAnalysis, 
  PieChart, 
  Stopwatch 
} from '@element-plus/icons-vue'

export default {
  name: 'TestIndexView',
  components: {
    DocumentAdd,
    DataAnalysis,
    PieChart,
    Stopwatch
  },
  setup() {
    const router = useRouter()
    
    const toolCards = [
      {
        title: '测试用例生成',
        icon: 'DocumentAdd',
        description: '根据代码自动生成单元测试、集成测试等各类测试用例',
        route: '/test/generator'
      },
      {
        title: '代码可测性分析',
        icon: 'DataAnalysis',
        description: '分析代码结构，提供可测性评分和改进建议',
        route: '/test/analysis'
      },
      {
        title: '测试覆盖率报告',
        icon: 'PieChart',
        description: '生成详细的测试覆盖率报告，识别未测试的代码区域',
        route: '/test/coverage'
      }
    ]
    
    // 测试框架资源
    const testFrameworks = [
      {
        language: 'Java',
        frameworks: [
          {
            name: 'JUnit',
            url: 'https://junit.org/',
            description: '最流行的Java测试框架'
          },
          {
            name: 'Mockito',
            url: 'https://site.mockito.org/',
            description: '强大的Java模拟框架'
          },
          {
            name: 'TestNG',
            url: 'https://testng.org/',
            description: '灵活的测试框架，支持数据驱动测试'
          }
        ]
      },
      {
        language: 'Python',
        frameworks: [
          {
            name: 'pytest',
            url: 'https://docs.pytest.org/',
            description: '简单而强大的Python测试框架'
          },
          {
            name: 'unittest',
            url: 'https://docs.python.org/3/library/unittest.html',
            description: 'Python标准库中的测试框架'
          },
          {
            name: 'nose2',
            url: 'https://docs.nose2.io/',
            description: 'unittest的扩展版本'
          }
        ]
      },
      {
        language: 'JavaScript',
        frameworks: [
          {
            name: 'Jest',
            url: 'https://jestjs.io/',
            description: 'Facebook出品的零配置测试平台'
          },
          {
            name: 'Mocha',
            url: 'https://mochajs.org/',
            description: '灵活的JavaScript测试框架'
          },
          {
            name: 'Cypress',
            url: 'https://www.cypress.io/',
            description: '现代化的前端测试工具'
          }
        ]
      }
    ]
    
    // 推荐书籍
    const recommendedBooks = [
      {
        title: '测试驱动开发',
        author: 'Kent Beck',
        description: '介绍了TDD的核心原则和实践，是测试领域的经典著作'
      },
      {
        title: 'Effective Unit Testing',
        author: 'Lasse Koskela',
        description: '讲解如何编写可维护、表达力强的单元测试'
      },
      {
        title: 'The Art of Software Testing',
        author: 'Glenford J. Myers',
        description: '软件测试的基础理论和方法学，测试领域的权威著作'
      },
      {
        title: 'xUnit Test Patterns',
        author: 'Gerard Meszaros',
        description: '深入讲解单元测试模式和重构测试代码的技巧'
      }
    ]
    
    // 在线教程
    const onlineTutorials = [
      {
        title: 'Test-Driven Development Tutorial',
        url: 'https://www.guru99.com/test-driven-development.html',
        description: '测试驱动开发的详细教程和实践指南'
      },
      {
        title: 'Google Testing Blog',
        url: 'https://testing.googleblog.com/',
        description: 'Google工程师分享的测试实践和经验'
      },
      {
        title: 'Software Testing Fundamentals',
        url: 'https://softwaretestingfundamentals.com/',
        description: '软件测试基础知识和术语解释'
      },
      {
        title: 'Ministry of Testing',
        url: 'https://www.ministryoftesting.com/',
        description: '测试专业人士社区，提供各种测试资源和教程'
      }
    ]
    
    const navigateTo = (route) => {
      router.push(route)
    }
    
    return {
      toolCards,
      testFrameworks,
      recommendedBooks,
      onlineTutorials,
      navigateTo
    }
  }
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 30px;
  font-size: 1.8rem;
  color: var(--el-color-primary);
  font-weight: 600;
  text-align: center;
}

.introduction-card {
  margin-bottom: 30px;
}

.introduction-content {
  padding: 10px;
}

.introduction-title {
  text-align: center;
  font-size: 1.6rem;
  color: var(--el-color-primary);
  margin-bottom: 20px;
}

.introduction-desc {
  font-size: 1.1rem;
  line-height: 1.6;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 20px;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 24px;
  color: var(--el-color-primary);
  margin-right: 15px;
  margin-top: 3px;
}

.feature-content h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.2rem;
  font-weight: 600;
}

.feature-content p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.mt-30 {
  margin-top: 30px;
}

.tool-card {
  height: 260px;
  border-radius: 8px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  height: 100%;
}

.card-icon {
  color: var(--el-color-primary);
  margin-bottom: 15px;
}

.card-title {
  font-size: 1.3rem;
  margin-bottom: 10px;
}

.card-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 15px;
  flex-grow: 1;
}

.card-btn {
  margin-top: auto;
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

.resources-content {
  padding: 10px;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.resource-item {
  background-color: var(--el-fill-color-light);
  padding: 15px;
  border-radius: 8px;
}

.resource-item h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--el-color-primary);
  font-weight: 600;
}

.resource-item ul {
  padding-left: 20px;
  margin: 0;
}

.resource-item li {
  margin-bottom: 8px;
}

.book-author {
  font-style: italic;
  margin: 5px 0;
  color: var(--el-text-color-secondary);
}

.book-desc {
  margin: 5px 0 0;
}

.resources-list ul {
  padding-left: 20px;
}

.resources-list li {
  margin-bottom: 10px;
}
</style> 