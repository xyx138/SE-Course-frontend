<template>
  <div class="test-analysis-container">
    <div class="analysis-header">
      <h1 class="page-title">代码可测性分析</h1>
      <el-button @click="navigateTo('/test')" plain>
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>
    
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h3>代码分析配置</h3>
        </div>
      </template>
      
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="编程语言" prop="language">
          <el-select v-model="form.language" placeholder="选择编程语言" class="w-100">
            <el-option 
              v-for="lang in languages" 
              :key="lang.value" 
              :label="lang.label" 
              :value="lang.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="代码片段" prop="code">
          <el-input
            v-model="form.code"
            type="textarea"
            :rows="12"
            placeholder="请粘贴需要分析可测性的代码片段"
            class="code-input"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="analyzeCode" :loading="loading">
            <el-icon><DataAnalysis /></el-icon> 分析可测性
          </el-button>
          <el-button @click="resetForm">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
          <el-button type="success" @click="useExample">
            <el-icon><Connection /></el-icon> 使用示例代码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="15" animated />
    </div>
    
    <el-card v-else-if="result" class="result-card">
      <template #header>
        <div class="card-header">
          <h3>可测性分析结果</h3>
          <div class="header-actions">
            <el-button size="small" @click="copyResult">
              <el-icon><DocumentCopy /></el-icon> 复制
            </el-button>
            <el-button size="small" @click="downloadResult">
              <el-icon><Download /></el-icon> 导出
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="result-content">
        <div class="score-section">
          <h4>代码可测性评分</h4>
          <el-progress 
            :percentage="Number(result.score)" 
            :status="getScoreStatus(Number(result.score))"
            :stroke-width="15"
            class="score-progress"
          >
            <template #default="{ percentage }">
              <span class="score-label">{{ percentage }}分</span>
            </template>
          </el-progress>
          
          <div class="score-explanation">
            {{ getScoreExplanation(Number(result.score)) }}
          </div>
        </div>
        
        <el-divider />
        
        <div class="analysis-details">
          <h4>分析详情</h4>
          <div class="markdown-content" v-html="formattedExplanation"></div>
        </div>
        
        <el-divider />
        
        <div class="test-points">
          <h4>重点测试部分</h4>
          <div class="markdown-content" v-html="formattedTestPoints"></div>
        </div>
        
        <el-divider />
        
        <div class="suggestions">
          <h4>改进建议</h4>
          <div class="markdown-content" v-html="formattedSuggestions"></div>
        </div>
        
        <el-divider />
        
        <div class="example">
          <h4>改进示例</h4>
          <div v-if="result && result.example">
            <div v-html="formattedExampleText"></div>
            <pre v-if="exampleCode" class="code-block"><code>{{ exampleCode }}</code></pre>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Back, Refresh, Connection, DocumentCopy, Download } from '@element-plus/icons-vue'
import api from '@/api'
import * as marked from 'marked'

export default {
  name: 'TestAnalysis',
  components: {
    DataAnalysis,
    Back,
    Refresh,
    Connection,
    DocumentCopy,
    Download
  },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const result = ref(null)
    
    // 支持的编程语言
    const languages = [
      { label: 'Java', value: 'java' },
      { label: 'Python', value: 'python' },
      { label: 'JavaScript', value: 'javascript' },
      { label: 'C++', value: 'cpp' },
      { label: 'C#', value: 'csharp' }
    ]
    
    // 表单数据
    const form = reactive({
      language: 'java',
      code: ''
    })
    
    // 表单验证规则
    const rules = {
      language: [
        { required: true, message: '请选择编程语言', trigger: 'change' }
      ],
      code: [
        { required: true, message: '请输入代码片段', trigger: 'blur' },
        { min: 10, message: '代码片段太短，无法进行有效分析', trigger: 'blur' }
      ]
    }
    
    // 格式化分析结果为HTML
    const formattedExplanation = computed(() => {
      if (!result.value || !result.value.explanation) return ''
      return formatMarkdown(result.value.explanation)
    })
    
    // 格式化测试重点为HTML
    const formattedTestPoints = computed(() => {
      if (!result.value || !result.value.test_points) return ''
      return formatMarkdown(result.value.test_points)
    })
    
    // 格式化建议为HTML
    const formattedSuggestions = computed(() => {
      if (!result.value || !result.value.suggestions) return ''
      return formatMarkdown(result.value.suggestions)
    })
    
    // 提取示例中的代码块
    const exampleCode = computed(() => {
      if (!result.value || !result.value.example) return null
      
      // 尝试提取代码块
      // 查找是否有三个反引号包围的代码块
      const codeBlockRegex = /```(?:java|javascript|python|cpp|csharp)?\s*([\s\S]*?)```/g
      const match = codeBlockRegex.exec(result.value.example)
      
      if (match && match[1]) {
        return match[1].trim()
      }
      
      // 如果没有明确的代码块标记，尝试检测是否整个内容就是代码
      // 简单检测：如果包含多行且有类似代码的语法（如大括号、分号等）
      const content = result.value.example
      if (content.includes('{') && content.includes('}') && 
          (content.includes(';') || content.includes('public') || content.includes('class'))) {
        return content
      }
      
      return null
    })
    
    // 格式化示例文本（不包括代码块）
    const formattedExampleText = computed(() => {
      if (!result.value || !result.value.example) return ''
      
      let content = result.value.example
      
      // 如果有代码块，从文本中移除它，只显示说明部分
      if (exampleCode.value) {
        // 移除三个反引号包围的代码块
        content = content.replace(/```(?:java|javascript|python|cpp|csharp)?\s*[\s\S]*?```/g, '')
        // 如果整个内容都是代码，则返回空字符串或默认说明
        if (!content.trim()) {
          return '<p>以下是改进后的代码示例：</p>'
        }
      }
      
      return formatMarkdown(content)
    })
    
    // 根据分数获取状态
    const getScoreStatus = (score) => {
      if (score >= 80) return 'success'
      if (score >= 60) return 'warning'
      return 'exception'
    }
    
    // 根据分数获取解释
    const getScoreExplanation = (score) => {
      if (score >= 90) return '优秀 - 代码设计良好，易于测试'
      if (score >= 80) return '良好 - 代码可测性较高，有少量改进空间'
      if (score >= 70) return '一般 - 代码可测性中等，有一些需要改进的地方'
      if (score >= 60) return '较差 - 代码可测性存在问题，需要改进'
      return '差 - 代码难以测试，需要重构'
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
      result.value = null
    }
    
    // 使用示例代码
    const useExample = () => {
      // 根据当前选择的语言提供示例代码
      const examples = {
        'java': `
public class UserService {
    private UserRepository userRepository;
    private MailService mailService;
    
    public UserService() {
        this.userRepository = new UserRepository();
        this.mailService = new MailService();
    }
    
    public boolean registerUser(String username, String email, String password) {
        if (username == null || email == null || password == null) {
            return false;
        }
        
        if (userRepository.findByUsername(username) != null) {
            return false;
        }
        
        User user = new User(username, email, password);
        userRepository.save(user);
        
        boolean mailSent = mailService.sendWelcomeEmail(email, username);
        
        return true;
    }
    
    public User authenticateUser(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword().equals(password)) {
            return user;
        }
        return null;
    }
}`,
        'python': `
class UserService:
    def __init__(self):
        self.user_repository = UserRepository()
        self.mail_service = MailService()
    
    def register_user(self, username, email, password):
        if not username or not email or not password:
            return False
        
        if self.user_repository.find_by_username(username):
            return False
        
        user = User(username, email, password)
        self.user_repository.save(user)
        
        mail_sent = self.mail_service.send_welcome_email(email, username)
        
        return True
    
    def authenticate_user(self, username, password):
        user = self.user_repository.find_by_username(username)
        if user and user.password == password:
            return user
        return None`,
        'javascript': `
class UserService {
    constructor() {
        this.userRepository = new UserRepository();
        this.mailService = new MailService();
    }
    
    registerUser(username, email, password) {
        if (!username || !email || !password) {
            return false;
        }
        
        if (this.userRepository.findByUsername(username)) {
            return false;
        }
        
        const user = new User(username, email, password);
        this.userRepository.save(user);
        
        const mailSent = this.mailService.sendWelcomeEmail(email, username);
        
        return true;
    }
    
    authenticateUser(username, password) {
        const user = this.userRepository.findByUsername(username);
        if (user && user.password === password) {
            return user;
        }
        return null;
    }
}`,
        'cpp': `
class UserService {
private:
    UserRepository userRepository;
    MailService mailService;
    
public:
    UserService() {
        // Constructor initialization
    }
    
    bool registerUser(std::string username, std::string email, std::string password) {
        if (username.empty() || email.empty() || password.empty()) {
            return false;
        }
        
        if (userRepository.findByUsername(username) != nullptr) {
            return false;
        }
        
        User user(username, email, password);
        userRepository.save(user);
        
        bool mailSent = mailService.sendWelcomeEmail(email, username);
        
        return true;
    }
    
    User* authenticateUser(std::string username, std::string password) {
        User* user = userRepository.findByUsername(username);
        if (user != nullptr && user->getPassword() == password) {
            return user;
        }
        return nullptr;
    }
};`,
        'csharp': `
public class UserService
{
    private UserRepository userRepository;
    private MailService mailService;
    
    public UserService()
    {
        this.userRepository = new UserRepository();
        this.mailService = new MailService();
    }
    
    public bool RegisterUser(string username, string email, string password)
    {
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        {
            return false;
        }
        
        if (userRepository.FindByUsername(username) != null)
        {
            return false;
        }
        
        User user = new User(username, email, password);
        userRepository.Save(user);
        
        bool mailSent = mailService.SendWelcomeEmail(email, username);
        
        return true;
    }
    
    public User AuthenticateUser(string username, string password)
    {
        User user = userRepository.FindByUsername(username);
        if (user != null && user.Password == password)
        {
            return user;
        }
        return null;
    }
}`
      }
      
      form.code = examples[form.language] || ''
      
      ElMessage.success('已加载示例代码')
    }
    
    // 统一处理Markdown格式化的函数
    const formatMarkdown = (text) => {
      if (!text) return ''
      
      try {
        // 确保文本是字符串
        const stringText = String(text)
        
        // 检查是否已经是HTML
        if (stringText.trim().startsWith('<') && stringText.includes('</')) {
          return stringText
        }
        
        // 使用marked解析Markdown
        const html = marked.parse(stringText)
        return html
      } catch (error) {
        console.error('Markdown 渲染错误:', error)
        // 如果解析失败，至少确保换行符被转换为<br>标签
        return String(text).replace(/\n/g, '<br>')
      }
    }
    
    // 分析代码可测性
    const analyzeCode = async () => {
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
        formData.append('code', form.code)
        formData.append('language', form.language)
        
        // 调用后端API
        const response = await api.test.analyzeTestability(formData)
        
        if (response && response.status === 'success') {
          // 如果响应是JSON字符串，需要先解析
          let resultData = response.message
          if (typeof resultData === 'string') {
            try {
              // 尝试解析JSON字符串
              resultData = JSON.parse(resultData)
            } catch (e) {
              console.error('解析响应JSON出错:', e)
              // 如果解析失败，保持原样
            }
          }
          
          // 设置结果，确保所有字段都是字符串
          result.value = {
            score: Number(resultData.score) || 0,
            explanation: String(resultData.explanation || ''),
            suggestions: String(resultData.suggestions || ''),
            test_points: String(resultData.test_points || ''),
            example: String(resultData.example || '')
          }
          
          ElMessage.success('代码可测性分析完成')
        } else {
          ElMessage.error(response?.message || '分析代码可测性失败，请稍后重试')
        }
      } catch (error) {
        console.error('分析代码可测性出错:', error)
        ElMessage.error('分析代码可测性失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }
    
    // 复制分析结果
    const copyResult = () => {
      if (!result.value) {
        ElMessage.warning('没有可复制的分析结果')
        return
      }
      
      // 创建格式化的文本内容
      const content = [
        `# 代码可测性分析结果`,
        `-------------------------`,
        `## 可测性评分: ${result.value.score}/100`,
        ``,
        `## 分析详情:`,
        result.value.explanation || '',
        ``,
        `## 重点测试部分:`,
        result.value.test_points || '',
        ``,
        `## 改进建议:`,
        result.value.suggestions || '',
        ``,
        `## 改进示例:`,
        result.value.example || ''
      ].join('\n')
      
      navigator.clipboard.writeText(content)
        .then(() => {
          ElMessage.success('已复制到剪贴板')
        })
        .catch(() => {
          ElMessage.error('复制失败，请手动复制')
        })
    }
    
    // 下载分析结果
    const downloadResult = () => {
      if (!result.value) {
        ElMessage.warning('没有可下载的分析结果')
        return
      }
      
      // 创建格式化的文本内容
      const content = [
        `# 代码可测性分析结果\n`,
        `## 可测性评分: ${result.value.score}/100\n`,
        `${getScoreExplanation(Number(result.value.score))}\n`,
        `## 分析详情:\n`,
        result.value.explanation || '',
        `\n## 重点测试部分:\n`,
        result.value.test_points || '',
        `\n## 改进建议:\n`,
        result.value.suggestions || '',
        `\n## 改进示例:\n`,
        result.value.example || ''
      ].join('\n')
      
      // 创建一个Blob对象
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      
      // 创建一个临时链接并触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = `代码可测性分析_${form.language}_${new Date().toISOString().slice(0, 10)}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      ElMessage.success('分析结果已下载')
    }
    
    return {
      formRef,
      form,
      rules,
      loading,
      result,
      languages,
      formattedExplanation,
      formattedTestPoints,
      formattedSuggestions,
      formattedExampleText,
      exampleCode,
      navigateTo,
      resetForm,
      useExample,
      analyzeCode,
      copyResult,
      downloadResult,
      getScoreStatus,
      getScoreExplanation,
      formatMarkdown
    }
  }
}
</script>

<style scoped>
.test-analysis-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.analysis-header {
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

.form-card {
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

.w-100 {
  width: 100%;
}

.code-input {
  font-family: monospace;
}

.loading-container {
  margin-top: 20px;
}

.result-card {
  margin-top: 20px;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.score-section {
  text-align: center;
  padding: 10px 0 20px;
}

.score-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.score-progress {
  max-width: 300px;
  margin: 0 auto;
}

.score-label {
  font-size: 16px;
  font-weight: bold;
}

.score-explanation {
  margin-top: 15px;
  color: var(--el-text-color-secondary);
}

.analysis-details h4,
.test-points h4,
.example h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.analysis-details :deep(p),
.test-points :deep(p),
.example :deep(p) {
  margin-bottom: 10px;
  line-height: 1.6;
}

.analysis-details :deep(ul),
.test-points :deep(ul),
.example :deep(ul) {
  padding-left: 20px;
  margin-bottom: 15px;
}

.analysis-details :deep(li),
.test-points :deep(li),
.example :deep(li) {
  margin-bottom: 5px;
}

.code-example {
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 10px;
}

.code-example-label {
  margin-bottom: 5px;
  font-weight: bold;
}

.code-block {
  margin: 10px 0;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
  tab-size: 4;
  -moz-tab-size: 4;
  border: 1px solid #ddd;
}

.code-block code {
  display: block;
  width: 100%;
  overflow-x: auto;
}

.mt-10 {
  margin-top: 10px;
}

.test-points :deep(pre),
.example :deep(pre),
.example :deep(code) {
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 10px;
  font-family: monospace;
  overflow-x: auto;
}

/* 添加 Markdown 内容的样式 */
.markdown-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 2em;
  margin-bottom: 1em;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5em;
}

.markdown-content :deep(code) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.5;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin-left: 0;
  margin-right: 0;
}
</style> 