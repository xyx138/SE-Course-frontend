<template>
  <div class="app-container">
    <Header v-if="showHeader" />
    <div class="main-content">
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import Header from '@/components/layout/Header.vue'

export default {
  name: 'App',
  components: {
    Header
  },
  setup() {
    const route = useRoute()
    const store = useStore()

    // 根据路由判断是否显示头部
    const showHeader = computed(() => {
      return !route.meta.hideHeader
    })

    return {
      showHeader
    }
  }
}
</script>

<style>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px 20px;
  background-color: var(--background-color);
  width: 100%;
}

@media (min-width: 1600px) {
  .main-content {
    max-width: 90%;
  }
}
</style> 