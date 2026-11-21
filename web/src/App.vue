<script setup>
/**
 * 应用外壳：左侧导航 + 顶部标题 + 内容区 + 全局轻提示
 */
import { computed, onMounted } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { loadMeta, store } from './store/index.js';
import { toasts } from './store/toast.js';

const route = useRoute();
const menus = [
  { path: '/home', label: '首页概览', desc: '格言·待办·倒计时' },
  { path: '/schedule', label: '课表安排', desc: '导入与编辑课表' },
  { path: '/rollcall', label: '随机点名', desc: '随机抽取学生' },
  { path: '/grades', label: '学生成绩', desc: '导入与排序' },
  { path: '/exam', label: '智能组卷', desc: '跳转组卷系统' },
  { path: '/students', label: '学生信息', desc: '学生档案管理' },
  { path: '/points', label: '荣誉积分', desc: '积分排名榜' },
];

const subtitles = {
  '/home': '每日格言、待办提醒、时政热点、考试倒计时与班级概览',
  '/schedule': '导入文件或图片生成课表，支持在线编辑',
  '/rollcall': '按单个 / 5 个 / 10 个随机抽取学生，并评定积分',
  '/grades': '导入成绩文件，按总分自动排序，展示各科成绩',
  '/exam': '跳转到智能组卷独立系统进行自动组卷',
  '/students': '维护学生姓名、性别与家长联系方式',
  '/points': '实时展示班级积分排名，数据来自随机点名评定',
};

const title = computed(() => route.meta.title || '教育教学管理系统');
const subtitle = computed(() => subtitles[route.path] || '');
const dbReady = computed(() => Boolean(store.meta?.dbReady));

onMounted(() => { loadMeta(); });
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">育</div>
        <div>
          <div class="brand-name">教育教学管理系统</div>
          <div class="brand-sub">教师工作台</div>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-caption">工作台</div>
        <RouterLink
          v-for="item in menus"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-dot" />
          <span>
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-desc">{{ item.desc }}</span>
          </span>
        </RouterLink>
      </nav>

      <div class="sidebar-foot">
        <div class="status-line">
          <span class="status-dot" :class="dbReady ? 'ok' : 'bad'" />
          {{ store.meta ? (dbReady ? '数据已连接' : '数据未连接') : '正在连接服务…' }}
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <div class="topbar-right">
          <span v-if="!store.meta || !dbReady" class="warn-chip">数据服务未就绪</span>
          <span class="badge">教师端</span>
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>

    <div class="toast-host">
      <TransitionGroup name="toast">
        <div v-for="item in toasts" :key="item.id" class="toast" :class="`toast-${item.type}`">
          {{ item.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
