<template>
  <div class="knowledge-builder-container">
    <div class="page-header">
      <h1 class="page-title">学习笔记管理</h1>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/knowledge' }">知识库管理</el-breadcrumb-item>
        <el-breadcrumb-item>学习笔记</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <el-card class="builder-card">
      <template #header>
        <div class="card-header">
          <h3>上传学习笔记</h3>
          <el-button @click="navigateTo('/knowledge')" size="small">
            返回
          </el-button>
        </div>
      </template>
      
      <el-form ref="formRef" label-width="100px">
        <el-form-item label="上传笔记">
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
            :disabled="fileList.length === 0"
          >
            {{ uploading ? '正在上传笔记...' : '上传笔记' }}
          </el-button>
          <el-button @click="resetForm" :disabled="uploading">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="uploading" class="progress-container">
        <h4>正在处理文档并创建笔记库，请耐心等待...</h4>
        <el-progress :percentage="uploadProgress" :indeterminate="true" />
        <p class="progress-tip">处理大型文档可能需要较长时间，请勿关闭页面</p>
      </div>
    </el-card>
    
    <el-card class="tips-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>学习笔记使用提示</h3>
        </div>
      </template>
      
      <el-collapse>
        <el-collapse-item title="什么是学习笔记库？" name="1">
          <p>学习笔记库是一个专门存储和组织您的软件工程学习笔记的知识库，通过向量化处理，使您能够快速检索和查询笔记内容。</p>
        </el-collapse-item>
        
        <el-collapse-item title="如何整理高效的学习笔记？" name="2">
          <p>为了创建高质量的学习笔记，请遵循以下建议：</p>
          <ul>
            <li>使用清晰的标题和小标题组织内容</li>
            <li>添加关键概念的定义和解释</li>
            <li>使用示例和图表辅助理解</li>
            <li>记录自己的理解和疑问</li>
            <li>定期复习和更新笔记内容</li>
          </ul>
        </el-collapse-item>
        
        <el-collapse-item title="如何有效使用学习笔记？" name="3">
          <p>上传笔记后，您可以：</p>
          <ul>
            <li>使用关键词搜索相关笔记内容</li>
            <li>查看笔记的关联知识点</li>
            <li>根据学习进度整理和更新笔记</li>
            <li>将笔记与课程内容和习题关联起来</li>
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
  name: 'NotesBuilder',
  setup() {
    const router = useRouter()
    const store = useStore()
    const formRef = ref(null)
    const uploadRef = ref(null)
    const fileList = ref([])
    const uploading = ref(false)
    const uploadProgress = ref(0)
    
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
    
    // 提交表单
    const submitForm = async () => {
      if (fileList.value.length === 0) {
        ElMessage.warning('请至少上传一个文件')
        return
      }
      
      // 确认创建
      try {
        await ElMessageBox.confirm(
          '确定要上传这些学习笔记吗？',
          '上传确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        await createNotesKnowledgeBase()
      } catch (e) {
        // 用户取消操作
      }
    }
    
    // 创建笔记知识库
    const createNotesKnowledgeBase = async () => {
      uploading.value = true
      uploadProgress.value = 0
      
      try {
        // 获取当前用户名
        const username = store.state.user?.username || 'anonymous'
        
        // 创建FormData对象
        const formDataObj = new FormData()
        // 拼接用户名和固定名称
        formDataObj.append('name', `${username}_学习笔记`)
        
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
          ElMessage.success('学习笔记上传成功')
          setTimeout(() => {
            navigateTo('/knowledge')
          }, 1000)
        } else {
          ElMessage.error(response.message || '学习笔记上传失败')
        }
      } catch (error) {
        console.error('上传学习笔记出错', error)
        ElMessage.error('上传学习笔记时发生错误')
      } finally {
        uploading.value = false
      }
    }
    
    // 重置表单
    const resetForm = () => {
      fileList.value = []
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
    }
    
    return {
      formRef,
      uploadRef,
      fileList,
      uploading,
      uploadProgress,
      navigateTo,
      handleExceed,
      handleFileChange,
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