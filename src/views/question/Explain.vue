<template>
  <div class="explain-container">
    <div class="page-header">
      <h1 class="page-title">习题解析</h1>
      <el-button @click="goBack" type="default" size="small">返回 <el-icon><ArrowRight /></el-icon></el-button>
    </div>
    
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
        <el-card class="question-card">
          <template #header>
            <div class="card-header">
              <h3>输入习题</h3>
            </div>
          </template>
          
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="习题内容" prop="questionText">
              <el-input
                v-model="form.questionText"
                type="textarea"
                :rows="8"
                placeholder="请输入需要解析的习题内容"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="analyzeQuestion" :loading="loading">解析习题</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <h3>示例题目</h3>
            </div>
          </template>
          
          <div class="examples-list">
            <div
              v-for="(example, index) in examples"
              :key="index"
              class="example-item"
              @click="useExample(example)"
            >
              <h4>{{ example.title }}</h4>
              <p class="example-preview">{{ example.preview }}</p>
              <div class="example-footer">
                <el-tag size="small">{{ example.type }}</el-tag>
                <el-button size="small" type="text">使用此例</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card v-if="result" class="result-card mt-20">
      <template #header>
        <div class="card-header">
          <h3>解析结果</h3>
          <el-button-group>
            <el-button size="small" @click="copyResult">
              <el-icon><DocumentCopy /></el-icon> 复制
            </el-button>
            <el-button size="small" @click="saveResult">
              <el-icon><Star /></el-icon> 收藏
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <el-divider content-position="left">习题内容</el-divider>
      <div class="question-display" v-html="result.questionHtml"></div>
      
      <el-divider content-position="left">解析</el-divider>
      <div class="analysis-display" v-html="result.analysisHtml"></div>
      
      <el-divider content-position="left">答案</el-divider>
      <div class="answer-display" v-html="result.answerHtml"></div>
      
      <el-divider content-position="left">相关知识点</el-divider>
      <div class="knowledge-points">
        <el-tag
          v-for="(point, index) in result.knowledgePoints"
          :key="index"
          class="knowledge-tag"
          @click="searchKnowledge(point)"
        >
          {{ point }}
        </el-tag>
      </div>
      
      <el-divider content-position="left">相似习题</el-divider>
      <ul class="similar-questions">
        <li v-for="(item, index) in result.similarQuestions" :key="index">
          <a href="javascript:void(0)" @click="loadSimilarQuestion(item)">{{ item.title }}</a>
        </li>
      </ul>
    </el-card>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, Star, ArrowRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

export default {
  name: 'QuestionExplainView',
  components: {
    DocumentCopy,
    Star,
    ArrowRight
  },
  setup() {
    const formRef = ref(null)
    const loading = ref(false)
    const result = ref(null)
    const router = useRouter()
    
    // 表单数据
    const form = reactive({
      questionText: ''
    })
    
    // 表单验证规则
    const rules = {
      questionText: [
        { required: true, message: '请输入习题内容', trigger: 'blur' }
      ]
    }
    
    // 示例题目
    const examples = [
      {
        title: '软件设计模式选择题',
        preview: '观察者模式与发布-订阅模式的主要区别是什么？',
        content: '观察者模式与发布-订阅模式的主要区别是什么？\nA. 两者没有本质区别\nB. 观察者模式中主体和观察者直接交互，而发布-订阅模式通过中间层解耦\nC. 观察者模式用于一对多通信，发布-订阅模式用于一对一通信\nD. 观察者模式只能用于GUI设计，发布-订阅模式用于分布式系统',
        type: '选择题'
      },
      {
        title: '软件测试计算题',
        preview: '给定程序有三个条件判断，请计算基本路径测试所需的最少测试用例数量。',
        content: '给定一个程序片段，其中包含三个条件判断（if语句），形成了4个独立的执行路径。使用McCabe环路复杂度公式，计算该程序的环路复杂度V(G)和基本路径测试所需的最少测试用例数量。',
        type: '计算题'
      },
      {
        title: '需求工程简答题',
        preview: '简述功能性需求和非功能性需求的区别，并各举两个例子。',
        content: '简述功能性需求和非功能性需求的区别，并各举两个例子。',
        type: '简答题'
      }
    ]
    
    // 使用示例题目
    const useExample = (example) => {
      form.questionText = example.content
      ElMessage.success(`已加载示例题目：${example.title}`)
    }
    
    // 解析习题
    const analyzeQuestion = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          
          try {
            // 调用后端API获取习题解析
            const formData = new FormData()
            formData.append('question', form.questionText)
            
            // 调用API
            const response = await import('@/api').then(module => {
              return module.default.question.explain(formData)
            })
            
            if (response && response.status === 'success') {
              // 解析返回的数据
              let explanationData;
              try {
                // 尝试解析message字段中的JSON字符串
                explanationData = JSON.parse(response.message);
              } catch (error) {
                console.error('解析响应数据出错:', error);
                explanationData = {
                  explanation: '解析数据格式错误',
                  reference_answer: '无法获取参考答案',
                  key_points: []
                };
              }
              
              // 构建结果对象
              result.value = {
                questionHtml: `<p>${form.questionText}</p>`,
                analysisHtml: `<p>${explanationData.explanation || '未提供解析'}</p>`,
                answerHtml: `<p><strong>${explanationData.reference_answer || '未提供参考答案'}</strong></p>`,
                knowledgePoints: explanationData.key_points || [],
                similarQuestions: [] // 目前API不返回相似题目，可以后续扩展
              }
              
              ElMessage.success('习题解析完成')
            } else {
              ElMessage.error(response?.message || '解析习题失败，请稍后重试')
            }
            
            loading.value = false
          } catch (error) {
            console.error('解析习题出错:', error)
            ElMessage.error('解析习题失败，请稍后重试')
            loading.value = false
          }
        }
      })
    }
    
    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      result.value = null
    }
    
    // 复制结果
    const copyResult = () => {
      if (result.value) {
        const content = `问题：${stripHtml(result.value.questionHtml)}\n\n解析：${stripHtml(result.value.analysisHtml)}\n\n答案：${stripHtml(result.value.answerHtml)}`
        navigator.clipboard.writeText(content)
          .then(() => {
            ElMessage.success('解析结果已复制到剪贴板')
          })
          .catch(() => {
            ElMessage.error('复制失败，请手动复制')
          })
      }
    }
    
    // 保存结果
    const saveResult = () => {
      // 注意：后端尚未实现习题收藏功能，这里只是一个前端提示
      // TODO: 当后端实现收藏功能后，替换为实际API调用
      ElMessage({
        message: '习题收藏功能正在开发中，暂时无法使用',
        type: 'info'
      })
    }
    
    // 搜索知识点
    const searchKnowledge = (knowledgePoint) => {
      // 使用路由导航到知识解析页面，并传递知识点作为查询参数
      router.push({
        name: 'ExplainIndex',
        query: { query: knowledgePoint, auto_analyze: 'true' }
      })
    }
    
    // 加载相似题目
    const loadSimilarQuestion = (question) => {
      // 注意：后端尚未实现相似题目推荐功能，这里只是一个前端提示
      // TODO: 当后端实现相似题目推荐功能后，替换为实际API调用
      ElMessage({
        message: `相似题目推荐功能正在开发中，您要加载的题目是：${question.title}`,
        type: 'info'
      })
    }
    
    // 工具函数：移除HTML标签
    const stripHtml = (html) => {
      const temp = document.createElement('div')
      temp.innerHTML = html
      return temp.textContent || temp.innerText || ''
    }
    
    // 添加返回函数
    const goBack = () => {
      router.push('/question')
    }
    
    return {
      formRef,
      loading,
      result,
      form,
      rules,
      examples,
      useExample,
      analyzeQuestion,
      resetForm,
      copyResult,
      saveResult,
      searchKnowledge,
      loadSimilarQuestion,
      goBack
    }
  }
}
</script>

<style scoped>
.explain-container {
  padding: 10px 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text-color);
}

.question-card, .example-card, .result-card {
  border-radius: 8px;
  margin-bottom: 20px;
  height: 100%;
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

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.example-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.example-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
  background-color: #f5f7fa;
}

.example-item h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.example-preview {
  color: var(--text-color-secondary);
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.example-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-display, .analysis-display, .answer-display {
  padding: 10px;
  line-height: 1.6;
}

.knowledge-points {
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.knowledge-tag {
  cursor: pointer;
  margin: 5px;
  transition: all 0.3s;
}

.knowledge-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.similar-questions {
  padding-left: 30px;
}

.similar-questions li {
  margin-bottom: 10px;
}

.similar-questions a {
  color: var(--primary-color);
  text-decoration: none;
}

.similar-questions a:hover {
  text-decoration: underline;
}

.mt-20 {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .example-card {
    margin-top: 20px;
  }
}
</style> 