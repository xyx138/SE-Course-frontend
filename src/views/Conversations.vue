<template>
  <div class="conversations-container">
    <div class="page-header">
      <h1 class="page-title">历史会话</h1>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索会话"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-button type="danger" @click="showDeleteConfirm" :disabled="selectedConversations.length === 0">
          删除选中
        </el-button>
      </div>
    </div>
    
    <el-card v-if="loading" class="loading-card">
      <el-skeleton :rows="5" animated />
    </el-card>
    
    <el-empty v-else-if="filteredConversations.length === 0" description="暂无历史会话" />
    
    <el-table
      v-else
      ref="tableRef"
      :data="filteredConversations"
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="时间" prop="time" width="180">
        <template #default="scope">
          <div class="time-column">
            <span>{{ formatDate(scope.row.time) }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="类型" prop="type" width="120">
        <template #default="scope">
          <el-tag :type="getTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="内容摘要" prop="summary">
        <template #default="scope">
          <div class="summary-column">
            <span>{{ scope.row.summary }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button-group>
            <el-button type="primary" size="small" @click="viewConversation(scope.row)">
              查看
            </el-button>
            <el-button type="danger" size="small" @click="deleteConversation(scope.row)">
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    
    <el-dialog
      v-model="detailDialogVisible"
      title="会话详情"
      width="70%"
    >
      <div v-if="currentConversation" class="conversation-detail">
        <div class="detail-header">
          <div class="detail-time">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDate(currentConversation.time) }}</span>
          </div>
          <el-tag :type="getTagType(currentConversation.type)">
            {{ currentConversation.type }}
          </el-tag>
        </div>
        
        <div class="detail-content">
          <div v-for="(message, index) in currentConversation.messages" :key="index" 
            :class="['message', message.role === 'user' ? 'user-message' : 'assistant-message']">
            <div class="message-role">{{ message.role === 'user' ? '我' : '智能助手' }}</div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessageBox, ElMessage } from 'element-plus'

export default {
  name: 'ConversationsView',
  setup() {
    const store = useStore()
    const loading = ref(true)
    const searchQuery = ref('')
    const selectedConversations = ref([])
    const tableRef = ref(null)
    const detailDialogVisible = ref(false)
    const currentConversation = ref(null)
    
    // 模拟会话数据
    const conversations = ref([
      {
        id: '1',
        time: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
        type: 'UML图生成',
        summary: '生成订单管理系统的类图',
        messages: [
          { role: 'user', content: '帮我生成一个订单管理系统的类图' },
          { role: 'assistant', content: '已为您生成订单管理系统的类图，包含订单、客户、商品等核心类，以及它们之间的关系。' }
        ]
      },
      {
        id: '2',
        time: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3小时前
        type: '习题解答',
        summary: '软件需求分析相关习题解答',
        messages: [
          { role: 'user', content: '请解答这道软件需求分析的题目：在需求分析阶段，常用的建模工具有哪些？' },
          { role: 'assistant', content: '在软件需求分析阶段，常用的建模工具包括：1. UML图（用例图、类图、时序图等）；2. 数据流图；3. 实体关系图；4. 状态图；5. 原型工具。这些工具帮助分析人员更好地理解和表达需求。' }
        ]
      },
      {
        id: '3',
        time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
        type: '知识解析',
        summary: '敏捷开发方法论解析',
        messages: [
          { role: 'user', content: '请详细解释敏捷开发方法论' },
          { role: 'assistant', content: '敏捷开发是一种以人为核心、迭代、循序渐进的开发方法。它的核心价值包括：个体和互动高于流程和工具；工作的软件高于详尽的文档；客户合作高于合同谈判；响应变化高于遵循计划。常见的敏捷开发方法有Scrum、XP、看板等。' }
        ]
      }
    ])
    
    // 根据搜索关键词过滤会话
    const filteredConversations = computed(() => {
      if (!searchQuery.value) {
        return conversations.value
      }
      
      const query = searchQuery.value.toLowerCase()
      return conversations.value.filter(conversation => 
        conversation.summary.toLowerCase().includes(query) ||
        conversation.type.toLowerCase().includes(query)
      )
    })
    
    // 格式化日期
    const formatDate = (date) => {
      const now = new Date()
      const diff = now - date
      
      // 如果是今天
      if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
      
      // 如果是昨天
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
      
      // 其他情况
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 根据类型获取标签类型
    const getTagType = (type) => {
      const typeMap = {
        'UML图生成': 'primary',
        '习题解答': 'success',
        '知识解析': 'info',
        '论文工具': 'warning',
        '测试工具': 'danger'
      }
      
      return typeMap[type] || ''
    }
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedConversations.value = selection
    }
    
    // 查看会话详情
    const viewConversation = (conversation) => {
      currentConversation.value = conversation
      detailDialogVisible.value = true
    }
    
    // 删除单个会话
    const deleteConversation = (conversation) => {
      ElMessageBox.confirm(
        '确定要删除此会话记录吗？此操作不可恢复。',
        '删除会话',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 这里应该调用API删除会话
        conversations.value = conversations.value.filter(item => item.id !== conversation.id)
        ElMessage.success('会话已成功删除')
      }).catch(() => {
        // 取消删除
      })
    }
    
    // 批量删除会话
    const showDeleteConfirm = () => {
      if (selectedConversations.value.length === 0) return
      
      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedConversations.value.length} 条会话记录吗？此操作不可恢复。`,
        '批量删除会话',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 这里应该调用API批量删除会话
        const selectedIds = selectedConversations.value.map(item => item.id)
        conversations.value = conversations.value.filter(item => !selectedIds.includes(item.id))
        ElMessage.success(`已成功删除 ${selectedIds.length} 条会话`)
        selectedConversations.value = []
      }).catch(() => {
        // 取消删除
      })
    }
    
    // 加载会话数据
    const fetchConversations = async () => {
      loading.value = true
      
      try {
        // 这里应该调用API获取会话记录
        // 模拟API调用延迟
        setTimeout(() => {
          // 已使用模拟数据
          loading.value = false
        }, 1000)
      } catch (error) {
        ElMessage.error('获取会话记录失败')
        loading.value = false
      }
    }
    
    onMounted(() => {
      fetchConversations()
    })
    
    return {
      loading,
      searchQuery,
      conversations,
      filteredConversations,
      selectedConversations,
      tableRef,
      detailDialogVisible,
      currentConversation,
      formatDate,
      getTagType,
      handleSelectionChange,
      viewConversation,
      deleteConversation,
      showDeleteConfirm
    }
  }
}
</script>

<style scoped>
.conversations-container {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 300px;
}

.loading-card {
  padding: 20px;
  margin-bottom: 20px;
}

.time-column, .summary-column {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.conversation-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.detail-time {
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
}

.detail-time .el-icon {
  margin-right: 5px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  padding: 15px;
  border-radius: 8px;
  position: relative;
}

.user-message {
  background-color: #ecf8ff;
  align-self: flex-end;
  margin-left: 50px;
}

.assistant-message {
  background-color: #f2f6fc;
  align-self: flex-start;
  margin-right: 50px;
}

.message-role {
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--primary-color);
}

.message-content {
  color: var(--text-color);
  white-space: pre-line;
}
</style> 