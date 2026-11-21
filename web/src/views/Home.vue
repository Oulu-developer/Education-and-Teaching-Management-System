<script setup>
/**
 * 首页概览：每日格言（两句）、今日待办、考试动态倒计时、多类新闻（带图）、班级总人数
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api } from '../api/index.js';
import AppModal from '../components/AppModal.vue';

const summary = ref({ quotes: [], todos: [], exams: [], unfinishedCount: 0, totalStudents: 0, classCount: 0, quote: '' });
const news = ref([]);

const quoteInput = ref('');
const todoForm = ref({ content: '', deadline: '' });
const examForm = ref({ name: '', exam_date: '' });
const quoteVisible = ref(false);
const todoVisible = ref(false);
const examVisible = ref(false);

async function load() {
  const [s, n] = await Promise.all([api.summary(), api.news()]);
  summary.value = s;
  news.value = n;
}
onMounted(load);

/* ---- 动态倒计时：每秒刷新 ---- */
const nowTick = ref(Date.now());
let timer = null;
onMounted(() => { timer = setInterval(() => { nowTick.value = Date.now(); }, 1000); });
onUnmounted(() => { if (timer) clearInterval(timer); });

function countdown(dateStr) {
  const target = new Date(`${String(dateStr || '').slice(0, 10)}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - nowTick.value;
  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.max(0, Math.floor(totalSec / 86400)),
    hours: Math.max(0, Math.floor((totalSec % 86400) / 3600)),
    minutes: Math.max(0, Math.floor((totalSec % 3600) / 60)),
    seconds: Math.max(0, totalSec % 60),
    diff,
  };
}
const pad = (n) => String(n).padStart(2, '0');
function fmtExamDate(str) { return String(str || '').slice(0, 10); }

/* ---- 格言 ---- */
async function addQuote() {
  if (!quoteInput.value.trim()) return;
  await api.createQuote({ content: quoteInput.value });
  quoteInput.value = '';
  quoteVisible.value = false;
  load();
}

/* ---- 待办 ---- */
async function addTodo() {
  if (!todoForm.value.content.trim() || !todoForm.value.deadline) return;
  await api.createTodo(todoForm.value);
  todoForm.value = { content: '', deadline: '' };
  todoVisible.value = false;
  load();
}
async function toggleTodo(t) {
  await api.updateTodo(t.id, { done: !t.done });
  load();
}
async function removeTodo(id) {
  await api.deleteTodo(id);
  load();
}

/* ---- 考试 ---- */
async function addExam() {
  if (!examForm.value.name || !examForm.value.exam_date) return;
  await api.createExam(examForm.value);
  examForm.value = { name: '', exam_date: '' };
  examVisible.value = false;
  load();
}
async function removeExam(id) {
  await api.deleteExam(id);
  load();
}

function fmtDeadline(str) {
  return String(str || '').replace('T', ' ').slice(0, 16);
}

/* ---- 新闻分类配色 ---- */
const categoryClass = (c) => ({
  '要闻': 'cat-yaowen', '国际': 'cat-guonei', '学术': 'cat-xueshu', '政治': 'cat-zhengzhi', '财经': 'cat-caijing',
}[c] || 'cat-yaowen');
const categoryEmoji = (c) => ({
  '要闻': '🔥', '国际': '🌍', '学术': '🤖', '政治': '🏛️', '财经': '📈',
}[c] || '📰');
</script>

<template>
  <div>
    <!-- 统计块（彩色渐变） -->
    <div class="stat-grid">
      <div class="stat stat-c1"><div class="stat-emoji">🏫</div><div class="stat-value">{{ summary.classCount }}</div><div class="stat-label">班级数量</div></div>
      <div class="stat stat-c2"><div class="stat-emoji">🧑‍🎓</div><div class="stat-value">{{ summary.totalStudents }}</div><div class="stat-label">班级总人数</div></div>
      <div class="stat stat-c3"><div class="stat-emoji">📝</div><div class="stat-value">{{ summary.unfinishedCount }}</div><div class="stat-label">未完成待办</div></div>
      <div class="stat stat-c4"><div class="stat-emoji">📅</div><div class="stat-value">{{ summary.exams.length }}</div><div class="stat-label">考试安排</div></div>
    </div>

    <!-- 每日格言（两句·励志） -->
    <div class="card quote-card mt-18">
      <div class="card-head">
        <div class="card-title">每日格言</div>
        <button class="btn btn-soft btn-sm" @click="quoteVisible = true">＋ 添加格言</button>
      </div>
      <div class="card-body quote-list">
        <div
          v-for="(q, i) in summary.quotes"
          :key="i"
          class="quote-box"
          :class="`quote-theme-${i % 3}`"
        >
          <div class="quote-mark">“</div>
          <div class="quote-body">
            <div class="quote-text">{{ q.content }}</div>
            <div class="quote-footer">
              <span class="quote-tag" :class="q.source === 'system' ? 'tag-system' : 'tag-teacher'">
                {{ q.source === 'system' ? '系统推送' : '教师添加' }}
              </span>
              <span v-if="q.author" class="quote-author">—— {{ q.author }}</span>
            </div>
          </div>
        </div>
        <div v-if="summary.quotes.length === 0" class="hint">暂无格言，点击右上角添加。</div>
      </div>
    </div>

    <div class="grid-2">
      <!-- 今日待办 -->
      <div class="card" style="margin-bottom:0">
        <div class="card-head">
          <div class="card-title">今日待办</div>
          <button class="btn btn-soft btn-sm" @click="todoVisible = true">＋ 添加待办</button>
        </div>
        <div class="card-body">
          <div v-if="summary.todos.length === 0" class="hint">暂无待办。</div>
          <div v-for="t in summary.todos" :key="t.id" class="todo-item">
            <input type="checkbox" class="todo-check" :checked="t.done" @change="toggleTodo(t)" />
            <div class="todo-content">
              <div :class="{ 'todo-done': t.done }">{{ t.content }}</div>
              <div class="hint" :style="{ color: t.overdue ? '#dc2626' : '' }">
                最迟 {{ fmtDeadline(t.deadline) }} {{ t.overdue ? '· 已超时' : '' }}
              </div>
            </div>
            <button class="btn-link danger" @click="removeTodo(t.id)">删除</button>
          </div>
        </div>
      </div>

      <!-- 考试动态倒计时 -->
      <div class="card" style="margin-bottom:0">
        <div class="card-head">
          <div class="card-title">考试倒计时</div>
          <button class="btn btn-soft btn-sm" @click="examVisible = true">＋ 添加考试</button>
        </div>
        <div class="card-body">
          <div v-if="summary.exams.length === 0" class="hint">暂无考试安排。</div>
          <div v-for="e in summary.exams" :key="e.id" class="countdown-item">
            <div class="countdown-info">
              <div class="countdown-name">{{ e.name }}</div>
              <div class="hint">{{ fmtExamDate(e.exam_date) }}</div>
            </div>
            <div class="countdown-clock">
              <template v-if="countdown(e.exam_date)?.diff > 0">
                <div class="clock-block"><span class="clock-num">{{ countdown(e.exam_date).days }}</span><span class="clock-unit">天</span></div>
                <span class="clock-colon">:</span>
                <div class="clock-block"><span class="clock-num">{{ pad(countdown(e.exam_date).hours) }}</span><span class="clock-unit">时</span></div>
                <span class="clock-colon">:</span>
                <div class="clock-block"><span class="clock-num">{{ pad(countdown(e.exam_date).minutes) }}</span><span class="clock-unit">分</span></div>
                <span class="clock-colon">:</span>
                <div class="clock-block"><span class="clock-num clock-sec">{{ pad(countdown(e.exam_date).seconds) }}</span><span class="clock-unit">秒</span></div>
              </template>
              <span v-else class="tag tag-red">{{ countdown(e.exam_date)?.diff === 0 ? '就是今天' : '已结束' }}</span>
            </div>
            <button class="btn-link danger" @click="removeExam(e.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新闻热点（多类带图） -->
    <div class="card mt-18">
      <div class="card-head">
        <div class="card-title">今日新闻热点</div>
        <span class="hint">国内 · 国际 · 学术 · 政治</span>
      </div>
      <div class="card-body">
        <div v-if="news.length === 0" class="hint">今日暂无热点更新。</div>
        <div class="news-grid">
          <a
            v-for="n in news"
            :key="n.id"
            class="news-card"
            :href="n.url || undefined"
            :target="n.url ? '_blank' : undefined"
          >
            <div class="news-thumb" :class="{ 'news-thumb-empty': !n.image }">
              <img v-if="n.image" :src="n.image" :alt="n.title" loading="lazy" @error="$event.target.style.display='none'" />
              <span v-else class="news-thumb-emoji">{{ categoryEmoji(n.category) }}</span>
            </div>
            <div class="news-card-body">
              <div class="news-card-title">{{ n.title }}</div>
              <div v-if="n.summary" class="news-card-summary">{{ n.summary }}</div>
              <div class="news-card-meta">
                <span class="cat-chip" :class="categoryClass(n.category)">{{ n.category }}</span>
                <span class="news-source">{{ n.source }}</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- 添加格言 -->
    <AppModal v-model="quoteVisible" title="添加每日格言" width="480px">
      <div class="field">
        <label class="field-label">格言内容<span class="req">*</span></label>
        <textarea v-model="quoteInput" class="textarea" placeholder="例如：学而不思则罔，思而不学则殆。" />
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="quoteVisible = false">取消</button>
        <button class="btn btn-primary" @click="addQuote">保存</button>
      </template>
    </AppModal>

    <!-- 添加待办 -->
    <AppModal v-model="todoVisible" title="添加今日待办" width="480px">
      <div class="field">
        <label class="field-label">待办内容<span class="req">*</span></label>
        <textarea v-model="todoForm.content" class="textarea" placeholder="请输入待办事项" />
      </div>
      <div class="field mt-14">
        <label class="field-label">最迟时间<span class="req">*</span></label>
        <input v-model="todoForm.deadline" type="datetime-local" class="input" />
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="todoVisible = false">取消</button>
        <button class="btn btn-primary" @click="addTodo">保存</button>
      </template>
    </AppModal>

    <!-- 添加考试 -->
    <AppModal v-model="examVisible" title="添加考试" width="480px">
      <div class="field">
        <label class="field-label">考试名称<span class="req">*</span></label>
        <input v-model="examForm.name" class="input" placeholder="例如：期中考试" />
      </div>
      <div class="field mt-14">
        <label class="field-label">考试日期<span class="req">*</span></label>
        <input v-model="examForm.exam_date" type="date" class="input" />
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="examVisible = false">取消</button>
        <button class="btn btn-primary" @click="addExam">保存</button>
      </template>
    </AppModal>
  </div>
</template>
