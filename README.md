# 软件工程课程智能助手前端

这是软件工程课程智能助手的前端项目，基于Vue 3和Element Plus构建。

## 功能特点

- **习题解答**：提供软件工程课程习题解答，帮助更好地理解和掌握知识点
- **UML图生成**：根据描述自动生成各类UML图，帮助理解系统设计
- **知识解析**：解析软件工程相关概念，提供详细说明和案例
- **论文工具**：帮助搜索、分析论文，构建学习路径
- **测试工具**：生成测试用例，分析代码可测试性，解析测试概念
- **知识库管理**：管理个人知识库，随时查阅和更新

## 技术栈

- Vue 3 (Composition API)
- Vuex 4 (状态管理)
- Vue Router 4 (路由管理)
- Element Plus (UI组件库)
- Axios (HTTP客户端)
- Vite (构建工具)

## 开发环境要求

- Node.js 14.x 或更高版本
- npm 6.x 或更高版本

## 安装与运行

1. 克隆仓库
```bash
git clone <repository-url>
cd SE-Course-frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 项目结构

```
SE-Course-frontend/
├── public/            # 静态资源目录
├── src/
│   ├── api/           # API请求封装
│   ├── assets/        # 资源文件 (样式、图片等)
│   ├── components/    # Vue组件
│   ├── router/        # 路由配置
│   ├── store/         # Vuex状态管理
│   ├── utils/         # 工具函数
│   ├── views/         # 页面视图
│   ├── App.vue        # 根组件
│   └── main.js        # 应用入口
├── index.html         # HTML模板
├── vite.config.js     # Vite配置
└── package.json       # 项目配置
```

## 许可证

MIT 