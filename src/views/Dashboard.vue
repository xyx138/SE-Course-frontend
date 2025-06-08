<template>
  <div class="dashboard-container">
    <h1 class="page-title">控制台</h1>
    
    <el-row :gutter="24">
      <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="6" v-for="(card, index) in statCards" :key="index">
        <el-card class="stat-card">
          <div class="stat-card-content">
            <el-icon :size="48" class="stat-icon">
              <component :is="card.icon"></component>
            </el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="24" class="mt-20">
      <el-col :xs="24" :sm="24" :md="16" :lg="18" :xl="18">
        <el-card class="recent-activity" v-loading="loading">
          <template #header>
            <div class="card-header">
              <h3>最近活动</h3>
              <el-button size="small" @click="refreshActivities">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          <div v-if="recentActivities.length === 0" class="empty-activities">
            <el-empty description="暂无活动记录" />
          </div>
          <el-timeline v-else>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.time"
              :type="activity.type"
            >
              <div class="activity-content">
                <div class="activity-main">
                  <div class="activity-query">{{ activity.query }}</div>
                  <div class="activity-time">{{ activity.datetime }}</div>
                </div>
                <el-tag size="small" :type="activity.category.tagType">{{ activity.category.name }}</el-tag>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8" :lg="6" :xl="6">
        <el-card class="quick-actions">
          <template #header>
            <div class="card-header">
              <h3>快捷操作</h3>
            </div>
          </template>
          <div class="action-list">
            <el-button 
              v-for="(action, index) in quickActions" 
              :key="index"
              type="primary" 
              plain 
              class="action-button"
              @click="navigateTo(action.route)"
            >
              <div class="action-icon">
                <el-icon><component :is="action.icon"></component></el-icon>
              </div>
              <span class="action-text">{{ action.label }}</span>
            </el-button>
          </div>
        </el-card>
        
        <el-card class="usage-stats mt-20">
          <template #header>
            <div class="card-header">
              <h3>使用统计</h3>
            </div>
          </template>
          <div class="usage-chart-container" v-loading="loading">
            <div v-if="categoryStats.length === 0" class="empty-stats">
              <el-empty description="暂无使用数据" />
            </div>
            <div v-else class="category-stats">
              <div 
                v-for="(stat, index) in categoryStats" 
                :key="index" 
                class="category-stat-item"
              >
                <div class="category-name">
                  <el-tag :type="stat.tagType" size="small">{{ stat.name }}</el-tag>
                </div>
                <div class="category-progress">
                  <el-progress 
                    :percentage="stat.percentage" 
                    :color="stat.color"
                    :format="() => `${stat.count}次`"
                    :stroke-width="12"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import api from '../api'

export default {
  name: 'DashboardView',
  setup() {
    const router = useRouter()
    const store = useStore()
    const loading = ref(false)
    const conversations = ref([])
    
    // 统计卡片数据
    const statCards = computed(() => [
      {
        label: '会话数',
        value: conversations.value.length.toString(),
        icon: 'ChatLineRound'
      },
      {
        label: '知识库',
        value: knowledgeBaseCount.value.toString(),
        icon: 'Collection'
      },
      {
        label: '学习天数',
        value: calculateLearningDays().toString(),
        icon: 'Calendar'
      }
    ])
    
    // 知识库数量
    const knowledgeBaseCount = ref(0)
    
    // 最近活动
    const recentActivities = computed(() => {
      // 按时间戳排序，确保最新的对话显示在前面
      const sortedConversations = [...conversations.value].sort((a, b) => {
        const timeA = new Date(a.timestamp ? a.timestamp * 1000 : 0).getTime()
        const timeB = new Date(b.timestamp ? b.timestamp * 1000 : 0).getTime()
        return timeB - timeA // 降序排列
      })
      
      // 取前5条对话
      return sortedConversations.slice(0, 8).map(conversation => {
        const category = getCategoryInfo(conversation.agent_type || 'general')
        return {
          query: conversation.query || '与AI助手的对话', // 显示用户的查询内容
          content: conversation.title || conversation.query || '与AI助手的对话',
          time: formatRelativeTime(conversation.timestamp),
          datetime: formatDateTime(conversation.timestamp, conversation.datetime), // 格式化日期时间
          type: category.timelineType,
          category: category
        }
      })
    })
    
    // 分类统计
    const categoryStats = computed(() => {
      if (conversations.value.length === 0) return []
      
      // 统计各类别数量
      const stats = {}
      
      // 预先初始化所有可能的类别，确保即使没有对话也会显示
      const allCategories = ['UmlAgent', 'AuestionAgent', 'ExplainAgent', 'PaperAgent', 'TestAgent', 'general']
      allCategories.forEach(category => {
        stats[category] = 0
      })
      
      // 统计实际对话中的类别数量
      conversations.value.forEach(conv => {
        const category = conv.agent_type || 'general'
        if (stats[category] !== undefined) {
          stats[category]++
        } else {
          // 处理可能的新类别
          stats[category] = 1
        }
      })
      
      // 转换为数组并计算百分比
      const totalCount = conversations.value.length || 1 // 避免除以零
      
      // 返回所有有使用次数的类别
      return Object.keys(stats)
        .filter(category => stats[category] > 0) // 只显示使用过的类别
        .map(category => {
          const categoryInfo = getCategoryInfo(category)
          return {
            name: categoryInfo.name,
            count: stats[category],
            percentage: Math.round((stats[category] / totalCount) * 100),
            color: categoryInfo.color,
            tagType: categoryInfo.tagType
          }
        })
        .sort((a, b) => b.count - a.count) // 按使用次数降序排序
    })
    
    // 快捷操作
    const quickActions = ref([
      {
        label: '生成UML图',
        icon: 'Connection',
        route: '/uml'
      },
      {
        label: '习题解答',
        icon: 'Document',
        route: '/question'
      },
      {
        label: '管理知识库',
        icon: 'Collection',
        route: '/knowledge'
      },
      {
        label: '论文工具',
        icon: 'Reading',
        route: '/paper'
      },
      {
        label: '测试工具',
        icon: 'Monitor',
        route: '/test'
      },
      {
        label: '复习计划',
        icon: 'Calendar',
        route: '/review'
      }
    ])
    
    // 导航到指定路由
    const navigateTo = (route) => {
      router.push(route)
    }
    
    // 获取所有对话
    const fetchConversations = async () => {
      loading.value = true
      try {
        // 创建请求参数，使用FormData传递
        const formData = new FormData()
        formData.append('limit', 100) // 限制返回20条记录
        // 如果需要过滤特定类型的对话，可以添加agent_type参数
        // formData.append('agent_type', '某个特定类型')
        
        const response = await api.conversations.getList(formData)
        if (response && response.status === 'success') {
          conversations.value = response.conversations || []
          console.log('获取到的对话数据:', conversations.value.length)
          
          // 调试日志：查看每个对话的agent_type
          const agentTypes = conversations.value.map(conv => conv.agent_type || 'general')
          const uniqueAgentTypes = [...new Set(agentTypes)]
          console.log('检测到的工具类型:', uniqueAgentTypes)
          
          // 统计每种类型的数量
          const typeCounts = {}
          agentTypes.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + 1
          })
          console.log('各类型使用次数:', typeCounts)
        } else {
          console.error('获取对话列表失败', response?.message || '未知错误')
          conversations.value = []
        }
      } catch (error) {
        console.error('获取对话列表失败', error)
        conversations.value = []
      } finally {
        loading.value = false
      }
    }
    
    // 获取知识库数量
    const fetchKnowledgeBaseCount = async () => {
      try {
        const response = await api.knowledge.getKnowledgeBases()
        if (response && response.status === 'success') {
          knowledgeBaseCount.value = response.knowledge_bases.length
        }
      } catch (error) {
        console.error('获取知识库列表失败', error)
      }
    }
    
    // 刷新活动数据
    const refreshActivities = () => {
      fetchConversations()
      fetchKnowledgeBaseCount()
    }
    
    // 格式化相对时间
    const formatRelativeTime = (timestamp) => {
      if (!timestamp) return ''
      
      try {
        // 转换为毫秒时间戳
        const date = new Date(timestamp * 1000)
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return ''
        }
        
        const now = new Date()
        const diffMs = now - date
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)
        
        if (diffDay > 30) {
          // 超过30天，显示具体日期
          return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
        } else if (diffDay > 0) {
          // 天数
          return `${diffDay}天前`
        } else if (diffHour > 0) {
          // 小时
          return `${diffHour}小时前`
        } else if (diffMin > 0) {
          // 分钟
          return `${diffMin}分钟前`
        } else {
          // 刚刚
          return '刚刚'
        }
      } catch (error) {
        console.error('格式化相对时间出错:', error)
        return ''
      }
    }
    
    // 格式化日期时间，显示为 YYYY-MM-DD HH:MM:SS 格式
    const formatDateTime = (timestamp, datetime) => {
      // 如果有预格式化的datetime字段，直接使用
      if (datetime && typeof datetime === 'string') {
        return datetime
      }
      
      if (!timestamp) return ''
      
      try {
        // 转换为毫秒时间戳
        const date = new Date(timestamp * 1000)
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return ''
        }
        
        // 格式化为 YYYY-MM-DD HH:MM:SS
        return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`
      } catch (error) {
        console.error('格式化日期时间出错:', error)
        return ''
      }
    }
    
    // 数字补零
    const padZero = (num) => {
      return num < 10 ? `0${num}` : num
    }
    
    // 获取分类信息 - 确保所有工具类型都被正确识别
    const getCategoryInfo = (category) => {
      const categoryMap = {
    'UmlAgent': { 
      name: 'UML图生成', 
      timelineType: 'primary', 
      tagType: 'primary',
      color: '#409EFF' // 蓝色
    },
    'QuestionAgent': { 
      name: '习题解答', 
      timelineType: 'success', 
      tagType: 'success',
      color: '#67C23A' // 绿色
    },
    'ExplainAgent': { 
      name: '知识解析', 
      timelineType: 'info', 
      tagType: 'info',
      color: '#909399' // 灰色
    },
    'PaperAgent': { 
      name: '论文工具', 
      timelineType: 'warning', 
      tagType: 'warning',
      color: '#E6A23C' // 橙色
    },
    'TestAgent': { 
      name: '测试工具', 
      timelineType: 'danger', 
      tagType: 'danger',
      color: '#F56C6C' // 红色
    },
    'general': { 
      name: '一般对话', 
      timelineType: 'default', 
      tagType: 'default',
      color: '#C0C4CC' // 淡灰色
    },
    'ReviewPlanAgent': {
      name: '复习计划',
      timelineType: 'custom',
      tagType: 'custom',
      color: '#B882FF' // 紫色，独立色系
    }
  };
      
      // 如果找不到对应的类别，返回一个默认值并记录未知类别
      if (!categoryMap[category]) {
        console.warn(`未知的工具类别: ${category}，将使用默认样式`)
      }
      
      return categoryMap[category] || {
        name: category || '未知工具', 
        timelineType: '', 
        tagType: '',
        color: '#909399'
      }
    }
    
    // 计算学习天数
    const calculateLearningDays = () => {
      if (conversations.value.length === 0) return 0
      
      // 获取所有对话的日期（按天）
      const dates = conversations.value
        .map(conv => {
          try {
            if (!conv.timestamp) return null
            
            const date = new Date(conv.timestamp * 1000)
            // 检查日期是否有效
            if (isNaN(date.getTime())) {
              return null
            }
            return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
          } catch (error) {
            console.error('处理日期出错:', error)
            return null
          }
        })
        .filter(date => date !== null) // 过滤掉无效日期
      
      // 去重计算不同的天数
      const uniqueDates = [...new Set(dates)]
      return uniqueDates.length
    }
    
    onMounted(() => {
      fetchConversations()
      fetchKnowledgeBaseCount()
    })
    
    return {
      loading,
      statCards,
      recentActivities,
      quickActions,
      categoryStats,
      navigateTo,
      refreshActivities
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 10px 0;
}

.page-title {
  margin-bottom: 24px;
  font-size: 1.8rem;
  color: var(--text-color);
}

.stat-card {
  margin-bottom: 20px;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  color: var(--primary-color);
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-color);
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
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

.recent-activity {
  height: 100%;
  border-radius: 8px;
}

.quick-actions, .usage-stats {
  border-radius: 8px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 15px;
  width: 100%;
}

.action-button .el-icon {
  margin-right: 10px;
  width: 20px;  /* 固定图标宽度 */
  display: flex;
  justify-content: center; /* 图标居中 */
  align-items: center;
}

.action-button span {
  flex: 1;  /* 文字占据剩余空间 */
  text-align: left; /* 文字左对齐 */
}

.activity-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.activity-main {
  flex-grow: 1;
  margin-right: 10px;
}

.activity-query {
  font-weight: bold;
  margin-bottom: 5px;
  word-break: break-word;
}

.activity-time {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.empty-activities, .empty-stats {
  padding: 30px 0;
  display: flex;
  justify-content: center;
}

.category-stats {
  padding: 10px 0;
}

.category-stat-item {
  margin-bottom: 15px;
}

.category-name {
  margin-bottom: 5px;
}

.mt-20 {
  margin-top: 20px;
}

.action-icon {
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
}

.action-text {
  flex: 1;
  text-align: left;
}
</style> 