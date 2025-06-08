<template>
  <div class="history-container">
    <h1 class="page-title">解答历史</h1>
    
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <h3>筛选条件</h3>
        </div>
      </template>
      
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="选择类型" clearable>
            <el-option label="快速解答" value="QUICK" />
            <el-option label="习题解析" value="EXPLAIN" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="fetchHistory">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="history-list-card mt-20">
      <template #header>
        <div class="card-header">
          <h3>历史记录</h3>
          <el-button-group>
            <el-button size="small" @click="refreshHistory">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
            <el-button size="small" type="danger" @click="confirmClearHistory">
              <el-icon><Delete /></el-icon> 清空
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="historyList.length === 0" class="empty-container">
        <el-empty description="暂无历史记录" />
      </div>
      
      <el-timeline v-else>
        <el-timeline-item
          v-for="(item, index) in historyList"
          :key="index"
          :timestamp="formatDate(item.timestamp)"
          placement="top"
          :type="getTimelineItemType(item.type)"
        >
          <el-card class="history-item-card">
            <template #header>
              <div class="history-item-header">
                <span class="history-item-type">{{ getTypeLabel(item.type) }}</span>
                <div class="history-item-actions">
                  <el-button size="small" @click="viewDetail(item)">查看详情</el-button>
                  <el-button size="small" type="danger" @click="deleteHistory(item.id)">删除</el-button>
                </div>
              </div>
            </template>
            
            <div class="history-item-content">
              <h4 class="history-item-title">{{ item.question }}</h4>
              <p class="history-item-preview">{{ truncateText(item.answer, 100) }}</p>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="解答详情"
      width="70%"
      destroy-on-close
    >
      <div v-if="currentDetail" class="detail-container">
        <el-divider content-position="left">问题</el-divider>
        <div class="detail-question">{{ currentDetail.question }}</div>
        
        <el-divider content-position="left">解答</el-divider>
        <div class="detail-answer" v-html="formatAnswer(currentDetail.answer)"></div>
        
        <el-divider content-position="left">时间</el-divider>
        <div class="detail-time">{{ formatDate(currentDetail.timestamp, true) }}</div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="copyDetail">复制内容</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="确认操作"
      width="30%"
    >
      <span>确定要清空所有历史记录吗？此操作不可恢复。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="clearHistory">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate as formatDateUtil } from '@/utils/date'

export default {
  name: 'QuestionHistoryView',
  setup() {
    // 状态变量
    const loading = ref(false)
    const historyList = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const detailDialogVisible = ref(false)
    const confirmDialogVisible = ref(false)
    const currentDetail = ref(null)
    
    // 筛选表单
    const filterForm = reactive({
      dateRange: [],
      type: ''
    })
    
    // 获取历史记录
    const fetchHistory = async () => {
      loading.value = true
      try {
        // 构建查询参数
        const params = {
          page: currentPage.value,
          pageSize: pageSize.value,
          agent_type: 'QuestionAgent'
        }
        
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          params.start_date = filterForm.dateRange[0]
          params.end_date = filterForm.dateRange[1]
        }
        
        if (filterForm.type) {
          params.subtype = filterForm.type
        }
        
        // 调用API
        const response = await import('@/api').then(module => {
          return module.default.conversations.getList(params)
        })
        
        if (response && response.status === 'success') {
          historyList.value = response.data || []
          total.value = response.total || 0
        } else {
          ElMessage.error(response?.message || '获取历史记录失败')
        }
      } catch (error) {
        console.error('获取历史记录出错:', error)
        ElMessage.error('获取历史记录失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
    
    // 刷新历史记录
    const refreshHistory = () => {
      fetchHistory()
    }
    
    // 重置筛选条件
    const resetFilter = () => {
      filterForm.dateRange = []
      filterForm.type = ''
      currentPage.value = 1
      fetchHistory()
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size
      fetchHistory()
    }
    
    const handleCurrentChange = (page) => {
      currentPage.value = page
      fetchHistory()
    }
    
    // 查看详情
    const viewDetail = (item) => {
      currentDetail.value = item
      detailDialogVisible.value = true
    }
    
    // 删除历史记录
    const deleteHistory = async (id) => {
      try {
        await ElMessageBox.confirm('确定要删除这条历史记录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 调用API删除
        const response = await import('@/api').then(module => {
          return module.default.conversations.delete(id)
        })
        
        if (response && response.status === 'success') {
          ElMessage.success('删除成功')
          fetchHistory()
        } else {
          ElMessage.error(response?.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除历史记录出错:', error)
          ElMessage.error('删除失败，请稍后重试')
        }
      }
    }
    
    // 确认清空历史
    const confirmClearHistory = () => {
      confirmDialogVisible.value = true
    }
    
    // 清空历史记录
    const clearHistory = async () => {
      try {
        // 调用API清空
        const response = await import('@/api').then(module => {
          return module.default.conversations.batchDelete({ agent_type: 'QuestionAgent' })
        })
        
        if (response && response.status === 'success') {
          ElMessage.success('清空成功')
          confirmDialogVisible.value = false
          fetchHistory()
        } else {
          ElMessage.error(response?.message || '清空失败')
        }
      } catch (error) {
        console.error('清空历史记录出错:', error)
        ElMessage.error('清空失败，请稍后重试')
      }
    }
    
    // 复制详情内容
    const copyDetail = () => {
      if (!currentDetail.value) return
      
      const content = `问题：${currentDetail.value.question}\n\n解答：${currentDetail.value.answer}`
      navigator.clipboard.writeText(content)
        .then(() => {
          ElMessage.success('内容已复制到剪贴板')
        })
        .catch(() => {
          ElMessage.error('复制失败，请手动复制')
        })
    }
    
    // 工具函数
    const formatDate = (timestamp, showTime = false) => {
      return formatDateUtil(timestamp, showTime)
    }
    
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
    
    const getTimelineItemType = (type) => {
      return type === 'QUICK' ? 'primary' : 'success'
    }
    
    const getTypeLabel = (type) => {
      return type === 'QUICK' ? '快速解答' : '习题解析'
    }
    
    const formatAnswer = (answer) => {
      if (!answer) return ''
      // 尝试解析JSON
      try {
        const data = JSON.parse(answer)
        if (data.explanation) {
          return data.explanation.replace(/\n/g, '<br>')
        }
        return answer.replace(/\n/g, '<br>')
      } catch (e) {
        // 如果不是JSON，直接返回文本
        return answer.replace(/\n/g, '<br>')
      }
    }
    
    // 生命周期钩子
    onMounted(() => {
      fetchHistory()
    })
    
    return {
      loading,
      historyList,
      currentPage,
      pageSize,
      total,
      filterForm,
      detailDialogVisible,
      confirmDialogVisible,
      currentDetail,
      fetchHistory,
      refreshHistory,
      resetFilter,
      handleSizeChange,
      handleCurrentChange,
      viewDetail,
      deleteHistory,
      confirmClearHistory,
      clearHistory,
      copyDetail,
      formatDate,
      truncateText,
      getTimelineItemType,
      getTypeLabel,
      formatAnswer
    }
  }
}
</script>

<style scoped>
.history-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  font-size: 1.8rem;
  color: var(--text-color);
}

.filter-card, .history-list-card {
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

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loading-container, .empty-container {
  padding: 20px;
  text-align: center;
}

.history-item-card {
  margin-bottom: 10px;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-item-type {
  font-weight: bold;
  color: var(--primary-color);
}

.history-item-actions {
  display: flex;
  gap: 10px;
}

.history-item-content {
  padding: 10px 0;
}

.history-item-title {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.history-item-preview {
  color: var(--text-color-secondary);
  margin: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.detail-container {
  padding: 10px;
}

.detail-question {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  white-space: pre-line;
}

.detail-answer {
  background-color: #f0f9eb;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  white-space: pre-line;
}

.detail-time {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.mt-20 {
  margin-top: 20px;
}
</style> 