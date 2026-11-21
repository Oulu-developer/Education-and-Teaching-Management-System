<script setup>
/**
 * 首页概览：每日格言、今日待办（未完成提醒）、时政热点、考试倒计时、班级总人数
 */
import { ref, onMounted } from 'vue';
import { api } from '../api/index.js';
import AppModal from '../components/AppModal.vue';

const summary = ref({ todos: [], exams: [], unfinishedCount: 0, totalStudents: 0, classCount: 0, quote: '' });
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

/* 格言 */
async function addQuote() {
  if (!quoteInput.value.trim()) return;
  await api.createQuote({ content: quoteInput.value });
  quoteInput.value = '';
  quoteVisible.value = false;
  load();
}

/* 待办 */
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

/* 考试 */
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

function daysText(d) {
  if (d === null || d === undefined) return '—';
  if (d > 0) return `${d} 天`;
  if (d === 0) return '今天';
  return `已过 ${-d} 天`;
}
function fmtDeadline(str) {
  return String(str || '').replace('T', ' ').slice(0, 16);
}
</script>

<template>
  <div>
    <!-- 统计块 -->
    <div class="stat-grid">
      <div class="stat"><div class="stat-value">{{ summary.classCount }}</div><div class="stat-label">班级数量</div></div>
      <div class="stat"><div class="stat-value">{{ summary.totalStudents }}</div><div class="stat-label">班级总人数</div></div>
      <div class="stat"><div class="stat-value" :style="{ color: summary.unfinishedCount ? '#d97706' : '' }">{{ summary.unfinishedCount }}</div><div class="stat-label">未完成待办</div></div>
      <div class="stat"><div class="stat-value">{{ summary.exams.length }}</div><div class="stat-label">考试安排</div></div>
    </div>

    <!-- 每日格言 -->
    <div class="card mt-18">
      <div class="card-head">
        <div class="card-title">每日格言</div>
        <button class="btn btn-soft btn-sm" @click="quoteVisible = true">＋ 添加格言</button>
      </div>
      <div class="card-body">
        <div v-if="summary.quote" class="quote-box">{{ summary.quote }}</div>
        <div v-else class="hint">暂无格言，点击右上角添加。</div>
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

      <!-- 考试倒计时 -->
      <div class="card" style="margin-bottom:0">
        <div class="card-head">
          <div class="card-title">考试倒计时</div>
          <button class="btn btn-soft btn-sm" @click="examVisible = true">＋ 添加考试</button>
        </div>
        <div class="card-body">
          <div v-if="summary.exams.length === 0" class="hint">暂无考试安排。</div>
          <div v-for="e in summary.exams" :key="e.id" class="todo-item">
            <div class="todo-content">
              <div>{{ e.name }}</div>
              <div class="hint">{{ e.exam_date }}</div>
            </div>
            <span class="tag" :class="e.daysLeft > 0 ? 'tag-blue' : 'tag-red'">{{ daysText(e.daysLeft) }}</span>
            <button class="btn-link danger" @click="removeExam(e.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 时政热点 -->
    <div class="card mt-18">
      <div class="card-head">
        <div class="card-title">今日时政热点</div>
        <span class="hint">每日 6 点更新</span>
      </div>
      <div class="card-body">
        <div v-if="news.length === 0" class="hint">今日暂无热点更新。</div>
        <div v-for="(n, i) in news" :key="n.id" class="news-item">
          <div class="news-index">{{ i + 1 }}</div>
          <div>
            <a v-if="n.url" :href="n.url" target="_blank" class="news-title">{{ n.title }}</a>
            <div v-else class="news-title">{{ n.title }}</div>
            <div class="news-source">{{ n.source }}</div>
          </div>
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
