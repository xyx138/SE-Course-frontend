<template>
  <el-aside width="220px" class="app-sidebar">
    <el-menu
      :default-active="activeIndex"
      class="sidebar-menu"
      :router="true"
      :collapse="isCollapse"
    >
      <el-menu-item index="/dashboard">
        <el-icon><Grid /></el-icon>
        <template #title>控制台</template>
      </el-menu-item>
      
      <el-sub-menu index="question">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>习题解答</span>
        </template>
        <el-menu-item index="/question/practice">练习题生成</el-menu-item>
        <el-menu-item index="/question/explain">习题解析</el-menu-item>
        <el-menu-item index="/question/history">解答历史</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="uml">
        <template #title>
          <el-icon><Connection /></el-icon>
          <span>UML图生成</span>
        </template>
        <el-menu-item index="/uml/class">类图</el-menu-item>
        <el-menu-item index="/uml/sequence">序列图</el-menu-item>
        <el-menu-item index="/uml/activity">活动图</el-menu-item>
        <el-menu-item index="/uml/usecase">用例图</el-menu-item>
        <el-menu-item index="/uml/state">状态图</el-menu-item>
        <el-menu-item index="/uml/component">组件图</el-menu-item>
        <el-menu-item index="/uml/deployment">部署图</el-menu-item>
        <el-menu-item index="/uml/object">对象图</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="explain">
        <template #title>
          <el-icon><Reading /></el-icon>
          <span>知识解析</span>
        </template>
        <el-menu-item index="/explain/concept">概念解析</el-menu-item>
        <el-menu-item index="/explain/document">文档生成</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="paper">
        <template #title>
          <el-icon><Files /></el-icon>
          <span>论文工具</span>
        </template>
        <el-menu-item index="/paper/search">论文搜索</el-menu-item>
        <el-menu-item index="/paper/analyze">论文分析</el-menu-item>
        <el-menu-item index="/paper/path">学习路径</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="test">
        <template #title>
          <el-icon><Operation /></el-icon>
          <span>测试工具</span>
        </template>
        <el-menu-item index="/test/generate">测试用例生成</el-menu-item>
        <el-menu-item index="/test/analyze">代码可测试性分析</el-menu-item>
        <el-menu-item index="/test/concept">测试概念解析</el-menu-item>
        <el-menu-item index="/test/plan">测试计划生成</el-menu-item>
        <el-menu-item index="/test/coverage">测试覆盖率评估</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/knowledge">
        <el-icon><Collection /></el-icon>
        <template #title>知识库管理</template>
      </el-menu-item>
      
      <el-menu-item index="/conversations">
        <el-icon><ChatLineRound /></el-icon>
        <template #title>历史会话</template>
      </el-menu-item>
    </el-menu>
    
    <div class="sidebar-footer">
      <el-button type="text" @click="toggleCollapse">
        <el-icon v-if="isCollapse"><Expand /></el-icon>
        <el-icon v-else><Fold /></el-icon>
      </el-button>
    </div>
  </el-aside>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'AppSidebar',
  setup() {
    const route = useRoute()
    const isCollapse = ref(false)
    
    const activeIndex = computed(() => {
      return route.path
    })
    
    const toggleCollapse = () => {
      isCollapse.value = !isCollapse.value
    }
    
    return {
      isCollapse,
      activeIndex,
      toggleCollapse
    }
  }
}
</script>

<style scoped>
.app-sidebar {
  height: 100%;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  height: calc(100% - 40px);
  overflow-y: auto;
}

.sidebar-footer {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--border-color);
}

:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
}

:deep(.el-menu-item:hover) {
  background-color: #f5f7fa;
}
</style> 