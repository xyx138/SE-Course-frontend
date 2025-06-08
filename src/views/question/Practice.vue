<template>
  <div class="practice-container">
    <div class="page-header">
      <h1 class="page-title">练习题生成</h1>
      <el-button @click="goBack" type="default" size="small">返回 <el-icon><ArrowRight /></el-icon></el-button>
    </div>
    
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h3>生成个性化练习题</h3>
        </div>
      </template>
      
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="知识点" prop="topics">
          <el-select
            v-model="form.topics"
            placeholder="选择知识点"
            filterable
            multiple
            class="w-100"
          >
            <el-option-group
              v-for="group in topicOptions"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="item in group.options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        
        <el-form-item label="题目数量" prop="count">
          <el-input-number
            v-model="form.count"
            :min="1"
            :max="10"
            class="w-100"
          />
        </el-form-item>
        
        <el-form-item label="难度级别" prop="difficulty">
          <el-rate
            v-model="form.difficulty"
            :texts="difficultyTexts"
            show-text
          />
        </el-form-item>
        
        <el-form-item label="题目类型" prop="questionType">
          <el-radio-group v-model="form.questionType">
            <el-radio label="MULTIPLE_CHOICE">选择题</el-radio>
            <el-radio label="FILL_IN_THE_BLANK">填空题</el-radio>
            <el-radio label="SHORT_ANSWER">简答题</el-radio>
            <el-radio label="TRUE_OR_FALSE">判断题</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="generateQuestions" :loading="loading">生成练习题</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card v-if="questions.length > 0" class="questions-card mt-20">
      <template #header>
        <div class="card-header">
          <h3>生成的练习题</h3>
          <div>
            <!-- 暂时禁用下载功能 -->
            <!-- <el-dropdown @command="downloadQuestions">
              <el-button type="primary" plain size="small">
                下载
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pdf">PDF格式</el-dropdown-item>
                  <el-dropdown-item command="docx">Word格式</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown> -->
            <el-button type="info" plain size="small" @click="printQuestions">打印</el-button>
          </div>
        </div>
      </template>
      
      <div class="questions-list">
        <div v-for="(question, index) in questions" :key="index" class="question-item">
          <div class="question-header">
            <h4>{{ index + 1 }}. {{ question.title }}</h4>
            <el-tag size="small" :type="getQuestionTypeTag(question.type)">{{ getQuestionTypeText(question.type) }}</el-tag>
          </div>
          
          <div class="question-content" v-html="question.content"></div>
          
          <el-collapse v-if="question.type !== 'CASE'">
            <el-collapse-item title="查看答案">
              <div class="question-answer" v-html="question.answer"></div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-card>
    
    <el-card class="history-card mt-20">
      <template #header>
        <div class="card-header">
          <h3>历史生成记录</h3>
          <el-button type="danger" plain size="small" @click="clearAllHistory">清空历史</el-button>
        </div>
      </template>
      
      <el-empty v-if="history.length === 0" description="暂无历史记录" />
      
      <el-table v-else :data="history" stripe style="width: 100%">
        <el-table-column prop="date" label="生成时间" width="180" />
        <el-table-column prop="topic" label="知识点" />
        <el-table-column prop="count" label="题目数量" width="100" />
        <el-table-column prop="difficulty" label="难度级别" width="100">
          <template #default="scope">
            <el-rate
              v-model="scope.row.difficulty"
              disabled
              show-score
              text-color="#ff9900"
            />
          </template>
        </el-table-column>
        <el-table-column label="题目类型" width="100">
          <template #default="scope">
            {{ getQuestionTypeText(scope.row.questionType) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
              size="small"
              @click="loadHistoryQuestions(scope.row)"
            >
              查看
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteHistory(scope.$index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 历史练习题对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="历史练习题"
      width="80%"
      :before-close="handleCloseDialog"
    >
      <div v-if="historyQuestions.length > 0" class="questions-list">
        <div v-for="(question, index) in historyQuestions" :key="index" class="question-item">
          <div class="question-header">
            <h4>{{ index + 1 }}. {{ question.title }}</h4>
            <el-tag size="small" :type="getQuestionTypeTag(question.type)">{{ getQuestionTypeText(question.type) }}</el-tag>
          </div>
          
          <div class="question-content" v-html="question.content"></div>
          
          <el-collapse v-if="question.type !== 'CASE'">
            <el-collapse-item title="查看答案">
              <div class="question-answer" v-html="question.answer"></div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      <div v-else class="empty-history">
        <el-empty description="无法加载练习题数据" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <!-- 暂时禁用下载功能 -->
          <!-- <el-dropdown @command="downloadHistoryQuestions">
            <el-button type="primary">
              下载
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="pdf">PDF格式</el-dropdown-item>
                <el-dropdown-item command="docx">Word格式</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->
          <el-button @click="printHistoryQuestions">打印</el-button>
          <el-button @click="historyDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加全屏加载动画 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <el-progress type="circle" :percentage="loadingPercentage" :status="loadingStatus"></el-progress>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

export default {
  name: 'PracticePage',
  components: {
    ArrowDown,
    ArrowRight
  },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const questions = ref([])
    
    // 表单数据
    const form = reactive({
      topics: [],
      count: 5,
      difficulty: 3,
      questionType: 'MULTIPLE_CHOICE'
    })
    
    // 表单验证规则
    const rules = {
      topics: [
        { required: true, message: '请选择知识点', trigger: 'change' }
      ],
      count: [
        { required: true, message: '请选择题目数量', trigger: 'change' }
      ],
      questionType: [
        { required: true, message: '请选择题目类型', trigger: 'change' }
      ]
    }
    
    // 难度等级文本
    const difficultyTexts = ['入门', '基础', '中等', '进阶', '挑战']
    
    // 知识点选项
    const topicOptions = [
      {
        label: '软件过程',
        options: [
          { value: 'waterfall', label: '瀑布模型' },
          { value: 'agile', label: '敏捷开发' },
          { value: 'spiral', label: '螺旋模型' },
          { value: 'tdd', label: '测试驱动开发' }
        ]
      },
      {
        label: '软件设计',
        options: [
          { value: 'oo_design', label: '面向对象设计' },
          { value: 'design_patterns', label: '设计模式' },
          { value: 'architecture', label: '软件架构' },
          { value: 'uml', label: 'UML建模' }
        ]
      },
      {
        label: '软件测试',
        options: [
          { value: 'unit_testing', label: '单元测试' },
          { value: 'integration_testing', label: '集成测试' },
          { value: 'system_testing', label: '系统测试' },
          { value: 'performance_testing', label: '性能测试' }
        ]
      }
    ]
    
    // 历史记录
    const history = ref([])
    
    // 新增的变量
    const loadingPercentage = ref(0)
    const loadingStatus = ref('')
    const loadingText = ref('正在准备生成练习题...')
    
    // 添加一个模拟进度的函数
    const simulateLoadingProgress = () => {
      loadingPercentage.value = 0
      loadingStatus.value = ''
      loadingText.value = '正在准备生成练习题...'
      
      // 使用计时器模拟加载进度
      const interval = setInterval(() => {
        if (loadingPercentage.value < 90) {
          // 随机增加进度，但不超过90%
          loadingPercentage.value += Math.floor(Math.random() * 10) + 1
          
          // 根据进度更新文本
          if (loadingPercentage.value < 30) {
            loadingText.value = '正在分析知识点...'
          } else if (loadingPercentage.value < 60) {
            loadingText.value = '正在生成题目内容...'
          } else {
            loadingText.value = '正在优化题目难度...'
          }
        }
      }, 800) // 每800毫秒更新一次
      
      // 返回计时器ID，以便后续清除
      return interval
    }
    
    // 生成练习题
    const generateQuestions = () => {
      formRef.value.validate(async (valid) => {
        if (valid) {
          if (form.topics.length === 0) {
            ElMessage.warning('请至少选择一个知识点')
            return
          }
          
          // 开始加载
          loading.value = true
          const progressInterval = simulateLoadingProgress()
          
          try {
            const formData = new FormData()
            formData.append('topics', form.topics.join(','))
            formData.append('num_questions', form.count)
            
            // 将难度等级转换为后端期望的格式
            let difficultyValue = '中等' // 默认中等难度
            if (form.difficulty === 1) difficultyValue = '简单'
            else if (form.difficulty === 5) difficultyValue = '困难'
            formData.append('difficulty', difficultyValue)
            
            // 题目类型转换为中文
            let typeValue = '选择题' // 默认选择题
            if (form.questionType === 'MULTIPLE_CHOICE') typeValue = '选择题'
            else if (form.questionType === 'FILL_IN_THE_BLANK') typeValue = '填空题'
            else if (form.questionType === 'SHORT_ANSWER') typeValue = '简答题'
            else if (form.questionType === 'TRUE_OR_FALSE') typeValue = '判断题'
            formData.append('type', typeValue)
            
            // 调用API
            const response = await import('@/api').then(module => {
              return module.default.question.generatePractice(formData)
            })
            
            // 清除进度模拟计时器
            clearInterval(progressInterval)
            
            // 设置进度为100%并显示成功状态
            loadingPercentage.value = 100
            loadingStatus.value = 'success'
            loadingText.value = '练习题生成成功！'
            
            // 延迟关闭加载动画，让用户看到成功状态
            setTimeout(() => {
              loading.value = false
            }, 500)
            
            if (response && response.status === 'success') {
              // 解析message字段中的JSON字符串
              let parsedData = {}
              try {
                // 尝试解析message字段中的JSON字符串
                parsedData = JSON.parse(response.message)
              } catch (error) {
                console.error('解析响应数据出错:', error)
                ElMessage.error('解析响应数据出错，请稍后重试')
                loading.value = false
                return
              }
              
              // 从解析后的数据中提取题目数据
              const questionsData = parsedData.questions || []
              
              // 转换为前端需要的格式
              questions.value = questionsData.map((item, index) => ({
                id: item.id || (index + 1),
                type: item.type || 'SHORT_ANSWER',
                title: item.question || '未提供题目',
                content: `<p>${item.question || '未提供题目'}</p>${item.options ? 
                  item.options.map((opt, i) => `<p>${opt}</p>`).join('') : ''}`,
                answer: `<p>${item.reference_answer || '未提供答案'}</p><p>解析: ${item.analysis || '未提供解析'}</p>`
              }))
              
              // 添加到历史记录
              const topicLabels = form.topics.map(value => topicOptions
                .flatMap(group => group.options)
                .find(option => option.value === value)?.label)
              
              const historyItem = {
                id: Date.now(),
                date: new Date().toLocaleString(),
                topic: topicLabels.join(', ') || form.topics.join(', '),
                count: form.count,
                difficulty: form.difficulty,
                questionType: form.questionType
              }
              
              history.value.unshift(historyItem)
              
              // 保存到后端 - 传递解析后的题目数据
              savePracticeHistory(historyItem, questionsData)
              
              ElMessage.success('练习题生成成功')
              
              // 滚动到题目区域
              setTimeout(() => {
                const questionsCard = document.querySelector('.questions-card')
                if (questionsCard) {
                  questionsCard.scrollIntoView({ behavior: 'smooth' })
                }
              }, 100)
            } else {
              ElMessage.error(response?.message || '生成练习题失败，请稍后重试')
            }
          } catch (error) {
            // 清除进度模拟计时器
            clearInterval(progressInterval)
            
            // 设置进度为100%并显示失败状态
            loadingPercentage.value = 100
            loadingStatus.value = 'exception'
            loadingText.value = '生成练习题失败，请稍后重试'
            
            // 延迟关闭加载动画，让用户看到失败状态
            setTimeout(() => {
              loading.value = false
            }, 1000)
            
            console.error('生成练习题出错:', error)
            ElMessage.error('生成练习题失败，请稍后重试')
          }
        }
      })
    }
    
    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      form.topics = []
      form.count = 5
      form.difficulty = 3
      form.questionType = 'MULTIPLE_CHOICE'
    }
    
    // 获取题目类型标签类型
    const getQuestionTypeTag = (type) => {
      const types = {
        'MULTIPLE_CHOICE': '',
        'FILL_IN_THE_BLANK': 'info',
        'SHORT_ANSWER': 'warning',
        'TRUE_OR_FALSE': 'danger'
      }
      return types[type] || ''
    }
    
    // 获取题目类型文本
    const getQuestionTypeText = (type) => {
      const types = {
        'MULTIPLE_CHOICE': '选择题',
        'FILL_IN_THE_BLANK': '填空题',
        'SHORT_ANSWER': '简答题',
        'TRUE_OR_FALSE': '判断题'
      }
      return types[type] || type
    }
    
    // 保存练习题历史记录
    const savePracticeHistory = async (historyItem, questionsData) => {
      try {
        console.log('保存历史记录，原始题目数据:', questionsData)
        
        const formData = new FormData()
        formData.append('topics', form.topics.join(','))
        formData.append('count', form.count)
        
        // 将难度等级转换为后端期望的格式
        let difficultyValue = '中等' // 默认中等难度
        if (form.difficulty === 1) difficultyValue = '简单'
        else if (form.difficulty === 5) difficultyValue = '困难'
        formData.append('difficulty', difficultyValue)
        
        // 题目类型转换为中文
        let typeValue = '选择题' // 默认选择题
        if (form.questionType === 'MULTIPLE_CHOICE') typeValue = '选择题'
        else if (form.questionType === 'FILL_IN_THE_BLANK') typeValue = '填空题'
        else if (form.questionType === 'SHORT_ANSWER') typeValue = '简答题'
        else if (form.questionType === 'TRUE_OR_FALSE') typeValue = '判断题'
        formData.append('type', typeValue)
        
        // 确保questionsData是数组
        const questionsToSave = Array.isArray(questionsData) ? questionsData : []
        
        // 将问题数据转换为JSON字符串
        const questionsJson = JSON.stringify(questionsToSave)
        formData.append('questions', questionsJson)
        
        console.log('发送到后端的题目数据:', questionsJson)
        
        const response = await import('@/api').then(module => {
          return module.default.question.savePracticeHistory(formData)
        })
        
        console.log('保存历史记录响应:', response)
        
        if (response && response.status === 'success') {
          // 更新本地历史记录的ID为后端返回的ID
          const index = history.value.findIndex(item => item.id === historyItem.id)
          if (index !== -1 && response.id) {
            history.value[index].id = response.id
          }
        } else {
          console.error('保存历史记录失败:', response?.message)
        }
      } catch (error) {
        console.error('保存历史记录出错:', error)
      }
    }
    
    // 加载历史练习题记录
    const loadHistoryData = async () => {
      try {
        const response = await import('@/api').then(module => {
          return module.default.question.getPracticeHistory()
        })
        
        console.log('历史记录API响应:', response)
        
        if (response && response.status === 'success' && Array.isArray(response.history)) {
          console.log('原始历史数据:', response.history)
          
          history.value = response.history.map(item => {
            console.log('处理历史项:', item)
            return {
              id: item.id, // 确保使用后端返回的ID
              date: new Date(item.date).toLocaleString(),
              topic: Array.isArray(item.topics) ? item.topics.join(', ') : item.topics,
              count: item.count,
              difficulty: item.difficulty === '简单' ? 1 : (item.difficulty === '困难' ? 5 : 3),
              questionType: item.type === '选择题' ? 'MULTIPLE_CHOICE' : 
                          (item.type === '填空题' ? 'FILL_IN_THE_BLANK' : 
                          (item.type === '判断题' ? 'TRUE_OR_FALSE' : 'SHORT_ANSWER'))
            }
          })
          
          console.log('处理后的历史数据:', history.value)
        } else {
          console.error('获取历史记录失败:', response)
        }
      } catch (error) {
        console.error('加载历史记录出错:', error)
        ElMessage.error('加载历史记录失败，请稍后重试')
      }
    }
    
    // 页面加载时获取历史记录
    onMounted(() => {
      loadHistoryData()
    })
    
    // 打印练习题
    const printQuestions = () => {
      window.print()
    }
    
    // 下载练习题
    const downloadQuestions = async (format = 'pdf') => {
      // 暂时禁用下载功能
      ElMessage.info('下载功能暂未开放，将在后续版本中提供')
      return
      
      /* 原有代码暂时注释
      if (questions.value.length === 0) {
        ElMessage.warning('请先生成练习题')
        return
      }
      
      try {
        const formData = new FormData()
        formData.append('practice_set', JSON.stringify({
          questions: questions.value.map(q => ({
            id: q.id,
            type: q.type,
            question: q.title,
            options: q.content.match(/<p>[A-D]\. (.+?)<\/p>/g)?.map(opt => opt.replace(/<\/?p>/g, '').replace(/^[A-D]\. /, '')) || [],
            reference_answer: q.answer.replace(/<\/?p>/g, '').replace(/解析:.+$/, '').trim(),
            analysis: q.answer.match(/解析: (.+)$/)?.[1] || ''
          })),
          total_points: questions.value.length * 100 / questions.value.length,
          estimated_time: `${questions.value.length * 5}分钟`,
          difficulty_distribution: {
            easy: form.difficulty === 1 ? questions.value.length : 0,
            medium: form.difficulty === 3 ? questions.value.length : 0,
            hard: form.difficulty === 5 ? questions.value.length : 0
          }
        }))
        formData.append('format', format)
        
        const response = await import('@/api').then(module => {
          return module.default.question.downloadPracticeSet(formData)
        })
        
        // 处理二进制响应
        const blob = new Blob([response], { 
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `练习题_${new Date().toLocaleDateString()}.${format}`
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
        
        ElMessage.success(`练习题已下载为${format.toUpperCase()}格式`)
      } catch (error) {
        console.error('下载练习题出错:', error)
        ElMessage.error('下载练习题失败，请稍后重试')
      }
      */
    }
    
    // 加载历史练习题
    const loadHistoryQuestions = async (historyItem) => {
      try {
        console.log('加载历史记录项:', historyItem)
        
        const response = await import('@/api').then(module => {
          return module.default.question.getPracticeHistoryItem(historyItem.id)
        })
        
        console.log('历史记录API响应:', response)
        
        if (response && response.status === 'success' && response.data) {
          const historyData = response.data
          console.log('历史数据:', historyData)
          
          // 加载题目数据
          if (Array.isArray(historyData.questions)) {
            console.log('题目数据:', historyData.questions)
            historyQuestions.value = historyData.questions.map((item, index) => ({
              id: item.id || (index + 1),
              type: item.type || historyItem.questionType,
              title: item.question || item.title || '未提供题目',
              content: `<p>${item.question || item.title || '未提供题目'}</p>${item.options ? 
                item.options.map((opt, i) => `<p>${String.fromCharCode(65 + i)}. ${opt}</p>`).join('') : ''}`,
              answer: `<p>${item.reference_answer || '未提供答案'}</p><p>解析: ${item.analysis || '未提供解析'}</p>`
            }))
            
            // 显示对话框
            historyDialogVisible.value = true
            
            ElMessage.success('历史练习题加载成功')
          } else {
            ElMessage.warning('历史练习题数据格式不正确')
            console.error('题目数据格式不正确:', historyData.questions)
          }
        } else {
          ElMessage.error(response?.message || '加载历史练习题失败')
          console.error('API响应错误:', response)
        }
      } catch (error) {
        console.error('加载历史练习题出错:', error)
        ElMessage.error('加载历史练习题失败，请稍后重试')
      }
    }
    
    // 删除历史记录
    const deleteHistory = async (index) => {
      try {
        const itemId = history.value[index].id
        console.log('删除历史记录项:', itemId, history.value[index])
        
        const response = await import('@/api').then(module => {
          return module.default.question.deletePracticeHistory(itemId)
        })
        
        console.log('删除历史记录响应:', response)
        
        if (response && response.status === 'success') {
          history.value.splice(index, 1)
          ElMessage.success('历史记录已删除')
        } else {
          ElMessage.error(response?.message || '删除历史记录失败')
          console.error('删除历史记录失败:', response)
        }
      } catch (error) {
        console.error('删除历史记录出错:', error)
        ElMessage.error('删除历史记录失败，请稍后重试')
      }
    }
    
    // 清空所有历史记录
    const clearAllHistory = async () => {
      try {
        const response = await import('@/api').then(module => {
          return module.default.question.clearPracticeHistory()
        })
        
        if (response && response.status === 'success') {
          history.value = []
          ElMessage.success('所有历史记录已清空')
        } else {
          ElMessage.error(response?.message || '清空历史记录失败')
        }
      } catch (error) {
        console.error('清空历史记录出错:', error)
        ElMessage.error('清空历史记录失败，请稍后重试')
      }
    }
    
    // 历史练习题对话框相关
    const historyDialogVisible = ref(false)
    const historyQuestions = ref([])
    
    const handleCloseDialog = () => {
      historyDialogVisible.value = false
      historyQuestions.value = []
    }
    
    const downloadHistoryQuestions = async (format = 'pdf') => {
      // 暂时禁用下载功能
      ElMessage.info('下载功能暂未开放，将在后续版本中提供')
      return
      
      /* 原有代码暂时注释
      if (historyQuestions.value.length === 0) {
        ElMessage.warning('请先生成历史练习题')
        return
      }
      
      try {
        const formData = new FormData()
        formData.append('practice_set', JSON.stringify({
          questions: historyQuestions.value.map(q => ({
            id: q.id,
            type: q.type,
            question: q.title,
            options: q.content.match(/<p>[A-D]\. (.+?)<\/p>/g)?.map(opt => opt.replace(/<\/?p>/g, '').replace(/^[A-D]\. /, '')) || [],
            reference_answer: q.answer.replace(/<\/?p>/g, '').replace(/解析:.+$/, '').trim(),
            analysis: q.answer.match(/解析: (.+)$/)?.[1] || ''
          })),
          total_points: historyQuestions.value.length * 100 / historyQuestions.value.length,
          estimated_time: `${historyQuestions.value.length * 5}分钟`,
          difficulty_distribution: {
            easy: form.difficulty === 1 ? historyQuestions.value.length : 0,
            medium: form.difficulty === 3 ? historyQuestions.value.length : 0,
            hard: form.difficulty === 5 ? historyQuestions.value.length : 0
          }
        }))
        formData.append('format', format)
        
        const response = await import('@/api').then(module => {
          return module.default.question.downloadPracticeSet(formData)
        })
        
        // 处理二进制响应
        const blob = new Blob([response], { 
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `历史练习题_${new Date().toLocaleDateString()}.${format}`
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
        
        ElMessage.success(`历史练习题已下载为${format.toUpperCase()}格式`)
      } catch (error) {
        console.error('下载历史练习题出错:', error)
        ElMessage.error('下载历史练习题失败，请稍后重试')
      }
      */
    }
    
    const printHistoryQuestions = () => {
      window.print()
    }
    
    // 添加返回函数
    const goBack = () => {
      router.push('/question')
    }
    
    return {
      formRef,
      form,
      rules,
      loading,
      questions,
      history,
      difficultyTexts,
      topicOptions,
      generateQuestions,
      resetForm,
      getQuestionTypeTag,
      getQuestionTypeText,
      printQuestions,
      downloadQuestions,
      loadHistoryQuestions,
      deleteHistory,
      clearAllHistory,
      historyDialogVisible,
      historyQuestions,
      handleCloseDialog,
      downloadHistoryQuestions,
      printHistoryQuestions,
      loadingPercentage,
      loadingStatus,
      loadingText,
      goBack
    }
  }
}
</script>

<style scoped>
.practice-container {
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

.form-card, .questions-card, .history-card {
  border-radius: 8px;
  margin-bottom: 20px;
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

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  transition: box-shadow 0.3s;
}

.question-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.question-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.question-content {
  margin-bottom: 15px;
  color: var(--text-color);
}

.question-answer {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: var(--text-color-secondary);
}

.mt-20 {
  margin-top: 20px;
}

.w-100 {
  width: 100%;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-history {
  padding: 40px 0;
  text-align: center;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

:deep(.el-dialog__body) {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

@media print {
  .form-card, .history-card, .card-header button, .dialog-footer {
    display: none;
  }
  
  .questions-card, :deep(.el-dialog__body) {
    box-shadow: none;
    border: none;
  }
  
  .page-title, :deep(.el-dialog__header) {
    text-align: center;
  }
  
  :deep(.el-dialog__header), :deep(.el-dialog__footer) {
    display: none;
  }
}

/* 添加加载动画样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(3px);
}

.loading-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 80%;
}

.loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #606266;
}
</style> 