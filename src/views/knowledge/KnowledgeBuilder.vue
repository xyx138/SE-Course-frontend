<template>
  <div class="knowledge-builder-container">
    <div class="page-header">
      <h1 class="page-title">构建知识库</h1>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/knowledge' }">知识库管理</el-breadcrumb-item>
        <el-breadcrumb-item>构建知识库</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <el-card class="builder-card">
      <template #header>
        <div class="card-header">
          <h3>上传文档创建知识库</h3>
          <el-button @click="navigateTo('/knowledge')" size="small">
            返回
          </el-button>
        </div>
      </template>
      
      <el-form :model="formData" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="知识库名称" prop="name">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入知识库名称"
            :disabled="uploading"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="上传文档">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :multiple="true"
            :limit="10"
            :on-exceed="handleExceed"
            :file-list="fileList"
            action="#"
            :disabled="uploading"
            @change="handleFileChange"
          >
            <template #trigger>
              <el-button type="primary" :disabled="uploading">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持上传PDF、TXT、DOCX等文本文档，最多可上传10个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="uploading"
            :disabled="isSubmitDisabled"
          >
            {{ uploading ? '正在创建知识库...' : '创建知识库' }}
          </el-button>
          <el-button @click="resetForm" :disabled="uploading">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="uploading" class="progress-container">
        <h4>正在处理文档并创建知识库，请耐心等待...</h4>
        <el-progress :percentage="uploadProgress" :indeterminate="true" />
        <p class="progress-tip">处理大型文档可能需要较长时间，请勿关闭页面</p>
      </div>
    </el-card>
    
    <el-card class="tips-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>知识库使用提示</h3>
        </div>
      </template>
      
      <el-collapse>
        <el-collapse-item title="什么是知识库？" name="1">
          <p>知识库是一个存储和组织软件工程相关文档的系统，通过向量化处理，使您能够快速检索和查询文档内容。</p>
        </el-collapse-item>
        
        <el-collapse-item title="如何创建高质量知识库？" name="2">
          <p>为了创建高质量的知识库，请遵循以下建议：</p>
          <ul>
            <li>上传格式清晰、结构良好的文档</li>
            <li>确保文档内容相关性，最好围绕同一主题或相关主题</li>
            <li>为知识库取一个具有描述性的名称，以便于识别</li>
            <li>定期更新知识库内容，保持信息的时效性</li>
          </ul>
        </el-collapse-item>
        
        <el-collapse-item title="支持哪些文档格式？" name="3">
          <p>目前支持以下文档格式：</p>
          <ul>
            <li>PDF文档 (.pdf)</li>
            <li>文本文件 (.txt)</li>
            <li>Word文档 (.docx, .doc)</li>
            <li>Markdown文件 (.md)</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'
import { useStore } from 'vuex'

export default {
  name: 'KnowledgeBuilder',
  setup() {
    const router = useRouter()
    const store = useStore()
    const formRef = ref(null)
    const uploadRef = ref(null)
    const fileList = ref([])
    const uploading = ref(false)
    const uploadProgress = ref(0)
    
    const formData = reactive({
      name: '',
    })
    
    const rules = {
      name: [
        { required: true, message: '请输入知识库名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度应为2到50个字符', trigger: 'blur' }
      ]
    }
    
    // 计算属性：判断提交按钮是否应该禁用
    const isSubmitDisabled = computed(() => {
      return fileList.value.length === 0 || !formData.name.trim()
    })
    
    // 导航到指定路由
    const navigateTo = (route) => {
      router.push(route)
    }
    
    // 处理文件超出限制
    const handleExceed = () => {
      ElMessage.warning('最多只能上传10个文件')
    }
    
    // 处理文件变化
    const handleFileChange = (file, uploadFiles) => {
      console.log('文件变化:', file, uploadFiles)
      fileList.value = uploadFiles
    }
    
    // 处理文件移除
    const handleFileRemove = (file, uploadFiles) => {
      console.log('文件移除:', file, uploadFiles)
      fileList.value = uploadFiles
    }
    
    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (valid) {
          if (fileList.value.length === 0) {
            ElMessage.warning('请至少上传一个文件')
            return
          }
          
          // 确认创建
          try {
            await ElMessageBox.confirm(
              `确定要创建名为"${formData.name}"的知识库吗？`,
              '创建确认',
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
              }
            )
            
            await createKnowledgeBase()
          } catch (e) {
            // 用户取消操作
          }
        }
      })
    }
    
    // 创建知识库
    const createKnowledgeBase = async () => {
      uploading.value = true
      uploadProgress.value = 0
      
      try {
        // 获取当前用户名
        const username = store.state.user?.username || 'anonymous'
        
        // 创建FormData对象
        const formDataObj = new FormData()
        // 拼接用户名和用户输入的名称
        formDataObj.append('name', `${username}_${formData.name}`)
        
        // 添加所有文件
        fileList.value.forEach(file => {
          formDataObj.append('files', file.raw)
        })
        
        // 模拟上传进度
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += 10
          }
        }, 1000)
        
        // 调用API创建知识库
        const response = await api.knowledge.createKnowledgeBase(formDataObj)
        
        clearInterval(progressInterval)
        uploadProgress.value = 100
        
        if (response && response.status === 'success') {
          ElMessage.success(response.message || '知识库创建成功')
          setTimeout(() => {
            navigateTo('/knowledge')
          }, 1000)
        } else {
          ElMessage.error(response.message || '知识库创建失败')
        }
      } catch (error) {
        console.error('创建知识库出错', error)
        ElMessage.error('创建知识库时发生错误')
      } finally {
        uploading.value = false
      }
    }
    
    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
      }
      fileList.value = []
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
    }
    
    return {
      formRef,
      uploadRef,
      formData,
      rules,
      fileList,
      uploading,
      uploadProgress,
      isSubmitDisabled,
      navigateTo,
      handleExceed,
      handleFileChange,
      handleFileRemove,
      submitForm,
      resetForm
    }
  }
}
</script>

<style scoped>
.knowledge-builder-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.8rem;
  color: var(--text-color);
  margin: 0;
}

.builder-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.tips-card {
  border-radius: 8px;
  background-color: #f9fafc;
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

.progress-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.progress-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 0.9rem;
}
</style> 