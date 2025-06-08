<template>
  <div class="paper-analyze-container">
    <div class="analyze-header">
      <h1 class="page-title">论文应用价值分析</h1>
      <el-button @click="navigateTo('/paper')" plain>
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>
    
    <el-card class="analyze-form-card">
      <template #header>
        <div class="card-header">
          <h3>分析设置</h3>
        </div>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="DOI" prop="doi">
          <el-input 
            v-model="form.doi" 
            placeholder="输入论文DOI"
            clearable
          >
            <template #append>
              <el-button @click="selectFromSearch">从搜索选择</el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="项目描述" prop="projectDescription">
          <el-input 
            v-model="form.projectDescription" 
            type="textarea"
            :rows="4"
            placeholder="详细描述您的项目需求、目标和技术背景，以便更准确地分析论文的应用价值"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="analyzePaper" :loading="loading">
            <el-icon><DataAnalysis /></el-icon> 开始分析
          </el-button>
          <el-button @click="resetForm">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="analyze-tips">
        <h4><el-icon><InfoFilled /></el-icon> 提示</h4>
        <ul>
          <li>输入论文DOI(或者通过选择搜索结果)</li>
          <li>项目描述越详细，分析结果越准确</li>
          <li>建议包含项目的技术栈、面临的挑战和期望解决的问题</li>
          <li>分析结果将包含论文的核心方法、应用价值和实施建议</li>
        </ul>
      </div>
    </el-card>
    
    <!-- 分析结果 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="15" animated />
    </div>
    
    <el-card v-else-if="analysisResult" class="result-card">
      <template #header>
        <div class="card-header">
          <h3>分析结果</h3>
          <div class="header-actions">
            <el-button size="small" @click="exportResult">
              <el-icon><Download /></el-icon> 导出分析
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="analysis-content" v-html="formattedResult"></div>
    </el-card>
    
    <!-- 论文选择对话框 -->
    <el-dialog
      v-model="paperSelectDialogVisible"
      title="选择论文"
      width="70%"
    >
      <el-input
        v-model="searchKeyword"
        placeholder="搜索论文关键词"
        clearable
        @keyup.enter="searchPapers"
      >
        <template #append>
          <el-button @click="searchPapers" :loading="searchLoading">搜索</el-button>
        </template>
      </el-input>
      
      <div v-if="searchLoading" class="dialog-loading">
        <el-skeleton :rows="5" animated />
      </div>
      
      <el-table
        v-else-if="searchResults.length > 0"
        :data="searchResults"
        style="width: 100%; margin-top: 20px;"
        @row-click="selectPaper"
        highlight-current-row
      >
        <el-table-column prop="title" label="论文标题" min-width="250"></el-table-column>
        <el-table-column prop="authors" label="作者" width="200">
          <template #default="scope">
            {{ Array.isArray(scope.row.authors) ? scope.row.authors.join(', ') : scope.row.authors }}
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年份" width="80"></el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" type="primary" @click.stop="selectPaper(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else-if="hasSearched" description="未找到相关论文，请尝试其他关键词"></el-empty>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="paperSelectDialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { DataAnalysis, Back, Refresh, InfoFilled, Download } from '@element-plus/icons-vue'
import api from '@/api'
import * as marked from 'marked'

export default {
  name: 'PaperAnalyze',
  components: {
    DataAnalysis,
    Back,
    Refresh,
    InfoFilled,
    Download
  },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const analysisResult = ref(null)
    const paperSelectDialogVisible = ref(false)
    const searchKeyword = ref('')
    const searchLoading = ref(false)
    const searchResults = ref([])
    const hasSearched = ref(false)
    
    // 分析表单
    const form = reactive({
      doi: '',
      projectDescription: ''
    })
    
    // 表单验证规则
    const rules = {
      doi: [
        { required: true, message: '请输入论文DOI', trigger: 'blur' }
      ],
      projectDescription: [
        { required: true, message: '请输入项目描述', trigger: 'blur' },
        { min: 20, message: '项目描述至少需要20个字符', trigger: 'blur' }
      ]
    }
    
    // 导航到指定路由
    const navigateTo = (route) => {
      router.push(route)
    }
    
    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      analysisResult.value = null
    }
    
    // 打开论文选择对话框
    const selectFromSearch = () => {
      paperSelectDialogVisible.value = true
      searchKeyword.value = ''
      searchResults.value = []
      hasSearched.value = false
    }
    
    // 搜索论文
    const searchPapers = async () => {
      if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
      }
      
      searchLoading.value = true
      hasSearched.value = true
      searchResults.value = []
      
      try {
        // 准备表单数据
        const formData = new FormData()
        formData.append('topic', searchKeyword.value)
        formData.append('max_results', 5)
        
        // 调用后端API
        const response = await api.paper.search(formData)
        
        if (response.status == 'success') {
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
                // 过滤掉类似v1的后缀
                doi: paper.doi
              }
            })
            
            if (searchResults.value.length === 0) {
              ElMessage.info('未找到相关论文，请尝试其他关键词')
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
        searchLoading.value = false
      }
    }
    
    // 选择论文
    const selectPaper = (paper) => {
      form.doi = paper.doi
      paperSelectDialogVisible.value = false
      ElMessage.success(`已选择论文: ${paper.title}`)
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
    
    // 分析论文
    const analyzePaper = async () => {
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
        formData.append('paper_id', form.doi)
        formData.append('project_description', form.projectDescription)
        
        // 调用后端API
        const response = await api.paper.analyzePaper(formData)
        
        if (response.status == 'success') {
          analysisResult.value = response.message
          ElMessage.success('论文分析完成')
        } else {
          ElMessage.error(response.data?.message || '论文分析失败，请稍后重试')
        }
      } catch (error) {
        console.error('分析论文出错:', error)
        ElMessage.error('分析论文失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }
    
    // 导出分析结果
    const exportResult = () => {
      if (!analysisResult.value) {
        ElMessage.warning('没有可导出的分析结果')
        return
      }
      
      // 创建一个Blob对象
      const blob = new Blob([analysisResult.value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      // 创建一个临时链接并触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = `论文分析_${new Date().toISOString().slice(0, 10)}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      ElMessage.success('分析结果已导出')
    }
    
    // 格式化分析结果为HTML (使用marked)
    const formattedResult = computed(() => {
      if (!analysisResult.value) return ''
      return marked.parse(analysisResult.value)
    })
    
    return {
      formRef,
      form,
      rules,
      loading,
      analysisResult,
      paperSelectDialogVisible,
      searchKeyword,
      searchLoading,
      searchResults,
      hasSearched,
      formattedResult,

      navigateTo,
      resetForm,
      selectFromSearch,
      searchPapers,
      selectPaper,
      analyzePaper,
      exportResult,
    }
  }
}
</script>

<style scoped>
.paper-analyze-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.analyze-header {
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

.analyze-form-card {
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

.analyze-tips {
  margin-top: 20px;
  background-color: rgba(var(--el-color-info-rgb), 0.1);
  padding: 15px;
  border-radius: 8px;
}

.analyze-tips h4 {
  display: flex;
  align-items: center;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: var(--el-color-info-dark-2);
}

.analyze-tips h4 .el-icon {
  margin-right: 8px;
}

.analyze-tips ul {
  margin: 0;
  padding-left: 20px;
}

.analyze-tips li {
  margin-bottom: 8px;
}

.loading-container {
  margin-top: 20px;
}

.result-card {
  margin-top: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.analysis-content {
  line-height: 1.6;
}

.analysis-content :deep(h1),
.analysis-content :deep(h2),
.analysis-content :deep(h3) {
  margin-top: 20px;
  margin-bottom: 10px;
}

.analysis-content :deep(p) {
  margin-bottom: 15px;
}

.analysis-content :deep(ul),
.analysis-content :deep(ol) {
  margin-bottom: 15px;
  padding-left: 20px;
}

.analysis-content :deep(li) {
  margin-bottom: 5px;
}

.analysis-content :deep(code) {
  background-color: #f8f8f8;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.analysis-content :deep(pre) {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

.dialog-loading {
  margin: 20px 0;
}
</style> 