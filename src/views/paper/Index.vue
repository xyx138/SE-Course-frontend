<template>
  <div class="paper-container">
    <h1 class="page-title">论文工具</h1>
    
    <el-row :gutter="30">
      <!-- 论文搜索卡片 -->
      <el-col :span="8">
        <el-card class="tool-card" shadow="hover">
          <div class="card-content">
            <el-icon :size="64" class="card-icon">
              <Search />
            </el-icon>
            <h2 class="card-title">论文搜索</h2>
            <p class="card-desc">
              通过关键词搜索软件工程相关的学术论文，支持多种筛选条件和排序方式。
              快速找到与您研究方向相关的高质量论文。
            </p>
            <div class="card-feature-list">
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>关键词精准搜索</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>多种筛选条件</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>列表/卡片视图</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>一键收藏与导出</span>
              </div>
            </div>
            <el-button type="primary" size="large" class="card-button" @click="navigateTo('/paper/search')">
              开始搜索
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <!-- 论文应用价值分析卡片 -->
      <el-col :span="8">
        <el-card class="tool-card" shadow="hover">
          <div class="card-content">
            <el-icon :size="64" class="card-icon">
              <DataAnalysis />
            </el-icon>
            <h2 class="card-title">论文应用价值分析</h2>
            <p class="card-desc">
              分析论文对特定项目的应用价值，提取关键方法和技术，生成实施建议。
              帮助您将学术研究转化为实际项目中的解决方案。
            </p>
            <div class="card-feature-list">
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>关键技术提取</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>应用价值评估</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>实施方案生成</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>可行性分析</span>
              </div>
            </div>
            <el-button type="success" size="large" class="card-button" @click="navigateTo('/paper/analyze')">
              开始分析
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <!-- 新增：学习路径推荐卡片 -->
      <el-col :span="8">
        <el-card class="tool-card" shadow="hover">
          <div class="card-content">
            <el-icon :size="64" class="card-icon">
              <Compass />
            </el-icon>
            <h2 class="card-title">学习路径推荐</h2>
            <p class="card-desc">
              针对特定研究主题生成系统化学习路径，从入门到高级，精选关键论文和学习资源。
              助您快速掌握新领域知识体系。
            </p>
            <div class="card-feature-list">
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>渐进式学习路线</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>经典论文推荐</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>理论与实践结合</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>推荐阅读顺序</span>
              </div>
            </div>
            <el-button type="warning" size="large" class="card-button" @click="navigateTo('/paper/learning-path')">
              生成路径
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 使用指南 -->
    <el-card class="guide-card mt-30">
      <template #header>
        <div class="card-header">
          <h3>论文工具使用指南</h3>
        </div>
      </template>
      
      <div class="guide-content">
        <el-steps :active="1" finish-status="success" simple>
          <el-step title="搜索论文" description="输入关键词搜索相关论文"></el-step>
          <el-step title="筛选结果" description="根据年份、引用量等筛选"></el-step>
          <el-step title="分析价值" description="分析论文对项目的应用价值"></el-step>
          <el-step title="学习路径" description="生成学习路径"></el-step>
        </el-steps>
        
        <div class="guide-tips mt-20">
          <h4><el-icon><InfoFilled /></el-icon> 使用小技巧</h4>
          <ul>
            <li>使用引号包围精确短语，如 <code>"软件架构评估"</code></li>
            <li>5-10篇搜索结果最佳</li>
            <li>尽可能详细描述您的学习需求</li>
          </ul>
        </div>
      </div>
    </el-card>
    
  </div>
</template>

<script>
import { ref } from 'vue'
import { Search, DataAnalysis, Check, InfoFilled, Compass } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

export default {
  name: 'PaperIndexView',
  components: {
    Search,
    DataAnalysis,
    Check,
    InfoFilled,
    Compass
  },
  setup() {
    const router = useRouter()
    
    // 热门研究主题
    const hotTopics = ref([
      '软件测试自动化',
      '需求工程方法',
      '软件架构评估',
      '敏捷开发实践',
      '代码质量度量',
      '形式化验证',
      '软件安全漏洞分析',
      '微服务架构',
      'DevOps实践',
      '人工智能辅助软件开发'
    ])
    
    // 导航到指定路由
    const navigateTo = (route) => {
      router.push(route)
    }
    
    return {
      hotTopics,
      navigateTo
    }
  }
}
</script>

<style scoped>
.paper-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 30px;
  color: var(--el-color-primary);
  font-weight: 600;
  text-align: center;
  font-size: 32px;
}

.tool-card {
  height: 450px;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.card-icon {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 50%;
  background-color: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
}

.card-title {
  font-size: 24px;
  margin-bottom: 15px;
  font-weight: 600;
}

.card-desc {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.card-feature-list {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 25px;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.feature-item .el-icon {
  color: var(--el-color-success);
  margin-right: 8px;
}

.card-button {
  width: 80%;
  padding: 12px;
  font-size: 16px;
}

.mt-20 {
  margin-top: 20px;
}

.mt-30 {
  margin-top: 30px;
}

.guide-card, .topics-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.guide-tips {
  background-color: rgba(var(--el-color-info-rgb), 0.1);
  padding: 15px;
  border-radius: 8px;
}

.guide-tips h4 {
  display: flex;
  align-items: center;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: var(--el-color-info-dark-2);
}

.guide-tips h4 .el-icon {
  margin-right: 8px;
}

.guide-tips ul {
  margin: 0;
  padding-left: 20px;
}

.guide-tips li {
  margin-bottom: 8px;
}

.guide-tips code {
  background-color: #f0f0f0;
  padding: 2px 5px;
  border-radius: 4px;
  font-family: monospace;
}

.topics-content {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.topic-tag {
  cursor: pointer;
  font-size: 14px;
  padding: 8px 15px;
  transition: all 0.3s;
}

.topic-tag:hover {
  transform: scale(1.05);
  background-color: var(--el-color-primary-light-7);
}
</style> 