<template>
  <div class="test-generator-container">
    <div class="generator-header">
      <h1 class="page-title">测试用例生成</h1>
      <el-button @click="navigateTo('/test')" plain>
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>
    
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h3>代码测试配置</h3>
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
        
        <el-form-item label="测试类型" prop="testType">
          <el-select v-model="form.testType" placeholder="选择测试类型" class="w-100">
            <el-option 
              v-for="type in testTypes" 
              :key="type.value" 
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="代码片段" prop="code">
          <el-input
            v-model="form.code"
            type="textarea"
            :rows="12"
            placeholder="请粘贴需要生成测试用例的代码片段"
            class="code-input"
          />
        </el-form-item>
        
        <el-form-item label="功能描述(可选)">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="描述代码的功能，帮助生成更准确的测试用例"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="generateTests" :loading="loading">
            <el-icon><DocumentAdd /></el-icon> 生成测试用例
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
          <h3>生成的测试用例</h3>
          <div class="header-actions">
            <el-button size="small" @click="copyResult">
              <el-icon><DocumentCopy /></el-icon> 复制
            </el-button>
            <el-button size="small" @click="downloadResult">
              <el-icon><Download /></el-icon> 下载
            </el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="测试代码" name="code">
          <pre class="code-block"><code>{{result.test_code}}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="测试说明" name="explanation">
          <div class="explanation" v-if="result.explanation">
            <div v-html="formattedExplanation"></div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-card class="tips-card">
      <template #header>
        <div class="card-header">
          <h3>编写可测试代码的建议</h3>
        </div>
      </template>
      
      <div class="tips-content">
        <el-collapse>
          <el-collapse-item title="提高代码可测性的原则" name="1">
            <ul>
              <li><strong>单一职责原则：</strong>每个函数或类只做一件事，使测试更容易关注单一功能</li>
              <li><strong>依赖注入：</strong>通过参数传递依赖，便于在测试中模拟这些依赖</li>
              <li><strong>避免全局状态：</strong>全局变量和状态会使测试结果不可预测</li>
              <li><strong>明确的接口：</strong>设计清晰、一致的API使测试更直观</li>
              <li><strong>避免副作用：</strong>函数的行为应该由其输入决定，避免修改外部状态</li>
            </ul>
          </el-collapse-item>
          
          <el-collapse-item title="针对不同编程语言的测试框架推荐" name="2">
            <ul>
              <li><strong>Java：</strong> JUnit, Mockito, TestNG</li>
              <li><strong>Python：</strong> pytest, unittest, nose</li>
              <li><strong>JavaScript：</strong> Jest, Mocha, Jasmine</li>
              <li><strong>C#：</strong> NUnit, xUnit.net, MSTest</li>
              <li><strong>C++：</strong> Google Test, Catch2, Boost.Test</li>
            </ul>
          </el-collapse-item>
          
          <el-collapse-item title="测试用例设计策略" name="3">
            <ul>
              <li><strong>等价类划分：</strong>将输入数据划分为有效和无效等价类，每类选择代表性值</li>
              <li><strong>边界值分析：</strong>测试边界条件，如最小/最大值、边界前后的值</li>
              <li><strong>决策表：</strong>针对多个条件组合的情况设计测试</li>
              <li><strong>状态转换测试：</strong>测试系统在不同状态间的转换</li>
              <li><strong>错误猜测：</strong>基于经验预测可能出错的地方进行测试</li>
            </ul>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, DocumentAdd, Refresh, Connection, DocumentCopy, Download } from '@element-plus/icons-vue'
import api from '@/api'
import * as marked from 'marked'

export default {
  name: 'TestGenerator',
  components: {
    Back,
    DocumentAdd,
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
    const activeTab = ref('code')
    
    // 支持的编程语言
    const languages = [
      { label: 'Java', value: 'java' },
      { label: 'Python', value: 'python' },
      { label: 'JavaScript', value: 'javascript' },
      { label: 'C++', value: 'cpp' },
      { label: 'C#', value: 'csharp' }
    ]
    
    // 测试类型
    const testTypes = [
      { label: '单元测试', value: 'unit_test' },
      { label: '集成测试', value: 'integration_test' },
      { label: 'API测试', value: 'api_test' },
      { label: '性能测试', value: 'performance_test' },
      { label: '安全测试', value: 'security_test' }
    ]
    
    // 表单数据
    const form = reactive({
      language: 'java',
      testType: 'unit_test',
      code: '',
      description: ''
    })
    
    // 表单验证规则
    const rules = {
      language: [
        { required: true, message: '请选择编程语言', trigger: 'change' }
      ],
      testType: [
        { required: true, message: '请选择测试类型', trigger: 'change' }
      ],
      code: [
        { required: true, message: '请输入代码片段', trigger: 'blur' },
        { min: 10, message: '代码片段太短，无法生成有效测试用例', trigger: 'blur' }
      ]
    }
    
    // 格式化测试说明为HTML
    const formattedExplanation = computed(() => {
      if (!result.value || !result.value.explanation) return ''
      try {
        return marked.parse(result.value.explanation)
      } catch (error) {
        console.error('Markdown 渲染错误:', error)
        return `<pre>${result.value.explanation}</pre>`
      }
    })
    
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
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int subtract(int a, int b) {
        return a - b;
    }
    
    public int multiply(int a, int b) {
        return a * b;
    }
    
    public double divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero");
        }
        return (double) a / b;
    }
}`,
        'python': `
class Calculator:
    def add(self, a, b):
        return a + b
        
    def subtract(self, a, b):
        return a - b
        
    def multiply(self, a, b):
        return a * b
        
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Division by zero")
        return a / b`,
        'javascript': `
class Calculator {
    add(a, b) {
        return a + b;
    }
    
    subtract(a, b) {
        return a - b;
    }
    
    multiply(a, b) {
        return a * b;
    }
    
    divide(a, b) {
        if (b === 0) {
            throw new Error("Division by zero");
        }
        return a / b;
    }
}`,
        'cpp': `
class Calculator {
public:
    int add(int a, int b) {
        return a + b;
    }
    
    int subtract(int a, int b) {
        return a - b;
    }
    
    int multiply(int a, int b) {
        return a * b;
    }
    
    double divide(int a, int b) {
        if (b == 0) {
            throw std::invalid_argument("Division by zero");
        }
        return static_cast<double>(a) / b;
    }
};`,
        'csharp': `
public class Calculator
{
    public int Add(int a, int b)
    {
        return a + b;
    }
    
    public int Subtract(int a, int b)
    {
        return a - b;
    }
    
    public int Multiply(int a, int b)
    {
        return a * b;
    }
    
    public double Divide(int a, int b)
    {
        if (b == 0)
        {
            throw new System.DivideByZeroException("Division by zero");
        }
        return (double)a / b;
    }
}`
      }
      
      form.code = examples[form.language] || ''
      form.description = '一个简单的计算器类，实现了基本的数学运算功能，包括加法、减法、乘法和除法。'
      
      ElMessage.success('已加载示例代码')
    }
    
    // 生成测试用例
    const generateTests = async () => {
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
        formData.append('test_type', form.testType)
        
        if (form.description) {
          formData.append('description', form.description)
        }
        
        // 调用后端API
        const response = await api.test.generateTestCases(formData)
        
        if (response && response.status === 'success') {
          // 如果响应是JSON字符串，需要先解析
          let resultData = response.message;
          if (typeof resultData === 'string' && resultData.trim().startsWith('{')) {
            try {
              resultData = JSON.parse(resultData);
            } catch (e) {
              console.error('解析响应JSON出错:', e);
            }
          }
          
          // 设置结果
          result.value = {
            test_code: resultData.code ? resultData.code.trim() : '', // 使用trim()移除开头和结尾的空白
            explanation: resultData.explanation || ''
          };
          
          activeTab.value = 'code';
          ElMessage.success('测试用例生成成功');
        } else {
          ElMessage.error(response?.message || '生成测试用例失败，请稍后重试');
        }
      } catch (error) {
        console.error('生成测试用例出错:', error);
        ElMessage.error('生成测试用例失败，请检查网络连接');
      } finally {
        loading.value = false;
      }
    }
    
    // 复制测试代码
    const copyResult = () => {
      if (!result.value) {
        ElMessage.warning('没有可复制的测试用例')
        return
      }
      
      const textToCopy = activeTab.value === 'code' 
        ? result.value.test_code 
        : result.value.explanation
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          ElMessage.success('已复制到剪贴板')
        })
        .catch(() => {
          ElMessage.error('复制失败，请手动复制')
        })
    }
    
    // 下载测试代码
    const downloadResult = () => {
      if (!result.value) {
        ElMessage.warning('没有可下载的测试用例')
        return
      }
      
      const textToDownload = activeTab.value === 'code' 
        ? result.value.test_code 
        : result.value.explanation
        
      const filename = activeTab.value === 'code' 
        ? `test_${new Date().getTime()}.${getFileExtension(form.language)}`
        : `test_explanation_${new Date().getTime()}.md`
      
      // 创建一个Blob对象
      const blob = new Blob([textToDownload], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      // 创建一个临时链接并触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      ElMessage.success('测试用例已下载')
    }
    
    // 根据语言获取文件扩展名
    const getFileExtension = (language) => {
      const extensions = {
        'java': 'java',
        'python': 'py',
        'javascript': 'js',
        'cpp': 'cpp',
        'csharp': 'cs'
      }
      
      return extensions[language] || 'txt'
    }
    
    return {
      formRef,
      form,
      rules,
      loading,
      result,
      activeTab,
      languages,
      testTypes,
      formattedExplanation,
      navigateTo,
      resetForm,
      useExample,
      generateTests,
      copyResult,
      downloadResult
    }
  }
}
</script>

<style scoped>
.test-generator-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.generator-header {
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

.code-block {
  margin: 0;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-family: monospace;
  overflow-x: auto;
  white-space: pre-wrap;
}

.explanation :deep(h1),
.explanation :deep(h2),
.explanation :deep(h3) {
  margin-top: 20px;
  margin-bottom: 10px;
}

.explanation :deep(p) {
  margin-bottom: 15px;
}

.explanation :deep(ul),
.explanation :deep(ol) {
  margin-bottom: 15px;
  padding-left: 20px;
}

.explanation :deep(li) {
  margin-bottom: 5px;
}

.explanation :deep(code) {
  background-color: #f8f8f8;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.explanation :deep(pre) {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

.tips-card {
  margin-bottom: 20px;
}
</style> 