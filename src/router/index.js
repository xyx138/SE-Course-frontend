import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import { ElMessage } from 'element-plus'

// 懒加载路由
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/auth/Login.vue')
const Register = () => import('../views/auth/Register.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const Profile = () => import('../views/Profile.vue')
const Conversations = () => import('../views/Conversations.vue')

// UML图生成相关路由
const UmlIndex = () => import('../views/uml/Index.vue')

// 习题解答相关路由
const QuestionIndex = () => import('../views/question/Index.vue')
const QuestionPractice = () => import('../views/question/Practice.vue')
const QuestionExplain = () => import('../views/question/Explain.vue')

// 知识解析相关路由
const ExplainIndex = () => import('../views/explain/Index.vue')

// 论文工具相关路由
const PaperIndex = () => import('../views/paper/Index.vue')
const PaperSearch = () => import('../views/paper/PaperSearch.vue')
const PaperAnalyze = () => import('../views/paper/PaperAnalyze.vue')
const PaperLearningPath = () => import('../views/paper/PaperLearningPath.vue')

// 测试工具相关路由
const TestIndex = () => import('../views/test/Index.vue')
const TestGenerator = () => import('../views/test/TestGenerator.vue')
const TestAnalysis = () => import('../views/test/TestAnalysis.vue')
const TestCoverage = () => import('../views/test/TestCoverage.vue')

// 知识库管理相关路由
const KnowledgeIndex = () => import('../views/knowledge/Index.vue')
const KnowledgeBuilder = () => import('../views/knowledge/KnowledgeBuilder.vue')
const NotesBuilder = () => import('../views/knowledge/NotesBuilder.vue')
const MistakesBuilder = () => import('../views/knowledge/MistakesBuilder.vue')
const ReviewPlan = () => import('../views/knowledge/ReviewPlan.vue')

// 404页面
const NotFound = () => import('../views/NotFound.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页 - 软件工程课程智能助手'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录 - 软件工程课程智能助手'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册 - 软件工程课程智能助手'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      title: '控制台 - 软件工程课程智能助手'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      requiresAuth: true,
      title: '个人资料 - 软件工程课程智能助手'
    }
  },
  {
    path: '/conversations',
    name: 'Conversations',
    component: Conversations,
    meta: {
      requiresAuth: true,
      title: '历史会话 - 软件工程课程智能助手'
    }
  },
  // UML图生成路由
  {
    path: '/uml',
    name: 'UmlIndex',
    component: UmlIndex,
    meta: {
      requiresAuth: true,
      title: 'UML图生成 - 软件工程课程智能助手'
    }
  },
  // 习题解答路由组
  {
    path: '/question',
    name: 'QuestionIndex',
    component: QuestionIndex,
    meta: {
      requiresAuth: true,
      title: '习题解答 - 软件工程课程智能助手'
    }
  },
  {
    path: '/question/practice',
    name: 'QuestionPractice',
    component: QuestionPractice,
    meta: {
      requiresAuth: true,
      title: '练习题生成 - 软件工程课程智能助手'
    }
  },
  {
    path: '/question/explain',
    name: 'QuestionExplain',
    component: QuestionExplain,
    meta: {
      requiresAuth: true,
      title: '习题解析 - 软件工程课程智能助手'
    }
  },
  // 知识解析路由
  {
    path: '/explain',
    name: 'ExplainIndex',
    component: ExplainIndex,
    meta: {
      requiresAuth: true,
      title: '知识解析 - 软件工程课程智能助手'
    }
  },
  // 论文工具路由
  {
    path: '/paper',
    name: 'PaperIndex',
    component: PaperIndex,
    meta: {
      requiresAuth: true,
      title: '论文工具 - 软件工程课程智能助手'
    }
  },
  {
    path: '/paper/search',
    name: 'PaperSearch',
    component: PaperSearch,
    meta: {
      requiresAuth: true,
      title: '论文搜索 - 软件工程课程智能助手'
    }
  },
  {
    path: '/paper/analyze',
    name: 'PaperAnalyze',
    component: PaperAnalyze,
    meta: {
      requiresAuth: true,
      title: '论文应用价值分析 - 软件工程课程智能助手'
    }
  },
  {
    path: '/paper/learning-path',
    name: 'PaperLearningPath',
    component: PaperLearningPath,
    meta: {
      requiresAuth: true,
      title: '学习路径推荐 - 软件工程课程智能助手'
    }
  },
  
  // 测试工具路由
  {
    path: '/test',
    name: 'TestIndex',
    component: TestIndex,
    meta: {
      requiresAuth: true,
      title: '测试工具 - 软件工程课程智能助手'
    }
  },
  {
    path: '/test/generator',
    name: 'TestGenerator',
    component: TestGenerator,
    meta: {
      requiresAuth: true,
      title: '测试用例生成 - 软件工程课程智能助手'
    }
  },
  {
    path: '/test/analysis',
    name: 'TestAnalysis',
    component: TestAnalysis,
    meta: {
      requiresAuth: true,
      title: '代码可测性分析 - 软件工程课程智能助手'
    }
  },
  {
    path: '/test/coverage',
    name: 'TestCoverage',
    component: TestCoverage,
    meta: {
      requiresAuth: true,
      title: '测试覆盖率评估 - 软件工程课程智能助手'
    }
  },
  // 知识库管理路由
  {
    path: '/knowledge',
    name: 'KnowledgeIndex',
    component: KnowledgeIndex,
    meta: {
      requiresAuth: true,
      title: '知识库管理 - 软件工程课程智能助手'
    }
  },
  {
    path: '/knowledge/builder',
    name: 'KnowledgeBuilder',
    component: KnowledgeBuilder,
    meta: {
      requiresAuth: true,
      title: '构建知识库 - 软件工程课程智能助手'
    }
  },
  {
    path: '/knowledge/notes',
    name: 'NotesBuilder',
    component: NotesBuilder,
    meta: {
      requiresAuth: true,
      title: '学习笔记 - 软件工程课程智能助手'
    }
  },
  {
    path: '/knowledge/mistakes',
    name: 'MistakesBuilder',
    component: MistakesBuilder,
    meta: {
      requiresAuth: true,
      title: '错题集 - 软件工程课程智能助手'
    }
  },
  {
    path: '/knowledge/plan',
    name: 'ReviewPlan',
    component: ReviewPlan,
    meta: {
      requiresAuth: true,
      title: '复习计划 - 软件工程课程智能助手'
    }
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面未找到 - 软件工程课程智能助手'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局导航守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '软件工程课程智能助手'
  
  // 检查是否需要登录
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!store.getters.isLoggedIn) {
      ElMessage.warning('请先登录再访问此功能')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    // 检查本地存储中是否有token，如果有但store中没有，则更新store
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && !store.getters.isLoggedIn) {
      store.commit('SET_TOKEN', token)
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          store.commit('SET_USER', user)
        } catch (e) {
          console.error('解析用户信息失败', e)
        }
      }
    }
    next()
  }
})

export default router 