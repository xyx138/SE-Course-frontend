<template>
  <div class="paper-search-container">
    <div class="search-header">
      <h1 class="page-title">论文搜索</h1>
      <el-button @click="navigateTo('/paper')" plain>
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>
    
    <el-card class="search-form-card">
      <template #header>
        <div class="card-header">
          <h3>搜索条件</h3>
        </div>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="关键词" prop="keywords">
          <el-input 
            v-model="form.keywords" 
            placeholder="输入研究主题或关键词" 
            clearable
            @keyup.enter="searchPapers"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="最大结果数">
          <el-select v-model="form.maxResults" placeholder="选择最大结果数">
            <el-option label="1篇" :value="1"></el-option>
            <el-option label="3篇" :value="3"></el-option>
            <el-option label="5篇" :value="5"></el-option>
            <el-option label="10篇" :value="10"></el-option>
            <el-option label="20篇" :value="20"></el-option>
            <el-option label="50篇" :value="50"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="searchPapers" :loading="loading">
            <el-icon><Search /></el-icon> 搜索论文
          </el-button>
          <el-button @click="resetForm">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 热门研究主题 -->
      <div class="hot-topics">
        <h4>热门研究主题</h4>
        <div class="topics-list">
          <el-tag 
            v-for="(topic, index) in hotTopics" 
            :key="index" 
            @click="useSearchTopic(topic)"
            class="topic-tag"
            effect="plain"
          >
            {{ topic }}
          </el-tag>
        </div>
      </div>
    </el-card>
    
    <!-- 搜索结果 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <el-card v-else-if="searchResults.length > 0" class="results-card">
      <template #header>
        <div class="card-header">
          <h3>搜索结果 ({{ searchResults.length }})</h3>
          <div class="header-actions">
            <el-radio-group v-model="viewMode" size="small" class="mr-10">
              <el-radio-button label="list">列表视图</el-radio-button>
              <el-radio-button label="card">卡片视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="results-list">
        <el-collapse accordion>
          <el-collapse-item v-for="(paper, index) in searchResults" :key="index" :name="index">
            <template #title>
              <div class="paper-title">
                <span class="paper-index">{{ index + 1 }}.</span>
                《 {{ paper.title }} 》
                <el-tag v-if="paper.citations" size="small" type="info" class="citation-tag">
                  引用: {{ paper.citations }}
                </el-tag>
              </div>
            </template>
            
            <div class="paper-details">
              <div class="paper-authors">
                <strong>作者：</strong> {{ Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors }}
              </div>
              
              <div class="paper-year">
                <strong>发表年份：</strong> {{ paper.year }}
              </div>
              
              <div class="paper-abstract">
                <strong>摘要：</strong> {{ paper.abstract }}
              </div>
              
              <div class="paper-actions">
                <el-button type="primary" size="small" @click="viewPaperDetails(paper)">
                  查看详情
                </el-button>
                <el-button size="small" @click="savePaper(paper)" :type="isPaperFavorited(paper) ? 'danger' : 'success'">
                  {{ isPaperFavorited(paper) ? '取消收藏' : '收藏' }}
                </el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
      
      <!-- 卡片视图 -->
      <div v-else class="results-grid">
        <el-row :gutter="20">
          <el-col :sm="24" :md="12" :lg="8" v-for="(paper, index) in searchResults" :key="index">
            <el-card class="paper-card" shadow="hover">
              <div class="paper-card-header">
                <div class="paper-card-title">{{ paper.title }}</div>
              </div>
              
              <div class="paper-card-content">
                <div class="paper-card-authors">
                  <strong>作者：</strong> {{ Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors }}
                </div>
                
                <div class="paper-card-year">
                  <strong>年份：</strong> {{ paper.year }}
                </div>
                
                <div class="paper-card-abstract">
                  {{ paper.abstract.length > 150 ? paper.abstract.substring(0, 150) + '...' : paper.abstract }}
                </div>
                
                <div class="paper-card-stats">
                  <el-tag size="small">引用量: {{ paper.citations || 0 }}</el-tag>
                </div>
              </div>
              
              <div class="paper-card-actions">
                <el-button type="primary" size="small" @click="viewPaperDetails(paper)">
                  详情
                </el-button>
                <el-button size="small" :type="isPaperFavorited(paper) ? 'danger' : 'success'" @click="savePaper(paper)">
                  {{ isPaperFavorited(paper) ? '取消收藏' : '收藏' }}
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <el-empty v-else-if="hasSearched" description="未找到相关论文，请尝试其他关键词"></el-empty>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { Search, Back, Refresh, Download, Star } from '@element-plus/icons-vue'
import api from '@/api'

export default {
  name: 'PaperSearch',
  components: {
    Search,
    Back,
    Refresh,
    Download,
    Star
  },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const hasSearched = ref(false)
    const searchResults = ref([])
    const viewMode = ref('list')
    const favoritePapers = ref([])
    
    // 热门研究主题
    const hotTopics = [
      '软件测试自动化',
      '需求工程方法',
      '软件架构评估',
      '敏捷开发实践',
      '代码质量度量',
      '形式化验证',
      '软件安全漏洞分析'
    ]
    
    // 搜索表单
    const form = reactive({
      keywords: '',
      maxResults: 10
    })
    
    // 表单验证规则
    const rules = {
      keywords: [
        { required: true, message: '请输入搜索关键词', trigger: 'blur' }
      ]
    }
    
    // 导航到指定路由
    const navigateTo = (route) => {
      router.push(route)
    }
    
    // 使用热门研究主题作为搜索关键词
    const useSearchTopic = (topic) => {
      form.keywords = topic
      searchPapers()
    }
    
    // 从localStorage加载收藏的论文
    const loadFavoritePapers = () => {
      try {
        const savedPapers = localStorage.getItem('favoritePapers')
        if (savedPapers) {
          favoritePapers.value = JSON.parse(savedPapers)
        }
      } catch (error) {
        console.error('加载收藏论文出错:', error)
        favoritePapers.value = []
      }
    }
    
    // 保存收藏的论文到localStorage
    const saveFavoritePapersToStorage = () => {
      try {
        localStorage.setItem('favoritePapers', JSON.stringify(favoritePapers.value))
      } catch (error) {
        console.error('保存收藏论文出错:', error)
        ElMessage.error('保存收藏失败，请稍后重试')
      }
    }
    
    // 检查论文是否已收藏
    const isPaperFavorited = (paper) => {
      return favoritePapers.value.some(p => p.title === paper.title)
    }
    
    // 收藏/取消收藏论文
    const savePaper = (paper) => {
      if (isPaperFavorited(paper)) {
        // 如果已收藏，则取消收藏
        const index = favoritePapers.value.findIndex(p => p.title === paper.title)
        favoritePapers.value.splice(index, 1)
        saveFavoritePapersToStorage()
        ElMessage.info(`已取消收藏：${paper.title}`)
      } else {
        // 如果未收藏，则添加到收藏
        favoritePapers.value.push({
          ...paper,
          savedAt: new Date().toISOString()
        })
        saveFavoritePapersToStorage()
        ElMessage.success(`已收藏论文：${paper.title}`)
      }
    }
    
    // 生成论文ID
    const generatePaperId = (title, authorStr) => {
      // 简单的哈希函数，将标题和作者组合生成ID
      const str = `${title}${authorStr}`
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return `paper_${Math.abs(hash).toString(16)}`
    }
    
    // 搜索论文
    const searchPapers = async () => {
      if (!form.keywords.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
      }
      
      // 表单验证
      try {
        if (formRef.value) {
          await formRef.value.validate()
        }
      } catch (error) {
        return
      }
      
      loading.value = true
      hasSearched.value = true
      searchResults.value = []
      
      try {
        // 准备表单数据
        const formData = new FormData()
        formData.append('topic', form.keywords)
        formData.append('max_results', form.maxResults)
        
        // 调用后端API
        const response = await api.paper.search(formData)
        
        if (response.status === 'success') {
          // 处理API返回的数据
          let papersData = JSON.parse(response.message)

          if (papersData && papersData.papers) {
            const papers = papersData.papers
            
            // 转换数据格式并添加到搜索结果中
            searchResults.value = papers.map(paper => {
              // 生成唯一ID
              const id = generatePaperId(paper.title, paper.authors)
              
              return {
                id,
                title: paper.title,
                authors: Array.isArray(paper.authors) ? paper.authors : [paper.authors],
                year: paper.year,
                abstract: paper.abstract,
                citations: paper.citations,
                url: paper.url,
                selected: false
              }
            })
            
            if (searchResults.value.length === 0) {
              ElMessage.info('未找到相关论文，请尝试其他关键词')
            } else {
              ElMessage.success(`找到 ${searchResults.value.length} 篇相关论文`)
            }
          } else {
            ElMessage.warning('搜索结果格式不正确')
          }
        } else {
          ElMessage.error(response.data?.message || '搜索论文失败，请稍后重试')
        }
      } catch (error) {
        console.error('搜索论文出错:', error)
        ElMessage.error('搜索论文失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }
    
    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      form.maxResults = 10
    }
    
    // 查看论文详情
    const viewPaperDetails = (paper) => {
      if (!paper.url) {
        ElMessage.warning('该论文没有可用的下载链接')
        return
      }
      
      window.open(paper.url, '_blank')
    }
    

    
    // 组件挂载时加载收藏的论文
    onMounted(() => {
      loadFavoritePapers()
    })
    
    return {
      formRef,
      form,
      rules,
      loading,
      hasSearched,
      searchResults,
      viewMode,
      hotTopics,
      navigateTo,
      useSearchTopic,
      searchPapers,
      resetForm,
      isPaperFavorited,
      savePaper,
      viewPaperDetails,
    }
  }
}
</script>

<style scoped>
.paper-search-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  color: var(--el-color-primary);
  font-weight: 600;
}

.search-form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.hot-topics {
  margin-top: 20px;
}

.hot-topics h4 {
  font-size: 16px;
  margin-bottom: 10px;
}

.topics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.topic-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.topic-tag:hover {
  background-color: var(--el-color-primary-light-8);
  transform: scale(1.05);
}

.loading-container {
  margin-top: 20px;
}

.results-card {
  margin-top: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.mr-10 {
  margin-right: 10px;
}

.paper-title {
  display: flex;
  align-items: center;
}

.paper-index {
  margin-right: 8px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.citation-tag {
  margin-left: 10px;
}

.paper-details {
  padding: 10px;
}

.paper-authors, .paper-year {
  margin-bottom: 10px;
}

.paper-abstract {
  margin-bottom: 15px;
  line-height: 1.6;
}

.paper-actions {
  margin-top: 15px;
}

.results-grid {
  margin-top: 20px;
}

.paper-card {
  margin-bottom: 20px;
  height: 100%;
}

.paper-card-header {
  margin-bottom: 15px;
}

.paper-card-title {
  font-weight: bold;
  font-size: 16px;
  line-height: 1.4;
}

.paper-card-content {
  margin-bottom: 15px;
}

.paper-card-authors, .paper-card-year {
  margin-bottom: 8px;
  font-size: 14px;
}

.paper-card-abstract {
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.paper-card-stats {
  margin-bottom: 10px;
}

.paper-card-actions {
  display: flex;
  justify-content: space-between;
}
</style> 