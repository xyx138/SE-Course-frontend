<template>
  <div class="uml-container">
    <h1 class="page-title">UML图生成</h1>
    
    <el-card class="tool-card">
      <template #header>
        <div class="card-header">
          <h3>输入描述，生成UML图</h3>
        </div>
      </template>
      
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="图表类型" prop="diagramType">
          <el-select v-model="form.diagramType" placeholder="请选择UML图类型" class="w-100">
            <el-option 
              v-for="item in diagramTypes" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="系统描述" prop="description">
          <el-input 
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="请输入系统描述或设计要求，我将为您生成相应的UML图"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="generateUML" :loading="loading">生成UML图</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div class="examples-section">
        <h4>示例描述：</h4>
        <div class="example-chips">
          <el-tag
            v-for="(example, index) in exampleDescriptions[form.diagramType]"
            :key="index"
            class="example-chip"
            @click="useExample(example)"
          >
            {{ example.title }}
          </el-tag>
        </div>
      </div>
    </el-card>
    
    <el-card v-if="result" class="result-card mt-20">
      <template #header>
        <div class="card-header">
          <h3>生成结果</h3>
          <el-button-group>
            <el-button size="small" @click="downloadImage" :disabled="!result.imageUrl">
              <el-icon><Download /></el-icon> 下载图片
            </el-button>
            <el-button size="small" @click="copyCode" :disabled="!result.plantUmlCode">
              <el-icon><DocumentCopy /></el-icon> 复制代码
            </el-button>
            <el-button size="small" @click="showFullImage" :disabled="!result.imageUrl || imageLoadError">
              <el-icon><ZoomIn /></el-icon> 放大查看
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <div class="result-content">
        <div class="diagram-container">
          <img 
            v-if="result.imageUrl" 
            :src="result.imageUrl" 
            class="diagram-image" 
            alt="UML图" 
            @load="imageLoaded = true"
            @error="handleImageError"
            v-show="imageLoaded"
          />
          <div v-if="result.imageUrl && !imageLoaded" class="image-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>图片加载中...</p>
          </div>
          <div v-if="!result.imageUrl || imageLoadError" class="diagram-placeholder">
            <el-empty description="图片加载失败">
              <template #extra>
                <el-button type="primary" @click="retryLoadImage" v-if="result && result.imageUrl">重试加载</el-button>
              </template>
            </el-empty>
          </div>
        </div>
        
        <div class="explanation mt-20">
          <h4>UML图解释</h4>
          <div v-html="renderedExplanation" class="markdown-content"></div>
        </div>
        
        <div v-if="result.plantUmlCode" class="code-section mt-20">
          <h4>PlantUML 代码</h4>
          <pre class="code-block">{{ result.plantUmlCode }}</pre>
        </div>
      </div>
    </el-card>
    
    <!-- 加载中提示 -->
    <div v-if="loading" class="loading-overlay">
      <el-card class="loading-card">
        <div class="loading-content">
          <el-icon class="loading-icon is-loading"><Loading /></el-icon>
          <h3>正在生成UML图...</h3>
          <p>{{ loadingMessage }}</p>
        </div>
      </el-card>
    </div>
    
    <!-- 图片全屏查看对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="UML图详情"
      width="90%"
      :fullscreen="isMobile"
      :before-close="handleDialogClose"
    >
      <div class="fullscreen-image-container">
        <img 
          v-if="result && result.imageUrl" 
          :src="result.imageUrl" 
          class="fullscreen-image" 
          alt="UML图全屏查看" 
        />
      </div>
      
      <div class="fullscreen-explanation mt-20">
        <h4>UML图解释</h4>
        <div v-html="renderedExplanation" class="markdown-content"></div>
      </div>
      
      <div class="dialog-footer">
        <el-button @click="handleDialogClose">关闭</el-button>
        <el-button type="primary" @click="downloadImage">下载图片</el-button>
      </div>
    </el-dialog>
    
    <el-card class="tips-card mt-20">
      <template #header>
        <div class="card-header">
          <h3>使用提示</h3>
        </div>
      </template>
      
      <div class="tips-content">
        <h4>如何获得更好的UML图？</h4>
        <ul>
          <li>清晰描述系统的主要实体/类及其关系</li>
          <li>说明系统的主要功能和交互流程</li>
          <li>指定具体的属性和方法名称，以获得更准确的图表</li>
          <li>可以提供示例代码片段作为参考</li>
        </ul>
        
        <el-divider />
        
        <h4>UML图类型说明</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="type in diagramTypes" :key="type.value" :label="type.label">
            {{ type.description }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script>
import { reactive, ref, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, DocumentCopy, Loading, ZoomIn } from '@element-plus/icons-vue'
import api from '@/api'
import MarkdownIt from 'markdown-it'


export default {
  name: 'UmlIndexView',
  components: {
    Download,
    DocumentCopy,
    Loading,
    ZoomIn
  },
  setup() {
    const formRef = ref(null)
    const loading = ref(false)
    const result = ref(null)
    const imageLoaded = ref(false)
    const imageLoadError = ref(false)
    const loadingMessage = ref('请稍候，这可能需要几秒钟时间')
    const dialogVisible = ref(false)
    const isMobile = ref(false)
    
    // 检测设备是否为移动设备
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })
    
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 768
    }
    
    const diagramTypes = [
      {
        label: '类图 (Class Diagram)',
        value: 'class',
        description: '展示系统中的类、属性、方法以及它们之间的关系'
      },
      {
        label: '序列图 (Sequence Diagram)',
        value: 'sequence',
        description: '展示对象之间的交互，按时间顺序排列'
      },
      {
        label: '活动图 (Activity Diagram)',
        value: 'activity',
        description: '展示工作流程或业务流程'
      },
      {
        label: '用例图 (Use Case Diagram)',
        value: 'usecase',
        description: '展示系统功能及其与外部参与者的关系'
      },
      {
        label: '状态图 (State Diagram)',
        value: 'state',
        description: '展示对象在其生命周期内的不同状态'
      },
      {
        label: '组件图 (Component Diagram)',
        value: 'component',
        description: '展示系统的组件及其依赖关系'
      },
      {
        label: '部署图 (Deployment Diagram)',
        value: 'deployment',
        description: '展示系统的物理架构'
      },
      {
        label: '对象图 (Object Diagram)',
        value: 'object',
        description: '展示系统在特定时刻的对象实例及其关系'
      }
    ]
    
    const form = reactive({
      diagramType: 'class',
      description: ''
    })
    
    const rules = {
      diagramType: [
        { required: true, message: '请选择UML图类型', trigger: 'change' }
      ],
      description: [
        { required: true, message: '请输入系统描述', trigger: 'blur' },
        { min: 10, message: '描述至少需要10个字符', trigger: 'blur' }
      ]
    }
    
    // 示例描述
    const exampleDescriptions = {
      'class': [
        {
          title: '图书管理系统',
          description: '设计一个图书管理系统，包含图书、用户、借阅记录等实体。图书有书名、作者、ISBN、出版日期等属性，用户有姓名、ID、联系方式等属性，借阅记录关联用户和图书，并记录借阅日期和归还日期。'
        },
        {
          title: '电子商务平台',
          description: '设计一个电子商务平台的核心类，包括用户、商品、订单、购物车等。用户可以浏览商品、将商品加入购物车、下订单。订单包含多个商品项，记录购买数量和价格。'
        },
        {
          title: '学生管理系统',
          description: '设计一个学生管理系统，包含学生、课程、教师、成绩等实体。学生可以选修多门课程，每门课程可以有多名学生选修，教师可以教授多门课程，成绩关联学生和课程。'
        }
      ],
      'sequence': [
        {
          title: '用户登录流程',
          description: '描述用户登录系统的交互流程：用户输入用户名密码，前端发送请求到认证服务，认证服务验证用户凭据，如果有效则生成令牌返回给前端，前端存储令牌并跳转到主页。'
        },
        {
          title: '订单支付流程',
          description: '描述用户支付订单的交互流程：用户选择支付方式，系统调用支付网关，支付网关处理支付请求，返回支付结果，系统更新订单状态，通知用户支付结果。'
        },
        {
          title: '文件上传流程',
          description: '描述用户上传文件的交互流程：用户选择文件，前端验证文件类型和大小，分块上传到存储服务，存储服务合并文件块，生成访问URL，返回给前端显示。'
        }
      ],
      'activity': [
        {
          title: '订单处理流程',
          description: '设计一个订单处理的活动图，从用户下单开始，经过库存检查、支付处理、订单确认、发货准备到订单完成的整个流程，包括各种可能的分支和异常处理。'
        },
        {
          title: '软件开发流程',
          description: '设计一个敏捷软件开发流程的活动图，包括需求收集、任务分解、迭代规划、开发、测试、部署和回顾等环节，展示各环节之间的关系和并行活动。'
        },
        {
          title: '用户注册流程',
          description: '设计一个用户注册的活动图，包括信息输入、验证码验证、用户协议确认、账号创建等步骤，以及各种验证失败的处理分支。'
        }
      ],
      'usecase': [
        {
          title: '在线学习平台',
          description: '设计一个在线学习平台的用例图，包括学生、教师、管理员三类角色，学生可以浏览课程、参与讨论、提交作业，教师可以创建课程、批改作业、发布通知，管理员可以管理用户、审核课程。'
        },
        {
          title: '银行ATM系统',
          description: '设计一个银行ATM系统的用例图，包括查询余额、取款、存款、转账、修改密码等功能，以及管理员维护ATM的用例。'
        },
        {
          title: '医院管理系统',
          description: '设计一个医院管理系统的用例图，包括患者、医生、护士、管理员等角色，涵盖挂号、就诊、开药、收费、住院等主要业务流程。'
        }
      ],
      'state': [
        {
          title: '订单状态流转',
          description: '设计一个订单的状态图，展示订单从创建、支付、处理、发货到完成的各个状态，以及状态之间的转换条件和可能的异常状态。'
        },
        {
          title: '文档审批流程',
          description: '设计一个文档审批的状态图，展示文档从草稿、提交、审核、修改到最终批准或拒绝的各个状态，以及各状态间的转换条件。'
        },
        {
          title: '用户会话管理',
          description: '设计一个用户会话的状态图，展示用户从未登录、已登录、空闲、活跃到超时或登出的各个状态，以及状态间的转换条件和事件。'
        }
      ],
      'component': [
        {
          title: '微服务架构',
          description: '设计一个微服务架构的组件图，包括用户服务、订单服务、商品服务、支付服务、通知服务等组件，以及它们之间的依赖关系和接口。'
        },
        {
          title: 'Web应用架构',
          description: '设计一个典型Web应用的组件图，包括前端组件（UI、状态管理、路由等）、API网关、业务逻辑层、数据访问层、外部服务集成等组件。'
        },
        {
          title: '物联网系统架构',
          description: '设计一个物联网系统的组件图，包括设备层、网关层、云平台层、应用层等组件，以及各组件间的通信接口和依赖关系。'
        }
      ],
      'deployment': [
        {
          title: '云原生应用部署',
          description: '设计一个云原生应用的部署图，展示应用在Kubernetes集群中的部署情况，包括Pod、Service、Ingress、ConfigMap、Secret等资源，以及它们与物理节点的映射关系。'
        },
        {
          title: '企业应用部署架构',
          description: '设计一个企业级应用的部署图，包括Web服务器、应用服务器、数据库服务器、负载均衡器、防火墙等物理或虚拟节点，以及应用组件在这些节点上的分布。'
        },
        {
          title: '微服务部署架构',
          description: '设计一个微服务应用的部署图，展示各微服务组件在容器、虚拟机或物理服务器上的部署情况，以及服务发现、配置中心、监控系统等基础设施的部署。'
        }
      ],
      'object': [
        {
          title: '购物车实例',
          description: '设计一个购物车系统的对象图，展示特定时刻的购物车实例，包含多个商品项，每个商品项关联到具体的商品对象，显示数量、价格等属性的实际值。'
        },
        {
          title: '家庭关系实例',
          description: '设计一个家庭关系的对象图，展示Person类的多个实例之间的父子、夫妻等关系，每个Person实例包含姓名、年龄、性别等具体属性值。'
        },
        {
          title: '公司组织结构实例',
          description: '设计一个公司组织结构的对象图，展示部门、员工、职位等类的具体实例，以及它们之间的从属关系，包含具体的名称、ID等属性值。'
        }
      ]
    }
    
    // 当图表类型改变时，重置描述
    watch(() => form.diagramType, () => {
      form.description = ''
      result.value = null
    })
    
    // 使用示例描述
    const useExample = (example) => {
      form.description = example.description
    }
    
    const generateUML = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          // 重置图片加载状态
          imageLoaded.value = false
          imageLoadError.value = false
          result.value = null
          
          // 更新加载消息
          loadingMessage.value = '正在分析您的需求...'
          
          // 创建一个定时器，定期更新加载消息
          const loadingMessages = [
            '正在分析您的需求...',
            '正在设计UML结构...',
            '正在生成图形元素...',
            '正在优化图形布局...',
            '正在渲染最终图像...',
            '即将完成，请稍候...'
          ]
          
          let messageIndex = 0
          const messageTimer = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length
            loadingMessage.value = loadingMessages[messageIndex]
          }, 5000)
          
          try {
            // 准备表单数据
            const formData = new FormData()
            formData.append('diagram_type', form.diagramType)
            formData.append('query', form.description)
            
            // 调用后端API生成UML图
            const response = await api.uml.generate(formData)
            
            // 清除消息定时器
            clearInterval(messageTimer)
            
            if (response && response.status === 'success') {
              try {
                // 解析响应数据
                let responseData = {}
                if (typeof response.message === 'string') {
                  try {
                    responseData = JSON.parse(response.message)
                  } catch (e) {
                    // 如果解析失败，说明不是JSON格式，直接使用原始消息
                    responseData = {
                      explanation: response.message
                    }
                  }
                } else {
                  responseData = response.message
                }
                
                // 设置结果
                result.value = {
                  imageUrl: response.static_path ? `${response.static_path}?t=${Date.now()}` : null,
                  explanation: responseData.explanation || '未提供解释',
                  plantUmlCode: responseData.code || null
                }
                
                ElMessage.success('UML图生成成功')
              } catch (parseError) {
                console.error('解析响应数据出错:', parseError)
                ElMessage.warning('UML图生成成功，但解析结果时出现问题')
                result.value = {
                  imageUrl: response.static_path ? `${response.static_path}?t=${Date.now()}` : null,
                  explanation: '解析结果数据出错，但图片已生成',
                  plantUmlCode: null
                }
              }
            } else {
              ElMessage.error(response?.message || '生成UML图失败，请稍后重试')
            }
          } catch (error) {
            // 清除消息定时器
            clearInterval(messageTimer)
            
            console.error('生成UML图出错:', error)
            ElMessage.error('生成UML图失败，请稍后重试')
          } finally {
            loading.value = false
            // 重置加载消息
            loadingMessage.value = '请稍候，这可能需要几秒钟时间'
          }
        }
      })
    }
    
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      result.value = null
      imageLoaded.value = false
      imageLoadError.value = false
    }
    
    const downloadImage = () => {
      if (result.value && result.value.imageUrl) {
        // 创建一个临时链接元素来下载图片
        const link = document.createElement('a')
        link.href = result.value.imageUrl
        link.download = `uml_${form.diagramType}_${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success('图片下载已开始')
      }
    }
    
    const copyCode = () => {
      if (result.value && result.value.plantUmlCode) {
        navigator.clipboard.writeText(result.value.plantUmlCode)
          .then(() => {
            ElMessage.success('PlantUML代码已复制到剪贴板')
          })
          .catch(() => {
            ElMessage.error('复制失败，请手动复制')
          })
      } else {
        ElMessage.info('没有可复制的PlantUML代码')
      }
    }
    
    const handleImageError = () => {
      imageLoadError.value = true
      ElMessage.error('图片加载失败，请检查网络连接')
    }
    
    // 添加重试加载图片的方法
    const retryLoadImage = () => {
      if (!result.value || !result.value.imageUrl) return
      
      imageLoaded.value = false
      imageLoadError.value = false
      
      // 添加时间戳参数，强制浏览器重新加载图片
      const baseUrl = result.value.imageUrl.split('?')[0]
      result.value.imageUrl = `${baseUrl}?t=${Date.now()}`
      
      ElMessage.info('正在重新加载图片...')
    }
    
    // 显示全屏图片
    const showFullImage = () => {
      if (result.value && result.value.imageUrl) {
        dialogVisible.value = true
      }
    }
    
    // 关闭对话框
    const handleDialogClose = () => {
      dialogVisible.value = false
    }
    
    // 创建markdown解析器实例
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    })
    
    // 计算属性：渲染后的Markdown内容
    const renderedExplanation = computed(() => {
      if (!result.value || !result.value.explanation) return ''
      return md.render(result.value.explanation)
    })
    
    return {
      formRef,
      form,
      rules,
      loading,
      result,
      diagramTypes,
      exampleDescriptions,
      useExample,
      generateUML,
      resetForm,
      downloadImage,
      copyCode,
      imageLoaded,
      imageLoadError,
      handleImageError,
      retryLoadImage,
      loadingMessage,
      dialogVisible,
      isMobile,
      showFullImage,
      handleDialogClose,
      renderedExplanation
    }
  }
}
</script>

<style scoped>
.uml-container {
  padding: 10px 0;
}

.page-title {
  margin-bottom: 24px;
  font-size: 1.8rem;
  color: var(--text-color);
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

.tool-card, .result-card, .tips-card {
  border-radius: 8px;
  margin-bottom: 20px;
}

.examples-section {
  margin-top: 20px;
  border-top: 1px dashed #dcdfe6;
  padding-top: 15px;
}

.examples-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  color: var(--text-color);
}

.example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.example-chip {
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.3s;
}

.example-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.result-content {
  padding: 10px;
}

.diagram-container {
  display: flex;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 20px;
  min-height: 300px;
}

.diagram-image {
  max-width: 100%;
  max-height: 500px;
}

.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 300px;
}

.image-loading .is-loading {
  font-size: 40px;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.image-loading p {
  margin: 0;
  color: var(--text-color-secondary);
}

.explanation {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.explanation h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--text-color);
}

.explanation p {
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.code-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.code-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--text-color);
}

.code-block {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: monospace;
}

.tips-content {
  color: var(--text-color-secondary);
}

.tips-content h4 {
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 15px;
}

.tips-content ul {
  padding-left: 20px;
  margin-bottom: 20px;
}

.tips-content li {
  margin-bottom: 8px;
}

.mt-10 {
  margin-top: 10px;
}

.mt-20 {
  margin-top: 20px;
}

.w-100 {
  width: 100%;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading-content {
  text-align: center;
}

.loading-icon {
  font-size: 40px;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.loading-icon.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-content h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.2rem;
  color: var(--text-color);
}

.loading-content p {
  margin: 0;
  color: var(--text-color-secondary);
}

.fullscreen-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  overflow: auto;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.dialog-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.markdown-content {
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: var(--text-color);
  margin-top: 16px;
  margin-bottom: 8px;
}

.markdown-content :deep(p) {
  margin-bottom: 12px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 16px;
}

.markdown-content :deep(li) {
  margin-bottom: 4px;
}

.markdown-content :deep(code) {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(pre) {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--primary-color);
  padding-left: 16px;
  color: var(--text-color-secondary);
  font-style: italic;
  margin: 16px 0;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f2f2f2;
}

.markdown-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.fullscreen-explanation {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
}

.fullscreen-explanation h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--text-color);
}
</style> 