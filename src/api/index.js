import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:8000/api', // 添加/api前缀
  timeout: 30000, // 请求超时时间，从30秒增加到120秒
  headers: {
    'Content-Type': 'application/json',
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      // 请求已发出，但服务器响应状态码不在 2xx 范围内
      console.error('API错误:', error.response.data)
      
      // 401未授权，清除token并跳转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        location.href = '/login'
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('请求无响应:', error.request)
    } else {
      // 设置请求时发生了一些事情，触发了错误
      console.error('请求错误:', error.message)
    }
    return Promise.reject(error)
  }
)

// API接口
export default {
  // 用户认证相关
  auth: {
    login(username, password) {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      return axios.post('/auth/login', formData)
    },
    register(userData) {
      return axios.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    getProfile() {
      return api.get('/auth/me')
    },
    updateProfile(userData) {
      return api.put('/auth/me', userData)
    },
    changePassword(currentPassword, newPassword) {
      const formData = new FormData();
      formData.append('current_password', currentPassword);
      formData.append('new_password', newPassword);
      
      return api.post('/auth/change-password', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
  },
  
  // 对话相关
  conversations: {
    getList(data) {
      return api.post('/conversations', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },

    delete(id) {
      return api.delete(`/conversations/${id}`)
    },
    deleteAll() {
      return api.delete('/conversations')
    },
  },
  
  // UML图生成相关
  uml: {
    generate(data) {
      return api.post('/umlAgent/generate_uml', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
  },
  
  // 习题解答相关
  question: {
    explain(data) {
      return api.post('/questionAgent/explain_question', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    generatePractice(data) {
      return api.post('/questionAgent/generate_practice_set', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    // 获取习题历史记录
    getPracticeHistory(params) {
      return api.get('/questionAgent/practice_history', { params })
    },
    // 获取特定历史记录项
    getPracticeHistoryItem(itemId) {
      return api.get(`/questionAgent/practice_history/${itemId}`)
    },
    // 保存习题历史记录
    savePracticeHistory(data) {
      return api.post('/questionAgent/save_practice_history', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    // 删除特定历史记录
    deletePracticeHistory(itemId) {
      return api.delete(`/questionAgent/practice_history/${itemId}`)
    },
    // 清空所有历史记录
    clearPracticeHistory() {
      return api.delete('/questionAgent/practice_history')
    },
    // 下载练习题
    downloadPracticeSet(data) {
      return api.post('/questionAgent/download_practice_set', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob' // 指定响应类型为二进制数据
      })
    },
    // 批改练习题
    gradePracticeSet(data) {
      return api.post('/questionAgent/grade_practice_set', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
  },
  
  // 知识解析相关
  explain: {
    getExplanation(data) {
      return api.post('/explainAgent/explain', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
  },
  
  // 论文工具相关
  paper: {
    // 搜索论文
    search(data) {
      return api.post('/paperAgent/search_papers', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    // 获取论文详情
    getDetail(data) {
      return api.post('/paperAgent/download_and_read_paper', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    // 分析论文对项目的应用价值
    analyzePaper(data) {
      return api.post('/paperAgent/analyze_paper_for_project', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    // 推荐学习路径
    recommendLearningPath(data) {
      return api.post('/paperAgent/recommend_learning_path', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
  },
  
  // 测试工具相关
  test: {
    generateTestCases(data) {
      return api.post('/testAgent/generate_test_cases', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    analyzeTestability(data) {
      return api.post('/testAgent/analyze_code_for_testability', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    evaluateTestCoverage(data) {
      return api.post('/testAgent/evaluate_test_coverage', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }
  },
  
  // 知识库相关
  knowledge: {
    // 获取知识库列表
    getKnowledgeBases() {
      return api.get('/list_knowledge_bases')
    },
    
    // 创建知识库
    createKnowledgeBase(formData) {
      return api.post('/create_or_update_index', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    
    // 更新知识库（添加新文件）
    updateKnowledgeBase(formData) {
      // 添加更新标志
      formData.append('is_update', 'true')
      return api.post('/create_or_update_index', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    
    // 删除知识库
    deleteKnowledgeBase(formData) {
      return api.post('/delete_knowledge_base', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    
    // 更新知识库标签（接入Agent）
    updateLabel(formData) {
      return api.post('/update_label', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    
    // 其他知识库相关接口
    getList(params) {
      return api.get('/knowledge', { params })
    },
    getDetail(id) {
      return api.get(`/knowledge/${id}`)
    },
    create(data) {
      return api.post('/knowledge', data)
    },
    update(id, data) {
      return api.put(`/knowledge/${id}`, data)
    },
    delete(id) {
      return api.delete(`/knowledge/${id}`)
    },
    getNotes(params) {
      return api.get('/knowledge/notes', { params })
    },
    createNote(data) {
      return api.post('/knowledge/notes', data)
    }
  },


  // 复习计划相关
  reviewPlan: {
    generate(data) {
      return api.post('/reviewAgent/generate_plan', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    getList(params) {
      return api.get('/reviewAgent/plans', { params })
    },
    getDetail(id) {
      return api.get(`/reviewAgent/plans/${id}`)
    },
    delete(planId) {
      return api.delete(`/reviewAgent/plans/${planId}`)
    },
    updateStepStatus(planId, stepId, isCompleted) {
      const formData = new FormData()
      formData.append('is_completed', isCompleted)
      return api.put(`/reviewAgent/plans/${planId}/steps/${stepId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    // 获取用户的复习计划列表，添加limit参数
    getPlans(limit) {
      const params = limit ? { limit } : {}
      return api.get('/reviewAgent/plans', { params })
    }
  }
} 