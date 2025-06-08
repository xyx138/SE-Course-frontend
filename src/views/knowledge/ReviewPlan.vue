<template>
  <div class="review-plan-container">
    <div class="page-header">
      <h1 class="page-title">复习计划</h1>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/knowledge' }">知识库管理</el-breadcrumb-item>
        <el-breadcrumb-item>复习计划</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>
    
    <div v-else>
      <!-- 无计划时显示的内容 -->
      <el-empty v-if="plans.length === 0" description="暂无复习计划">
        <el-button type="primary" @click="generatePlan" :loading="generating">
          {{ generating ? '正在生成复习计划...' : '生成复习计划' }}
        </el-button>
        <p class="tip-text">系统将分析您的历史对话记录、学习笔记和错题集，生成个性化复习计划</p>
      </el-empty>
      
      <!-- 有计划时显示的内容 -->
      <template v-else>
        <div class="plans-header">
          <h2>我的复习计划</h2>
          <el-button type="primary" @click="generatePlan" :loading="generating" size="small">
            {{ generating ? '正在生成复习计划...' : '生成新的复习计划' }}
          </el-button>
        </div>
        
        <!-- 计划列表 -->
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12" :lg="8" v-for="plan in plans" :key="plan.id" class="plan-col">
            <el-card class="plan-card" shadow="hover">
              <template #header>
                <div class="plan-header">
                  <h3>{{ plan.title }}</h3>
                  <div class="plan-meta">
                    <span class="creation-time">创建于: {{ formatDate(plan.creation_time) }}</span>
                    <el-tag :type="getStatusType(plan.status)" size="small">{{ plan.status }}</el-tag>
                  </div>
                </div>
              </template>
              
              <div class="plan-progress">
                <span>完成进度: {{ (plan.progress * 100).toFixed(0) }}%</span>
                <el-progress :percentage="plan.progress * 100" :status="getProgressStatus(plan.progress)" />
              </div>
              
              <div class="plan-summary" v-if="plan.summary">
                <p>{{ truncateSummary(plan.summary) }}</p>
              </div>
              
              <div class="plan-stats">
                <div class="stat-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ plan.steps ? plan.steps.length : 0 }}个步骤</span>
                </div>
                <div class="stat-item">
                  <el-icon><Check /></el-icon>
                  <span>{{ getCompletedStepsCount(plan) }}个已完成</span>
                </div>
              </div>
              
              <div class="plan-actions">
                <el-button type="primary" plain @click="viewPlanDetail(plan.id)">查看详情</el-button>
                <el-button type="danger" plain @click="confirmDelete(plan.id)">删除计划</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </div>
    
    <!-- 计划详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="复习计划详情"
      width="80%"
      :before-close="handleCloseDialog"
      top="5vh"
      destroy-on-close
    >
      <div v-if="currentPlan" class="plan-detail">
        <h2>{{ currentPlan.title }}</h2>
        <p v-if="currentPlan.summary" class="plan-summary">{{ currentPlan.summary }}</p>
        
        <div class="plan-meta-info">
          <div class="meta-item">
            <el-icon><Calendar /></el-icon>
            <span>创建于: {{ formatDate(currentPlan.creation_time) }}</span>
          </div>
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>更新于: {{ formatDate(currentPlan.last_update_time) }}</span>
          </div>
          <div class="meta-item">
            <el-icon><InfoFilled /></el-icon>
            <span>状态: <el-tag :type="getStatusType(currentPlan.status)">{{ currentPlan.status }}</el-tag></span>
          </div>
        </div>
        
        <div class="plan-progress">
          <span>完成进度: {{ (currentPlan.progress * 100).toFixed(0) }}%</span>
          <el-progress :percentage="currentPlan.progress * 100" :status="getProgressStatus(currentPlan.progress)" />
        </div>
        
        <div class="plan-steps">
          <h3>复习步骤</h3>
          <el-timeline>
            <el-timeline-item
              v-for="step in currentPlan.steps"
              :key="step.id"
              :type="step.is_completed ? 'success' : 'primary'"
              :timestamp="formatDate(step.schedule_time)"
              :hollow="!step.is_completed"
              :color="getStepColor(step)"
            >
              <el-card class="step-card" :class="{ 'completed-step': step.is_completed }">
                <div class="step-content">
                  <p>{{ step.content }}</p>
                </div>
                <div class="step-actions">
                  <el-checkbox
                    v-model="step.is_completed"
                    @change="updateStepStatus(step.id, $event)"
                    :disabled="currentPlan.status === '已过期'"
                  >
                    {{ step.is_completed ? '已完成' : '标记为已完成' }}
                  </el-checkbox>
                  <span v-if="step.completion_time" class="completion-time">
                    完成于: {{ formatDate(step.completion_time) }}
                  </span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="printPlan">打印计划</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 生成计划进度对话框 -->
    <el-dialog
      v-model="generatingDialog"
      title="正在生成复习计划"
      width="50%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="generating-content">
        <el-progress type="circle" :percentage="generatingProgress" :status="generatingStatus"></el-progress>
        <p class="generating-text">{{ generatingText }}</p>
        <p class="tip-text">正在分析您的学习数据，这可能需要一些时间，请耐心等待...</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Check, Clock, InfoFilled } from '@element-plus/icons-vue'
import api from '../../api'

export default {
  name: 'ReviewPlan',
  components: {
    Calendar,
    Check,
    Clock,
    InfoFilled
  },
  setup() {
    const router = useRouter()
    const loading = ref(true)
    const generating = ref(false)
    const plans = ref([])
    const dialogVisible = ref(false)
    const currentPlanId = ref(null)
    const currentPlan = ref(null)
    
    // 生成进度相关
    const generatingDialog = ref(false)
    const generatingProgress = ref(0)
    const generatingStatus = ref('')
    const generatingText = ref('正在准备生成复习计划...')
    
    // 获取复习计划列表
    const loadPlans = async () => {
      loading.value = true
      try {
        const response = await api.reviewPlan.getList()
        if (response && response.status === 'success') {
          plans.value = response.plans || []
        } else {
          ElMessage.error(response?.message || '获取复习计划失败')
        }
      } catch (error) {
        console.error('获取复习计划出错:', error)
        ElMessage.error('获取复习计划失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
    
    // 模拟生成进度
    const simulateGeneratingProgress = () => {
      generatingProgress.value = 0
      generatingStatus.value = ''
      generatingText.value = '正在准备生成复习计划...'
      generatingDialog.value = true
      
      const interval = setInterval(() => {
        if (generatingProgress.value < 90) {
          generatingProgress.value += Math.floor(Math.random() * 10) + 1
          
          if (generatingProgress.value < 30) {
            generatingText.value = '正在分析您的历史对话记录...'
          } else if (generatingProgress.value < 60) {
            generatingText.value = '正在分析您的学习笔记和错题集...'
          } else {
            generatingText.value = '正在生成个性化复习计划...'
          }
        }
      }, 800)
      
      return interval
    }
    
    // 生成新的复习计划
    const generatePlan = async () => {
      generating.value = true
      const progressInterval = simulateGeneratingProgress()
      
      try {
        const response = await api.reviewPlan.generate()
        
        // 清除进度模拟计时器
        clearInterval(progressInterval)
        
        // 设置进度为100%并显示成功状态
        generatingProgress.value = 100
        generatingStatus.value = 'success'
        generatingText.value = '复习计划生成成功！'
        
        if (response && response.status === 'success') {
          // 延迟关闭进度对话框，让用户看到成功状态
          setTimeout(() => {
            generatingDialog.value = false
            ElMessage.success('复习计划生成成功')
          }, 1000)
          
          await loadPlans()
          // 自动打开新生成的计划详情
          if (response.plan && response.plan.id) {
            viewPlanDetail(response.plan.id)
          }
        } else {
          // 设置进度为异常状态
          generatingStatus.value = 'exception'
          generatingText.value = '复习计划生成失败！'
          
          // 延迟关闭进度对话框，让用户看到失败状态
          setTimeout(() => {
            generatingDialog.value = false
            ElMessage.error(response?.message || '生成复习计划失败')
          }, 1000)
        }
      } catch (error) {
        // 清除进度模拟计时器
        clearInterval(progressInterval)
        
        // 设置进度为异常状态
        generatingProgress.value = 100
        generatingStatus.value = 'exception'
        generatingText.value = '复习计划生成失败！'
        
        // 延迟关闭进度对话框，让用户看到失败状态
        setTimeout(() => {
          generatingDialog.value = false
          console.error('生成复习计划出错:', error)
          ElMessage.error('生成复习计划失败，请稍后重试')
        }, 1000)
      } finally {
        generating.value = false
      }
    }
    
    // 查看计划详情
    const viewPlanDetail = async (planId) => {
      try {
        const response = await api.reviewPlan.getDetail(planId)
        if (response && response.status === 'success') {
          currentPlan.value = response.plan
          currentPlanId.value = planId
          dialogVisible.value = true
        } else {
          ElMessage.error(response?.message || '获取计划详情失败')
        }
      } catch (error) {
        console.error('获取计划详情出错:', error)
        ElMessage.error('获取计划详情失败，请稍后重试')
      }
    }
    
    // 更新步骤状态
    const updateStepStatus = async (stepId, isCompleted) => {
      if (!currentPlanId.value) return
      
      try {
        const response = await api.reviewPlan.updateStepStatus(currentPlanId.value, stepId, isCompleted)
        if (response && response.status === 'success') {
          ElMessage.success(isCompleted ? '步骤已标记为完成' : '步骤已标记为未完成')
          // 重新加载计划详情和列表
          await viewPlanDetail(currentPlanId.value)
          await loadPlans()
        } else {
          ElMessage.error(response?.message || '更新步骤状态失败')
          // 恢复步骤状态
          const step = currentPlan.value.steps.find(s => s.id === stepId)
          if (step) {
            step.is_completed = !isCompleted
          }
        }
      } catch (error) {
        console.error('更新步骤状态出错:', error)
        ElMessage.error('更新步骤状态失败，请稍后重试')
        // 恢复步骤状态
        const step = currentPlan.value.steps.find(s => s.id === stepId)
        if (step) {
          step.is_completed = !isCompleted
        }
      }
    }
    
    // 确认删除计划
    const confirmDelete = (planId) => {
      ElMessageBox.confirm(
        '确定要删除该复习计划吗？此操作不可恢复。',
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        deletePlan(planId)
      }).catch(() => {
        // 用户取消删除操作
      })
    }
    
    // 删除计划
    const deletePlan = async (planId) => {
      try {
        const response = await api.reviewPlan.delete(planId)
        if (response && response.status === 'success') {
          ElMessage.success('复习计划删除成功')
          if (dialogVisible.value && currentPlanId.value === planId) {
            dialogVisible.value = false
          }
          await loadPlans()
        } else {
          ElMessage.error(response?.message || '删除复习计划失败')
        }
      } catch (error) {
        console.error('删除复习计划出错:', error)
        ElMessage.error('删除复习计划失败，请稍后重试')
      }
    }
    
    // 打印计划
    const printPlan = () => {
      if (!currentPlan.value) return
      
      // 创建打印内容
      const printContent = document.createElement('div')
      printContent.innerHTML = `
        <style>
          body { font-family: Arial, sans-serif; }
          .print-container { max-width: 800px; margin: 0 auto; padding: 20px; }
          h1, h2, h3 { color: #333; }
          .plan-meta { margin-bottom: 20px; color: #666; }
          .plan-summary { margin-bottom: 20px; }
          .step { margin-bottom: 15px; padding: 15px; border: 1px solid #eee; border-radius: 5px; }
          .step-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .step-time { color: #888; }
          .step-status { font-weight: bold; }
          .completed { color: #67C23A; }
          .pending { color: #409EFF; }
          @media print {
            body { font-size: 12pt; }
            .no-print { display: none; }
          }
        </style>
        <div class="print-container">
          <h1>${currentPlan.value.title}</h1>
          <div class="plan-meta">
            <p>创建时间: ${formatDate(currentPlan.value.creation_time)}</p>
            <p>更新时间: ${formatDate(currentPlan.value.last_update_time)}</p>
            <p>当前状态: ${currentPlan.value.status}</p>
            <p>完成进度: ${(currentPlan.value.progress * 100).toFixed(0)}%</p>
          </div>
          ${currentPlan.value.summary ? `<div class="plan-summary"><h3>计划概述</h3><p>${currentPlan.value.summary}</p></div>` : ''}
          <div class="plan-steps">
            <h2>复习步骤</h2>
            ${currentPlan.value.steps.map((step, index) => `
              <div class="step">
                <div class="step-header">
                  <h3>步骤 ${index + 1}</h3>
                  <div>
                    <span class="step-time">计划时间: ${formatDate(step.schedule_time)}</span>
                    <span class="step-status ${step.is_completed ? 'completed' : 'pending'}">
                      ${step.is_completed ? '已完成' : '未完成'}
                    </span>
                  </div>
                </div>
                <p>${step.content}</p>
                ${step.completion_time ? `<p>完成时间: ${formatDate(step.completion_time)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `
      
      // 创建新窗口并打印
      const printWindow = window.open('', '_blank')
      printWindow.document.write(printContent.innerHTML)
      printWindow.document.close()
      printWindow.onload = function() {
        printWindow.print()
        printWindow.close()
      }
    }
    
    // 关闭对话框的处理函数
    const handleCloseDialog = () => {
      dialogVisible.value = false
    }
    
    // 格式化日期
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      
      try {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
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
    
    // 获取步骤颜色
    const getStepColor = (step) => {
      if (step.is_completed) return '#67C23A' // 成功绿色
      
      // 检查步骤是否过期（计划时间早于当前时间）
      try {
        const scheduleTime = new Date(step.schedule_time)
        const now = new Date()
        if (scheduleTime < now) {
          return '#E6A23C' // 警告黄色
        }
      } catch (e) {
        // 日期解析错误，使用默认颜色
      }
      
      return '' // 默认颜色
    }
    
    // 获取计划已完成步骤数
    const getCompletedStepsCount = (plan) => {
      if (!plan.steps) return 0
      return plan.steps.filter(step => step.is_completed).length
    }
    
    // 截断摘要文本
    const truncateSummary = (summary) => {
      if (!summary) return ''
      return summary.length > 100 ? summary.substring(0, 100) + '...' : summary
    }
    
    // 组件挂载时加载数据
    onMounted(async () => {
      await loadPlans()
    })
    
    return {
      plans,
      loading,
      generating,
      dialogVisible,
      currentPlan,
      currentPlanId,
      generatingDialog,
      generatingProgress,
      generatingStatus,
      generatingText,
      
      generatePlan,
      viewPlanDetail,
      updateStepStatus,
      confirmDelete,
      printPlan,
      handleCloseDialog,
      
      formatDate,
      getStatusType,
      getProgressStatus,
      getStepColor,
      getCompletedStepsCount,
      truncateSummary
    }
  }
}
</script>

<style scoped>
.review-plan-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.loading-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.plans-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.plan-col {
  margin-bottom: 20px;
}

.plan-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-header h3 {
  margin: 0;
  font-size: 18px;
  flex: 1;
}

.plan-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.creation-time {
  font-size: 12px;
  color: #909399;
}

.plan-progress {
  margin: 15px 0;
}

.plan-summary {
  margin: 10px 0;
  color: #606266;
  font-size: 14px;
}

.plan-stats {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.plan-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
}

.plan-detail {
  padding: 0 20px;
}

.plan-detail h2 {
  margin-top: 0;
}

.plan-meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 15px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.step-card {
  margin-bottom: 10px;
}

.completed-step {
  background-color: #f0f9eb;
}

.step-content {
  margin-bottom: 10px;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completion-time {
  font-size: 12px;
  color: #67c23a;
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.generating-text {
  margin-top: 20px;
  font-size: 16px;
}

.tip-text {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
