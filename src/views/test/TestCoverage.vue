<template>
  <div class="test-coverage-container">
    <div class="coverage-header">
      <h1 class="page-title">测试覆盖率评估</h1>
      <el-button @click="navigateTo('/test')" plain>
        <el-icon><Back /></el-icon> 返回
      </el-button>
    </div>
    
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h3>覆盖率评估配置</h3>
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
        
        <el-form-item label="源代码" prop="sourceCode">
          <el-input
            v-model="form.sourceCode"
            type="textarea"
            :rows="8"
            placeholder="请粘贴需要评估覆盖率的源代码"
            class="code-input"
          />
        </el-form-item>
        
        <el-form-item label="测试代码" prop="testCode">
          <el-input
            v-model="form.testCode"
            type="textarea"
            :rows="8"
            placeholder="请粘贴对应的测试代码"
            class="code-input"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="analyzeCoverage" :loading="loading">
            <el-icon><PieChart /></el-icon> 评估覆盖率
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
          <h3>覆盖率评估结果</h3>
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
        <el-tabs v-model="activeTab">
          <el-tab-pane label="覆盖率报告" name="report">
            <div class="coverage-summary">
              <div class="coverage-metrics">
                <div v-if="coverageMetrics.length > 0" class="metrics-grid">
                  <div v-for="(metric, index) in coverageMetrics" :key="index" class="metric-item">
                    <el-progress 
                      type="dashboard" 
                      :percentage="metric.value" 
                      :color="getCoverageColor(metric.value)"
                      :stroke-width="10"
                    >
                      <template #default="{ percentage }">
                        <div class="metric-content">
                          <div class="metric-name">{{ metric.name }}</div>
                          <div class="metric-value">{{ percentage }}%</div>
                        </div>
                      </template>
                    </el-progress>
                  </div>
                </div>
                
                <div v-else class="no-metrics">
                  <el-alert
                    title="未检测到具体覆盖率指标"
                    type="info"
                    description="覆盖率报告中没有包含可视化的覆盖率指标数据，请查看详细报告了解更多信息。"
                    show-icon
                    :closable="false"
                  />
                </div>
              </div>
              
              <div class="coverage-details">
                <h4>详细报告</h4>
                <div class="markdown-content" v-html="formattedCoverageReport"></div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="改进建议" name="suggestions">
            <div class="suggestions-content">
              <div class="markdown-content" v-html="formattedSuggestions"></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PieChart, Back, Refresh, Connection, DocumentCopy, Download } from '@element-plus/icons-vue'
import api from '@/api'
import * as marked from 'marked'

export default {
  name: 'TestCoverage',
  components: {
    PieChart,
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
    const activeTab = ref('report')
    
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
      sourceCode: '',
      testCode: ''
    })
    
    // 表单验证规则
    const rules = {
      language: [
        { required: true, message: '请选择编程语言', trigger: 'change' }
      ],
      sourceCode: [
        { required: true, message: '请输入源代码', trigger: 'blur' },
        { min: 10, message: '源代码太短，无法进行有效分析', trigger: 'blur' }
      ],
      testCode: [
        { required: true, message: '请输入测试代码', trigger: 'blur' },
        { min: 10, message: '测试代码太短，无法进行有效分析', trigger: 'blur' }
      ]
    }
    
    // 从覆盖率报告中提取覆盖率指标
    const coverageMetrics = computed(() => {
      if (!result.value || !result.value.coverage_report || !result.value.coverage_report.coverage_metrics) {
        return []
      }
      
      const metrics = []
      const metricsData = result.value.coverage_report.coverage_metrics
      
      // 定义指标名称的映射
      const metricNames = {
        statement_coverage: '语句覆盖率',
        branch_coverage: '分支覆盖率',
        condition_coverage: '条件覆盖率',
        decision_coverage: '判定覆盖率',
        path_coverage: '路径覆盖率',
        function_coverage: '函数覆盖率'
      }
      
      // 遍历所有指标
      Object.entries(metricsData).forEach(([key, value]) => {
        if (value) {
          // 尝试从值中提取百分比
          let percentage = 0
          
          // 如果值已经是数字，直接使用
          if (!isNaN(parseFloat(value))) {
            percentage = parseFloat(value)
          } 
          // 如果值是百分比字符串，提取数字部分
          else if (typeof value === 'string' && value.includes('%')) {
            const match = value.match(/(\d+(\.\d+)?)%/)
            if (match && match[1]) {
              percentage = parseFloat(match[1])
            }
          }
          
          // 确保百分比在有效范围内
          percentage = Math.min(100, Math.max(0, percentage))
          
          // 添加到指标列表
          metrics.push({
            name: metricNames[key] || key,
            value: percentage,
            rawValue: value
          })
        }
      })
      
      return metrics
    })
    
    // 根据覆盖率值获取颜色
    const getCoverageColor = (value) => {
      if (value >= 80) return '#67C23A' // 绿色
      if (value >= 60) return '#E6A23C' // 橙色
      return '#F56C6C' // 红色
    }
    
    // 格式化覆盖率报告为HTML
    const formattedCoverageReport = computed(() => {
      if (!result.value || !result.value.coverage_report || !result.value.coverage_report.text) {
        return ''
      }
      return formatMarkdown(result.value.coverage_report.text)
    })
    
    // 格式化改进建议为HTML
    const formattedSuggestions = computed(() => {
      if (!result.value || !result.value.suggestions) {
        return ''
      }
      return formatMarkdown(result.value.suggestions)
    })
    
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
        'java': {
          source: `
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
    
    public int power(int base, int exponent) {
        if (exponent < 0) {
            throw new IllegalArgumentException("Exponent cannot be negative");
        }
        
        int result = 1;
        for (int i = 0; i < exponent; i++) {
            result *= base;
        }
        return result;
    }
}`,
          test: `
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CalculatorTest {
    @Test
    public void testAdd() {
        Calculator calculator = new Calculator();
        assertEquals(5, calculator.add(2, 3));
        assertEquals(-1, calculator.add(-4, 3));
        assertEquals(0, calculator.add(0, 0));
    }
    
    @Test
    public void testSubtract() {
        Calculator calculator = new Calculator();
        assertEquals(2, calculator.subtract(5, 3));
        assertEquals(-7, calculator.subtract(-4, 3));
    }
    
    @Test
    public void testMultiply() {
        Calculator calculator = new Calculator();
        assertEquals(15, calculator.multiply(5, 3));
        assertEquals(-15, calculator.multiply(-5, 3));
        assertEquals(0, calculator.multiply(5, 0));
    }
    
    @Test
    public void testDivide() {
        Calculator calculator = new Calculator();
        assertEquals(2.0, calculator.divide(6, 3));
        assertEquals(-2.0, calculator.divide(-6, 3));
        
        // 测试除以零的情况
        assertThrows(ArithmeticException.class, () -> calculator.divide(5, 0));
    }
    
    // 没有测试power方法
}`
        },
        'python': {
          source: `
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
        return a / b
    
    def power(self, base, exponent):
        if exponent < 0:
            raise ValueError("Exponent cannot be negative")
        
        result = 1
        for i in range(exponent):
            result *= base
        return result`,
          test: `
import unittest

class TestCalculator(unittest.TestCase):
    def setUp(self):
        self.calculator = Calculator()
    
    def test_add(self):
        self.assertEqual(5, self.calculator.add(2, 3))
        self.assertEqual(-1, self.calculator.add(-4, 3))
        self.assertEqual(0, self.calculator.add(0, 0))
    
    def test_subtract(self):
        self.assertEqual(2, self.calculator.subtract(5, 3))
        self.assertEqual(-7, self.calculator.subtract(-4, 3))
    
    def test_multiply(self):
        self.assertEqual(15, self.calculator.multiply(5, 3))
        self.assertEqual(-15, self.calculator.multiply(-5, 3))
        self.assertEqual(0, self.calculator.multiply(5, 0))
    
    def test_divide(self):
        self.assertEqual(2.0, self.calculator.divide(6, 3))
        self.assertEqual(-2.0, self.calculator.divide(-6, 3))
        
        # 测试除以零的情况
        with self.assertRaises(ValueError):
            self.calculator.divide(5, 0)
    
    # 没有测试power方法

if __name__ == '__main__':
    unittest.main()`
        },
        'javascript': {
          source: `
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
    
    power(base, exponent) {
        if (exponent < 0) {
            throw new Error("Exponent cannot be negative");
        }
        
        let result = 1;
        for (let i = 0; i < exponent; i++) {
            result *= base;
        }
        return result;
    }
}

module.exports = Calculator;`,
          test: `
const Calculator = require('./Calculator');
const { expect } = require('chai');

describe('Calculator', () => {
    let calculator;
    
    beforeEach(() => {
        calculator = new Calculator();
    });
    
    describe('add', () => {
        it('should add two positive numbers', () => {
            expect(calculator.add(2, 3)).to.equal(5);
        });
        
        it('should handle negative numbers', () => {
            expect(calculator.add(-4, 3)).to.equal(-1);
        });
        
        it('should handle zero', () => {
            expect(calculator.add(0, 0)).to.equal(0);
        });
    });
    
    describe('subtract', () => {
        it('should subtract two positive numbers', () => {
            expect(calculator.subtract(5, 3)).to.equal(2);
        });
        
        it('should handle negative numbers', () => {
            expect(calculator.subtract(-4, 3)).to.equal(-7);
        });
    });
    
    describe('multiply', () => {
        it('should multiply two positive numbers', () => {
            expect(calculator.multiply(5, 3)).to.equal(15);
        });
        
        it('should handle negative numbers', () => {
            expect(calculator.multiply(-5, 3)).to.equal(-15);
        });
        
        it('should handle zero', () => {
            expect(calculator.multiply(5, 0)).to.equal(0);
        });
    });
    
    describe('divide', () => {
        it('should divide two positive numbers', () => {
            expect(calculator.divide(6, 3)).to.equal(2);
        });
        
        it('should handle negative numbers', () => {
            expect(calculator.divide(-6, 3)).to.equal(-2);
        });
        
        it('should throw error when dividing by zero', () => {
            expect(() => calculator.divide(5, 0)).to.throw('Division by zero');
        });
    });
    
    // 没有测试power方法
});`
        }
      }
      
      const example = examples[form.language]
      if (example) {
        form.sourceCode = example.source
        form.testCode = example.test
        ElMessage.success('已加载示例代码')
      } else {
        ElMessage.warning(`暂无${form.language}语言的示例代码`)
      }
    }
    
    // 分析覆盖率
    const analyzeCoverage = async () => {
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
        formData.append('code', form.sourceCode)
        formData.append('tests', form.testCode)
        formData.append('language', form.language)
        
        // 调用后端API
        const response = await api.test.evaluateTestCoverage(formData)
        
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
          
          // 设置结果，使用新的数据结构
          result.value = {
            coverage_report: {
              coverage_metrics: resultData.coverage_report?.coverage_metrics || {},
              text: resultData.coverage_report?.text || ''
            },
            suggestions: resultData.suggestions || ''
          }
          
          activeTab.value = 'report'
          ElMessage.success('覆盖率评估完成')
        } else {
          ElMessage.error(response?.message || '覆盖率评估失败，请稍后重试')
        }
      } catch (error) {
        console.error('覆盖率评估出错:', error)
        ElMessage.error('覆盖率评估失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }
    
    // 复制结果
    const copyResult = () => {
      if (!result.value) {
        ElMessage.warning('没有可复制的评估结果')
        return
      }
      
      // 根据当前激活的选项卡决定复制内容
      let content = ''
      if (activeTab.value === 'report') {
        // 创建覆盖率报告的文本内容
        const metricsText = coverageMetrics.value
          .map(m => `${m.name}: ${m.rawValue || m.value + '%'}`)
          .join('\n')
        
        content = `覆盖率指标:\n${metricsText}\n\n详细报告:\n${result.value.coverage_report?.text || ''}`
      } else {
        content = result.value.suggestions || ''
      }
      
      navigator.clipboard.writeText(content)
        .then(() => {
          ElMessage.success('已复制到剪贴板')
        })
        .catch(() => {
          ElMessage.error('复制失败，请手动复制')
        })
    }
    
    // 下载结果
    const downloadResult = () => {
      if (!result.value) {
        ElMessage.warning('没有可下载的评估结果')
        return
      }
      
      // 创建格式化的文本内容
      const metricsText = coverageMetrics.value
        .map(m => `- ${m.name}: ${m.rawValue || m.value + '%'}`)
        .join('\n')
      
      const content = [
        `# 测试覆盖率评估报告\n`,
        `## 覆盖率指标\n`,
        metricsText,
        `\n## 详细报告\n`,
        result.value.coverage_report?.text || '',
        `\n## 改进建议\n`,
        result.value.suggestions || ''
      ].join('\n')
      
      // 创建一个Blob对象
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      
      // 创建一个临时链接并触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = `测试覆盖率报告_${form.language}_${new Date().toISOString().slice(0, 10)}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      ElMessage.success('评估结果已下载')
    }
    
    return {
      formRef,
      form,
      rules,
      loading,
      result,
      activeTab,
      languages,
      coverageMetrics,
      formattedCoverageReport,
      formattedSuggestions,
      navigateTo,
      resetForm,
      useExample,
      analyzeCoverage,
      copyResult,
      downloadResult,
      getCoverageColor
    }
  }
}
</script>

<style scoped>
.test-coverage-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.coverage-header {
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

.coverage-summary {
  margin-bottom: 30px;
}

.coverage-metrics {
  margin-bottom: 30px;
}

.metrics-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
}

.metric-item {
  text-align: center;
}

.metric-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-name {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 5px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
}

.no-metrics {
  max-width: 600px;
  margin: 0 auto;
}

.coverage-details h4,
.suggestions-content h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

/* Markdown 内容的样式 */
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