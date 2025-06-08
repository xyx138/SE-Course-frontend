<template>
  <div class="knowledge-container">
    <h1 class="page-title">知识库管理</h1>
    
    <el-row :gutter="20">
      <el-col :md="6" :sm="12" v-for="(card, index) in featureCards" :key="index">
        <el-card class="feature-card" shadow="hover" @click="navigateTo(card.route)">
          <div class="card-content">
            <el-icon :size="40" class="card-icon">
              <component :is="card.icon"></component>
            </el-icon>
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-desc">{{ card.description }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <el-card class="knowledge-map-card">
          <template #header>
            <div class="card-header">
              <h3>知识库列表</h3>
              <el-button-group>
                <el-button size="small" @click="refreshKnowledgeBases">
                  <el-icon><Refresh /></el-icon>
                </el-button>
                <el-button size="small" type="primary" @click="navigateTo('/knowledge/builder')">
                  <el-icon><Plus /></el-icon> 新建知识库
                </el-button>
              </el-button-group>
            </div>
          </template>
          
          <div class="knowledge-map">
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="10" animated />
            </div>
            <div v-else-if="knowledgeBases.length === 0" class="empty-container">
              <el-empty description="暂无知识库" />
              <el-button type="primary" @click="navigateTo('/knowledge/builder')">
                创建第一个知识库
              </el-button>
            </div>
            <div v-else class="knowledge-bases-list">
              <el-table :data="knowledgeBases" style="width: 100%">
                <el-table-column prop="displayName" label="知识库名称" />
                <el-table-column label="操作" width="250">
                  <template #default="scope">
                    <el-button size="small" @click="useKnowledgeBase(scope.row)">
                      使用
                    </el-button>
                    <el-button 
                      size="small" 
                      type="success"
                      @click="expandKnowledgeBase(scope.row)"
                    >
                      扩增
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="confirmDelete(scope.row)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="recent-plans-card">
          <template #header>
            <div class="card-header">
              <h3>最近复习计划</h3>
              <el-button @click="navigateTo('/knowledge/plan')" type="text">
                查看全部
              </el-button>
            </div>
          </template>
          
          <div v-if="loadingPlans" class="loading-placeholder">
            <el-skeleton :rows="3" animated />
          </div>
          
          <el-empty v-else-if="recentPlans.length === 0" description="暂无复习计划" :image-size="100">
            <el-button type="primary" size="small" @click="navigateTo('/knowledge/plan')">
              创建复习计划
            </el-button>
          </el-empty>
          
          <div v-else class="plan-list">
            <div v-for="plan in recentPlans" :key="plan.id" class="plan-item" @click="navigateTo(`/knowledge/plan?id=${plan.id}`)">
              <div class="plan-info">
                <h4>{{ plan.title }}</h4>
                <div class="plan-meta">
                  <span class="plan-date">{{ formatDate(plan.last_update_time) }}</span>
                  <el-tag size="small" :type="getStatusType(plan.status)">{{ plan.status }}</el-tag>
                </div>
              </div>
              <div class="plan-progress">
                <span>{{ (plan.progress * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 添加扩增知识库对话框 -->
    <el-dialog
      v-model="expandDialogVisible"
      title="扩增知识库"
      width="50%"
    >
      <el-form :model="expandForm" ref="expandFormRef" label-width="120px">
        <el-form-item label="知识库名称">
          <el-input v-model="expandForm.name" disabled />
        </el-form-item>
        
        <el-form-item label="添加文件">
          <el-upload
            ref="expandUploadRef"
            action="#"
            :auto-upload="false"
            :multiple="true"
            :limit="10"
            :on-exceed="handleExceed"
            :on-change="handleExpandFileChange"
            :on-remove="handleExpandFileRemove"
            :file-list="expandFileList"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持PDF、Word、TXT等文本文件，单个文件不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <div v-if="expandUploading" class="progress-container">
        <h4>正在处理文档并更新知识库，请耐心等待...</h4>
        <el-progress :percentage="expandUploadProgress" />
        <p class="progress-tip">处理大文件可能需要较长时间，请不要关闭页面</p>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="expandDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitExpandForm" 
            :disabled="expandFileList.length === 0 || expandUploading"
            :loading="expandUploading"
          >
            {{ expandUploading ? '正在更新知识库...' : '更新知识库' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加使用知识库（接入Agent）对话框 -->
    <el-dialog
      v-model="useDialogVisible"
      title="接入知识库"
      width="50%"
    >
      <el-form :model="useForm" ref="useFormRef" label-width="120px">
        <el-form-item label="知识库名称">
          <el-input v-model="useForm.name" disabled />
        </el-form-item>
        
        <el-form-item label="接入模块" prop="agentTypes">
          <el-checkbox-group v-model="useForm.agentTypes">
            <el-checkbox label="UmlAgent">UML图生成</el-checkbox>
            <el-checkbox label="QuestionAgent">习题解答</el-checkbox>
            <el-checkbox label="ExplainAgent">知识解析</el-checkbox>
            <el-checkbox label="PaperAgent">论文工具</el-checkbox>
            <el-checkbox label="TestAgent">测试工具</el-checkbox>
          </el-checkbox-group>
          <div class="form-tip">选择要接入的功能模块，知识库将用于增强所选模块的回答能力</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="useDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitUseForm" 
            :loading="updating"
          >
            {{ updating ? '正在接入...' : '确认接入' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api'
import { useStore } from 'vuex'
import { Plus, Refresh, Setting } from '@element-plus/icons-vue'

export default {
  name: 'KnowledgeIndexView',
  components: {
    Plus,
    Refresh,
    Setting
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const loading = ref(false)
    const knowledgeBases = ref([])
    const loadingPlans = ref(true)
    const recentPlans = ref([])
    
    // 功能卡片数据
    const featureCards = [
      {
        title: '构建知识库',
        icon: 'FolderAdd',
        description: '上传文档创建新的知识库',
        route: '/knowledge/builder'
      },
      {
        title: '学习笔记',
        icon: 'Notebook',
        description: '管理个人学习笔记和总结',
        route: '/knowledge/notes'
      },
      {
        title: '错题集',
        icon: 'Warning',
        description: '记录和复习软件工程习题',
        route: '/knowledge/mistakes'
      },
      {
        title: '复习计划',
        icon: 'Calendar',
        description: '制定个性化复习计划',
        route: '/knowledge/plan'
      }
    ]
    
    // 导航到指定路由
    const navigateTo = (route) => {
      router.push(route)
    }
    
    // 获取时间线项目类型（为了视觉差异）
    const getTimelineItemType = (index) => {
      const types = ['primary', 'success', 'warning', 'danger']
      return types[index % types.length]
    }
    
    // 获取知识库列表
    const fetchKnowledgeBases = async () => {
      loading.value = true
      try {
        const response = await api.knowledge.getKnowledgeBases()
        if (response && response.status === 'success') {
          // 处理每个知识库名称，添加原始名称和显示名称
          knowledgeBases.value = response.knowledge_bases.map(name => ({
            name: name,  // 保留原始名称（用于API调用）
            displayName: processKnowledgeBaseName(name)  // 处理后的显示名称
          }))
        } else {
          ElMessage.error('获取知识库列表失败')
        }
      } catch (error) {
        console.error('获取知识库列表出错', error)
        ElMessage.error('获取知识库列表时发生错误')
      } finally {
        loading.value = false
      }
    }
    
    // 刷新知识库列表
    const refreshKnowledgeBases = () => {
      fetchKnowledgeBases()
    }
    
    // 确认删除知识库
    const confirmDelete = (kb) => {
      ElMessageBox.confirm(
        `确定要删除知识库"${kb.displayName}"吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(() => {
          deleteKnowledgeBase(kb.name)  // 使用原始名称进行删除
        })
        .catch(() => {
          // 用户取消删除
        })
    }
    
    // 删除知识库
    const deleteKnowledgeBase = async (name) => {
      try {
        const formData = new FormData()
        formData.append('name', name)  // 使用原始名称
        
        const response = await api.knowledge.deleteKnowledgeBase(formData)
        if (response && response.status === 'success') {
          ElMessage.success(response.message || '知识库删除成功')
          // 重新获取知识库列表
          fetchKnowledgeBases()
        } else {
          ElMessage.error(response.message || '知识库删除失败')
        }
      } catch (error) {
        console.error('删除知识库出错', error)
        ElMessage.error('删除知识库时发生错误')
      }
    }
    
    // 知识库扩增相关变量
    const expandDialogVisible = ref(false)
    const expandForm = reactive({
      name: '',
      originalName: ''  // 存储原始名称，包含用户名前缀
    })
    const expandFormRef = ref(null)
    const expandUploadRef = ref(null)
    const expandFileList = ref([])
    const expandUploading = ref(false)
    const expandUploadProgress = ref(0)
    
    // 打开扩增知识库对话框
    const expandKnowledgeBase = (kb) => {
      expandForm.name = kb.displayName
      expandForm.originalName = kb.name
      expandFileList.value = []
      expandDialogVisible.value = true
    }
    
    // 处理文件变更
    const handleExpandFileChange = (file, fileList) => {
      expandFileList.value = fileList
    }
    
    // 处理文件移除
    const handleExpandFileRemove = (file, fileList) => {
      expandFileList.value = fileList
    }
    
    // 提交扩增表单
    const submitExpandForm = async () => {
      if (expandFileList.value.length === 0) {
        ElMessage.warning('请至少上传一个文件')
        return
      }
      
      try {
        await ElMessageBox.confirm(
          `确定要向知识库"${expandForm.name}"添加 ${expandFileList.value.length} 个文件吗？`,
          '更新确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        await updateKnowledgeBase()
      } catch (e) {
        // 用户取消操作
      }
    }
    
    // 更新知识库
    const updateKnowledgeBase = async () => {
      expandUploading.value = true
      expandUploadProgress.value = 0
      
      try {
        // 创建FormData对象
        const formDataObj = new FormData()
        // 使用原始名称（带有用户名前缀）
        formDataObj.append('name', expandForm.originalName)
        
        // 添加所有文件
        expandFileList.value.forEach(file => {
          formDataObj.append('files', file.raw)
        })
        
        // 模拟上传进度
        const progressInterval = setInterval(() => {
          if (expandUploadProgress.value < 90) {
            expandUploadProgress.value += 10
          }
        }, 1000)
        
        // 调用API更新知识库
        const response = await api.knowledge.updateKnowledgeBase(formDataObj)
        
        clearInterval(progressInterval)
        expandUploadProgress.value = 100
        
        if (response && response.status === 'success') {
          ElMessage.success(response.message || '知识库更新成功')
          expandDialogVisible.value = false
          fetchKnowledgeBases() // 刷新知识库列表
        } else {
          ElMessage.error(response.message || '知识库更新失败')
        }
      } catch (error) {
        console.error('更新知识库出错', error)
        ElMessage.error('更新知识库时发生错误')
      } finally {
        expandUploading.value = false
      }
    }
    
    // 知识库接入相关变量
    const useDialogVisible = ref(false)
    const useForm = reactive({
      name: '',
      originalName: '', // 存储原始名称，包含用户名前缀
      agentTypes: [] // 选中的Agent类型
    })
    const useFormRef = ref(null)
    const updating = ref(false)
    
    // 打开使用知识库对话框
    const useKnowledgeBase = (kb) => {
      useForm.name = kb.displayName
      useForm.originalName = kb.name
      useForm.agentTypes = [] // 重置选择
      useDialogVisible.value = true
    }
    
    // 提交使用表单
    const submitUseForm = async () => {
      if (useForm.agentTypes.length === 0) {
        ElMessage.warning('请至少选择一个接入模块')
        return
      }
      
      try {
        await ElMessageBox.confirm(
          `确定要将知识库"${useForm.name}"接入到所选模块吗？`,
          '接入确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        await updateLabel()
      } catch (e) {
        // 用户取消操作
      }
    }
    
    // 更新知识库标签（接入Agent）
    const updateLabel = async () => {
      updating.value = true
      
      try {
        // 创建FormData对象
        const formDataObj = new FormData()
        // 使用原始名称（带有用户名前缀）
        formDataObj.append('name', useForm.originalName)
        
        // 添加所有选中的Agent类型
        useForm.agentTypes.forEach(type => {
          formDataObj.append('agent_type_list', type)
        })
        
        // 调用API更新知识库标签
        const response = await api.knowledge.updateLabel(formDataObj)
        
        if (response && response.status === 'success') {
          ElMessage.success(response.message || '知识库接入成功')
          useDialogVisible.value = false
        } else {
          ElMessage.error(response.message || '知识库接入失败')
        }
      } catch (error) {
        console.error('接入知识库出错', error)
        ElMessage.error('接入知识库时发生错误')
      } finally {
        updating.value = false
      }
    }
    
    // 添加获取最近复习计划的函数
    const fetchRecentPlans = async () => {
      loadingPlans.value = true
      try {
        const response = await api.reviewPlan.getPlans(3) // 获取最近3个计划
        if (response && response.status === 'success') {
          recentPlans.value = response.plans || []
        } else {
          console.error('获取复习计划失败:', response?.message)
        }
      } catch (error) {
        console.error('获取复习计划出错:', error)
      } finally {
        loadingPlans.value = false
      }
    }
    
    // 格式化日期
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return dateStr
      }
    }
    
    // 获取状态类型
    const getStatusType = (status) => {
      const types = {
        '进行中': 'primary',
        '已完成': 'success',
        '已过期': 'info'
      }
      return types[status] || 'primary'
    }
    
    // 获取进度状态
    const getProgressStatus = (progress) => {
      if (progress >= 1) return 'success'
      if (progress >= 0.5) return ''
      return 'warning'
    }
    
    // 处理知识库名称，去除用户名前缀
    const processKnowledgeBaseName = (name) => {
      const username = store.state.user?.username || 'anonymous'
      const prefix = `${username}_`
      
      // 如果知识库名称以"用户名_"开头，则去除这个前缀
      if (name.startsWith(prefix)) {
        return name.substring(prefix.length)
      }
      
      return name
    }
    
    // 组件挂载时获取知识库列表
    onMounted(async () => {
      await fetchKnowledgeBases()
      await fetchRecentPlans() // 加载最近的复习计划
    })
    
    return {
      loading,
      knowledgeBases,
      featureCards,
      recentPlans,
      loadingPlans,
      navigateTo,
      getTimelineItemType,
      confirmDelete,
      expandDialogVisible,
      expandForm,
      expandFormRef,
      expandUploadRef,
      expandFileList,
      expandUploading,
      expandUploadProgress,
      expandKnowledgeBase,
      handleExpandFileChange,
      handleExpandFileRemove,
      submitExpandForm,
      useDialogVisible,
      useForm,
      useFormRef,
      updating,
      useKnowledgeBase,
      submitUseForm,
      formatDate,
      getStatusType,
      getProgressStatus
    }
  }
}
</script>

<style scoped>
.knowledge-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  font-size: 1.8rem;
  color: var(--text-color);
}

.feature-card {
  height: 200px;
  border-radius: 8px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  height: 100%;
}

.card-icon {
  color: var(--primary-color);
  margin-bottom: 15px;
}

.card-title {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: var(--text-color);
}

.card-desc {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  flex-grow: 1;
}

.knowledge-map-card, .recent-plans-card {
  border-radius: 8px;
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

.knowledge-map {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.loading-container {
  width: 100%;
  height: 400px;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 20px;
}

.knowledge-bases-list {
  width: 100%;
}

.recent-plans-card {
  margin-bottom: 20px;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.plan-item {
  padding: 12px;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s;
}

.plan-item:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.plan-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.plan-info h4 {
  margin: 0;
  font-size: 16px;
  flex: 1;
}

.plan-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.plan-date {
  font-size: 12px;
  color: #909399;
}

.plan-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.plan-progress span {
  min-width: 40px;
  text-align: right;
  font-size: 14px;
  color: #606266;
}

.loading-placeholder {
  padding: 10px;
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

.form-tip {
  font-size: 0.8rem;
  color: #909399;
  margin-top: 5px;
}
</style> 