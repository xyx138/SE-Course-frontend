import { createStore } from 'vuex'
import axios from 'axios'

// 从本地存储中获取令牌
const token = localStorage.getItem('token')
const userInfo = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null

export default createStore({
  state: {
    token: token || '',
    user: userInfo || {},
    loading: false,
    error: null,
    conversations: [],
    knowledgeBases: []
  },
  getters: {
    isLoggedIn: state => !!state.token,
    isAdmin: state => state.user && state.user.is_admin,
    authHeader: state => ({ 'Authorization': `Bearer ${state.token}` }),
    username: state => state.user && state.user.username,
    userId: state => state.user && state.user.id
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
    },
    SET_USER(state, user) {
      state.user = user
    },
    SET_LOADING(state, isLoading) {
      state.loading = isLoading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    CLEAR_ERROR(state) {
      state.error = null
    },
    LOGOUT(state) {
      state.token = ''
      state.user = {}
    },
    SET_CONVERSATIONS(state, conversations) {
      state.conversations = conversations
    },
    SET_KNOWLEDGE_BASES(state, knowledgeBases) {
      state.knowledgeBases = knowledgeBases
    }
  },
  actions: {
    // 用户认证相关
    async login({ commit }, credentials) {
      commit('SET_LOADING', true)
      commit('CLEAR_ERROR')
      try {
        // 创建表单数据
        const formData = new FormData()
        formData.append('username', credentials.username)
        formData.append('password', credentials.password)
        
        const response = await axios.post('/api/auth/login', formData)
        const { access_token, token_type, user_id, username, is_admin } = response.data
        
        // 存储令牌和用户信息
        const token = `${token_type} ${access_token}`
        const user = { id: user_id, username, is_admin }
        
        // 更新状态
        commit('SET_TOKEN', token)
        commit('SET_USER', user)
        
        // 保存到本地存储
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // 设置axios默认头部
        axios.defaults.headers.common['Authorization'] = token
        
        return { success: true }
      } catch (error) {
        const errorMessage = error.response && error.response.data.detail 
          ? error.response.data.detail
          : '登录失败，请检查网络连接'
        commit('SET_ERROR', errorMessage)
        return { success: false, message: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async register({ commit }, userData) {
      commit('SET_LOADING', true)
      commit('CLEAR_ERROR')
      try {
        const response = await axios.post('/api/auth/register', userData)
        return { success: true, data: response.data }
      } catch (error) {
        const errorMessage = error.response && error.response.data.detail 
          ? error.response.data.detail
          : '注册失败，请检查网络连接'
        commit('SET_ERROR', errorMessage)
        return { success: false, message: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    logout({ commit }) {
      // 清除状态
      commit('LOGOUT')
      
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // 清除axios默认头部
      delete axios.defaults.headers.common['Authorization']
    },
    
    // 会话历史相关
    async fetchConversations({ commit, getters }) {
      commit('SET_LOADING', true)
      try {
        const response = await axios.get('/api/conversations', {
          headers: getters.authHeader
        })
        commit('SET_CONVERSATIONS', response.data)
        return { success: true, data: response.data }
      } catch (error) {
        const errorMessage = error.response && error.response.data.detail
          ? error.response.data.detail
          : '获取会话历史失败'
        commit('SET_ERROR', errorMessage)
        return { success: false, message: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async deleteConversation({ commit, getters }, conversationId) {
      commit('SET_LOADING', true)
      try {
        await axios.delete(`/api/conversations/${conversationId}`, {
          headers: getters.authHeader
        })
        return { success: true }
      } catch (error) {
        const errorMessage = error.response && error.response.data.detail
          ? error.response.data.detail
          : '删除会话失败'
        commit('SET_ERROR', errorMessage)
        return { success: false, message: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 知识库相关
    async fetchKnowledgeBases({ commit, getters }) {
      commit('SET_LOADING', true)
      try {
        const response = await axios.get('/api/list_knowledge_bases', {
          headers: getters.authHeader
        })
        commit('SET_KNOWLEDGE_BASES', response.data)
        return { success: true, data: response.data }
      } catch (error) {
        const errorMessage = error.response && error.response.data.detail
          ? error.response.data.detail
          : '获取知识库失败'
        commit('SET_ERROR', errorMessage)
        return { success: false, message: errorMessage }
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },
  modules: {
    // 可以在这里添加其他模块
  }
}) 