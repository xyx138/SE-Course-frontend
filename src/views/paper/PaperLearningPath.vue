<template>
  <div class="learning-path-container">
    <div class="path-header">
      <h1 class="page-title">学习路径推荐</h1>
      <el-button @click="navigateTo('/paper')" plain>
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>
    
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <h3>研究主题</h3>
        </div>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="主题" prop="topic">
          <el-input 
            v-model="form.topic" 
            placeholder="输入您感兴趣的研究主题，如：软件测试自动化、微服务架构等"
            clearable
          >
            <template #append>
              <el-button @click="generatePath" :loading="loading" type="primary">
                <el-icon><Compass /></el-icon> 生成路径
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      
      <div class="popular-topics">
        <h4>热门研究主题</h4>
        <div class="topics-wrapper">
          <el-tag
            v-for="(topic, index) in popularTopics"
            :key="index"
            class="topic-tag"
            @click="useTopic(topic)"
          >
            {{ topic }}
          </el-tag>
        </div>
      </div>
    </el-card>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="15" animated />
    </div>
    
    <!-- 学习路径结果 -->
    <el-card v-else-if="pathResult" class="result-card">
      <template #header>
        <div class="card-header">
          <h3>{{ form.topic }} 学习路径</h3>
          <div class="header-actions">
            <el-button size="small" @click="exportPath">
              <el-icon><Download /></el-icon> 导出路径
            </el-button>
            <el-button size="small" @click="copyPath">
              <el-icon><DocumentCopy /></el-icon> 复制
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 使用 v-html 和 marked 渲染 Markdown -->
      <div class="path-content" v-html="formattedPath"></div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Compass, Back, Download, DocumentCopy } from '@element-plus/icons-vue'
import api from '@/api'
import * as marked from 'marked'

export default {
  name: 'PaperLearningPath',
  components: {
    Compass,
    Back,
    Download,
    DocumentCopy
  },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const pathResult = ref(null)
    
    // 表单数据
    const form = reactive({
      topic: ''
    })
    
    // 表单验证规则
    const rules = {
      topic: [
        { required: true, message: '请输入研究主题', trigger: 'blur' },
        { min: 2, message: '主题至少需要2个字符', trigger: 'blur' }
      ]
    }
    
    // 热门研究主题
    const popularTopics = [
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
    ]
    
    // 导航到指定路由
    const navigateTo = (route) => {
      router.push(route)
    }
    
    // 使用预设主题
    const useTopic = (topic) => {
      form.topic = topic
      generatePath()
    }
    
    // 生成学习路径
    const generatePath = async () => {
      // 表单验证
      try {
        if (formRef.value) {
          await formRef.value.validate()
        }
      } catch (error) {
        return
      }
      
      loading.value = true
      
      try {
        // 准备表单数据
        const formData = new FormData()
        formData.append('topic', form.topic)
        
        // 调用后端API
        const response = await api.paper.recommendLearningPath(formData)
        
        if (response && response.status === 'success') {
          pathResult.value = response.message
          ElMessage.success('学习路径生成成功')
        } else {
          ElMessage.error(response?.message || '生成学习路径失败，请稍后重试')
        }
      } catch (error) {
        console.error('生成学习路径出错:', error)
        ElMessage.error('生成学习路径失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }
    
    // 导出学习路径
    const exportPath = () => {
      if (!pathResult.value) {
        ElMessage.warning('没有可导出的学习路径')
        return
      }
      
      // 创建一个Blob对象
      const blob = new Blob([pathResult.value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      // 创建一个临时链接并触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = `${form.topic}_学习路径_${new Date().toISOString().slice(0, 10)}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      ElMessage.success('学习路径已导出')
    }
    
    // 复制学习路径
    const copyPath = () => {
      if (!pathResult.value) {
        ElMessage.warning('没有可复制的学习路径')
        return
      }
      
      navigator.clipboard.writeText(pathResult.value)
        .then(() => {
          ElMessage.success('已复制到剪贴板')
        })
        .catch(() => {
          ElMessage.error('复制失败，请手动复制')
        })
    }
    
    // 格式化学习路径为HTML
    const formattedPath = computed(() => {
      if (!pathResult.value) return ''
      try {
        return marked.parse(pathResult.value)
      } catch (error) {
        console.error('Markdown 渲染错误:', error)
        return `<pre>${pathResult.value}</pre>` // 如果渲染失败，则以纯文本显示
      }
    })
    
    return {
      formRef,
      form,
      rules,
      loading,
      pathResult,
      formattedPath,
      popularTopics,
      navigateTo,
      useTopic,
      generatePath,
      exportPath,
      copyPath
    }
  }
}
</script>

<style scoped>
.learning-path-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.path-header {
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

.search-card {
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

.popular-topics {
  margin-top: 20px;
}

.popular-topics h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.topics-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.topic-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-container {
  margin-top: 20px;
}

.result-card {
  margin-top: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.path-content {
  line-height: 1.6;
}

.path-content :deep(h1),
.path-content :deep(h2),
.path-content :deep(h3) {
  margin-top: 20px;
  margin-bottom: 10px;
}

.path-content :deep(p) {
  margin-bottom: 15px;
}

.path-content :deep(ul),
.path-content :deep(ol) {
  margin-bottom: 15px;
  padding-left: 20px;
}

.path-content :deep(li) {
  margin-bottom: 5px;
}

.path-content :deep(code) {
  background-color: #f8f8f8;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.path-content :deep(pre) {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}
</style> 