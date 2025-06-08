<template>
  <div class="explain-container">
    <h1 class="page-title">知识解析</h1>
    
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="24" :lg="16" :xl="16">
        <el-card class="explain-card">
          <template #header>
            <div class="card-header">
              <h3>软件工程知识解析</h3>
            </div>
          </template>
          
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="解析内容" prop="query">
              <el-input
                v-model="form.query"
                type="textarea"
                :rows="5"
                placeholder="请输入需要解析的软件工程概念、原理或术语"
              />
            </el-form-item>
            
            <el-form-item label="解析风格">
              <el-radio-group v-model="form.style">
                <el-radio-button label="STRICT">严谨学术</el-radio-button>
                <el-radio-button label="POPULAR">通俗易懂</el-radio-button>
                <el-radio-button label="PROFESSIONAL">专业详细</el-radio-button>
                <el-radio-button label="CONCISE">简明扼要</el-radio-button>
                <el-radio-button label="FUNNY">生动有趣</el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="form.searchWeb">使用网络搜索获取最新信息</el-checkbox>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="getExplanation" :loading="loading">获取解析</el-button>
              <el-button @click="resetForm">重置</el-button>
              <el-button type="success" @click="generateDoc" :disabled="!result">保存为PDF</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card v-if="result" class="result-card mt-20">
          <template #header>
            <div class="card-header">
              <h3>解析结果</h3>
              <el-button-group>
                <el-button size="small" @click="copyResult">
                  <el-icon><DocumentCopy /></el-icon> 复制
                </el-button>
                <el-button size="small" @click="shareResult">
                  <el-icon><Share /></el-icon> 分享
                </el-button>
              </el-button-group>
            </div>
          </template>
          
          <div class="result-content" v-html="formattedResult"></div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="24" :lg="8" :xl="8">
        <el-card class="popular-topics-card">
          <template #header>
            <div class="card-header">
              <h3>热门解析主题</h3>
            </div>
          </template>
          
          <div class="topics-container">
            <div v-for="(category, index) in popularTopics" :key="index" class="topic-category">
              <h4>{{ category.title }}</h4>
              <el-divider></el-divider>
              <div class="tags-wrapper">
                <el-tag
                  v-for="(topic, i) in category.topics"
                  :key="i"
                  class="topic-tag"
                  @click="useTopic(topic)"
                >
                  {{ topic }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as marked from 'marked'
import { DocumentCopy, Share } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

export default {
  name: 'ExplainIndexView',
  components: {
    DocumentCopy,
    Share
  },
  setup() {
    const formRef = ref(null)
    const loading = ref(false)
    const result = ref(null)
    const route = useRoute()
    
    const form = reactive({
      query: '',
      style: 'POPULAR',
      searchWeb: false
    })
    
    const rules = {
      query: [
        { required: true, message: '请输入需要解析的内容', trigger: 'blur' },
        { min: 2, message: '内容至少需要2个字符', trigger: 'blur' }
      ]
    }
    
    const popularTopics = [
      {
        title: '软件工程基础',
        topics: [
          '软件生命周期',
          '软件需求分析',
          '软件设计原则',
          '软件测试方法',
          '配置管理'
        ]
      },
      {
        title: '开发方法论',
        topics: [
          '敏捷开发',
          'Scrum框架',
          '瀑布模型',
          '迭代增量开发',
          'DevOps实践'
        ]
      },
      {
        title: '设计与架构',
        topics: [
          '设计模式',
          '架构风格',
          '微服务架构',
          'UML建模',
          '领域驱动设计'
        ]
      }
    ]
    
    const formattedResult = computed(() => {
      if (!result.value) return ''
      
      // 将Markdown转换为HTML
      return marked.parse(result.value)
    })
    
    const getExplanation = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          
          try {
            // 准备表单数据
            const formData = new FormData()
            formData.append('query', form.query)
            formData.append('style_label', form.style)
            formData.append('bing_search', form.searchWeb)
            
            // 调用后端API获取解析结果
            const response = await import('@/api').then(module => {
              return module.default.explain.getExplanation(formData)
            })
            
            if (response && response.status === 'success') {
              try {
                // 清理JSON字符串中的控制字符
                const cleanedMessage = response.message
                  .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除所有控制字符
                  .replace(/\\u0000-\\u001F\\u007F-\\u009F/g, '') // 移除转义的控制字符
                
                // 解析嵌套的JSON字符串
                let responseData = JSON.parse(cleanedMessage)
                
                // 设置解析结果
                result.value = responseData.message
                
                // 如果有搜索结果，显示相关链接
                if (form.searchWeb && responseData.search_results && responseData.search_results.length > 0) {
                  const searchResultsMarkdown = '\n\n## 相关资源\n\n' + 
                    responseData.search_results.map(item => `- [${item.title}](${item.link})`).join('\n')
                  result.value += searchResultsMarkdown
                }
                
                ElMessage.success('解析成功')
              } catch (parseError) {
                console.error('解析响应数据出错:', parseError)
                
                // 失败后尝试使用更强大的错误恢复方法
                try {
                  // 方法1: 尝试提取message字段
                  const messageMatch = response.message.match(/"message"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
                  if (messageMatch && messageMatch[1]) {
                    // 提取出message值并处理转义字符
                    result.value = messageMatch[1]
                      .replace(/\\n/g, '\n')
                      .replace(/\\"/g, '"')
                      .replace(/\\\\/g, '\\');
                    
                    ElMessage.warning('响应格式有问题，但已提取内容')
                  } else {
                    // 方法2: 如果无法提取，进行基本清理并显示
                    const basicCleaned = response.message
                      .replace(/"([^"]*)":/g, '"$1":') // 修复键名格式
                      .replace(/,\s*}/g, '}')          // 修复尾随逗号
                      .replace(/,\s*,/g, ',')          // 修复重复逗号
                      .replace(/\n/g, ' ');            // 移除换行符
                    
                    try {
                      // 尝试再次解析
                      let fixedData = JSON.parse(basicCleaned);
                      result.value = fixedData.message || response.message;
                    } catch {
                      // 如果仍然失败，直接使用文本
                      result.value = '解析失败，原始响应：\n\n' + response.message;
                    }
                    
                    ElMessage.warning('响应数据格式异常，但仍能显示部分结果')
                  }
                } catch (recoveryError) {
                  console.error('恢复数据失败:', recoveryError);
                  result.value = response.message; // 最后的回退选项
                  ElMessage.warning('响应数据格式异常，显示原始响应')
                }
              }
            } else {
              ElMessage.error(response?.message || '获取解析失败，请稍后重试')
            }
          } catch (error) {
            console.error('获取解析出错:', error)
            ElMessage.error('获取解析失败，请稍后重试')
          } finally {
            loading.value = false
          }
        }
      })
    }
    
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      form.style = 'POPULAR'
      form.searchWeb = false
      result.value = null
    }
    
    const useTopic = (topic) => {
      form.query = topic
      getExplanation()
    }
    
    const copyResult = () => {
      if (result.value) {
        navigator.clipboard.writeText(result.value)
          .then(() => {
            ElMessage.success('内容已复制到剪贴板')
          })
          .catch(() => {
            ElMessage.error('复制失败，请手动复制')
          })
      }
    }
    
    const shareResult = () => {
      ElMessage.info('分享功能开发中...')
    }
    
    const generateDoc = async () => {
      if (result.value) {
        try {
          // 使用浏览器的打印功能保存为PDF
          const printWindow = window.open('', '_blank')
          
          if (!printWindow) {
            ElMessage.error('无法打开新窗口，请检查您的浏览器设置是否允许弹出窗口')
            return
          }
          
          // 创建文档标题
          const title = form.query.length > 30 ? form.query.substring(0, 30) + '...' : form.query
          
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${title} - 知识解析</title>
              <meta charset="UTF-8">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  margin: 40px;
                  color: #333;
                }
                h1 {
                  color: #2c3e50;
                  border-bottom: 1px solid #eee;
                  padding-bottom: 10px;
                }
                h2 {
                  color: #3498db;
                  margin-top: 25px;
                }
                pre {
                  background-color: #f8f8f8;
                  padding: 15px;
                  border-radius: 4px;
                  overflow-x: auto;
                }
                code {
                  font-family: Consolas, Monaco, monospace;
                }
                a {
                  color: #3498db;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
                .header {
                  margin-bottom: 30px;
                }
                .query {
                  font-style: italic;
                  color: #7f8c8d;
                  margin-bottom: 20px;
                }
                .style {
                  font-size: 0.9em;
                  color: #7f8c8d;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>软件工程知识解析</h1>
                <p class="query">查询: ${form.query}</p>
                <p class="style">解析风格: ${getStyleName(form.style)}</p>
              </div>
              <div class="content">
                ${formattedResult.value}
              </div>
              <div class="footer">
                <p>生成时间: ${new Date().toLocaleString()}</p>
              </div>
            </body>
            </html>
          `)
          
          printWindow.document.close()
          
          // 等待内容加载完成后打印
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
            ElMessage.success('文档已准备好，请使用浏览器的打印功能保存为PDF')
          }, 500)
          
        } catch (error) {
          console.error('生成文档出错:', error)
          ElMessage.error('文档生成失败，请稍后重试')
        }
      }
    }
    
    // 获取风格名称
    const getStyleName = (styleCode) => {
      const styleMap = {
        'STRICT': '严谨学术',
        'POPULAR': '通俗易懂',
        'PROFESSIONAL': '专业详细',
        'CONCISE': '简明扼要',
        'FUNNY': '生动有趣'
      }
      return styleMap[styleCode] || styleCode
    }
    
    // 检查URL参数并自动开始解析
    onMounted(() => {
      const { query, auto_analyze } = route.query
      
      if (query) {
        form.query = query
        
        // 如果有auto_analyze参数且值为true，自动开始解析
        if (auto_analyze === 'true') {
          getExplanation()
        }
      }
    })
    
    return {
      formRef,
      form,
      rules,
      loading,
      result,
      formattedResult,
      popularTopics,
      getExplanation,
      resetForm,
      useTopic,
      copyResult,
      shareResult,
      generateDoc
    }
  }
}
</script>

<style scoped>
.explain-container {
  padding: 10px 0;
}

.page-title {
  margin-bottom: 24px;
  font-size: 1.8rem;
  color: var(--text-color);
}

.explain-card, .result-card, .popular-topics-card {
  border-radius: 8px;
  margin-bottom: 20px;
  height: auto;
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

.result-content {
  line-height: 1.6;
  white-space: pre-wrap;
}

.result-content :deep(h1),
.result-content :deep(h2),
.result-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  color: var(--text-color);
}

.result-content :deep(p) {
  margin-bottom: 12px;
}

.result-content :deep(ul),
.result-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 16px;
}

.result-content :deep(li) {
  margin-bottom: 6px;
}

.result-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.result-content :deep(a:hover) {
  text-decoration: underline;
}

.result-content :deep(code) {
  background-color: #f6f6f6;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.result-content :deep(pre) {
  background-color: #f6f6f6;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.topics-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.topic-category h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.topic-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.topic-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.mt-20 {
  margin-top: 20px;
}

/* 添加滚动效果，保证长内容易于浏览 */
.result-content {
  max-height: none;
  overflow-y: visible;
}
</style> 