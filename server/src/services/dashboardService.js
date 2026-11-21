/**
 * 首页概览服务：每日格言、今日待办、考试倒计时，及首页聚合数据
 */
import { from, run } from '../config/db.js';
import { AppError } from '../utils/response.js';
import { daysUntil, todayStr } from '../utils/helpers.js';

/* ---------------- 每日格言 ---------------- */

export async function listQuotes() {
  return run(
    from('quote').select('*').eq('enabled', true).order('id', { ascending: false }),
    '查询格言失败',
  ) || [];
}

export async function createQuote(raw) {
  const content = String(raw?.content ?? '').trim();
  if (!content) throw new AppError('格言内容不能为空');
  return run(from('quote').insert({ content, enabled: true }).select().single(), '新增格言失败');
}

export async function deleteQuote(id) {
  const data = await run(from('quote').delete().eq('id', Number(id)).select('id'), '删除格言失败');
  if (!data || data.length === 0) throw new AppError('格言不存在', 404);
  return { id: Number(id) };
}

/* ---------------- 今日待办 ---------------- */

export async function listTodos() {
  return run(
    from('todo').select('*').order('id', { ascending: false }),
    '查询待办失败',
  ) || [];
}

export async function createTodo(raw) {
  const content = String(raw?.content ?? '').trim();
  const deadline = String(raw?.deadline ?? '').trim();
  if (!content) throw new AppError('待办内容不能为空');
  if (!deadline) throw new AppError('请设置待办最迟时间');
  return run(from('todo').insert({ content, deadline, done: false }).select().single(), '新增待办失败');
}

export async function updateTodo(id, raw) {
  const payload = {};
  if (raw?.content !== undefined) payload.content = String(raw.content).trim();
  if (raw?.deadline !== undefined) payload.deadline = String(raw.deadline).trim();
  if (raw?.done !== undefined) payload.done = Boolean(raw.done);
  const data = await run(
    from('todo').update(payload).eq('id', Number(id)).select().maybeSingle(),
    '更新待办失败',
  );
  if (!data) throw new AppError('待办不存在', 404);
  return data;
}

export async function deleteTodo(id) {
  const data = await run(from('todo').delete().eq('id', Number(id)).select('id'), '删除待办失败');
  if (!data || data.length === 0) throw new AppError('待办不存在', 404);
  return { id: Number(id) };
}

/* ---------------- 考试倒计时 ---------------- */

export async function listExams() {
  const data = await run(
    from('exam').select('*').order('exam_date', { ascending: true }),
    '查询考试失败',
  );
  return (data || []).map((e) => ({ ...e, daysLeft: daysUntil(e.exam_date) }));
}

export async function createExam(raw) {
  const name = String(raw?.name ?? '').trim();
  const examDate = String(raw?.exam_date ?? '').trim();
  if (!name) throw new AppError('考试名称不能为空');
  if (!examDate) throw new AppError('请设置考试日期');
  return run(from('exam').insert({ name, exam_date: examDate }).select().single(), '新增考试失败');
}

export async function updateExam(id, raw) {
  const name = String(raw?.name ?? '').trim();
  const examDate = String(raw?.exam_date ?? '').trim();
  if (!name) throw new AppError('考试名称不能为空');
  if (!examDate) throw new AppError('请设置考试日期');
  const data = await run(
    from('exam').update({ name, exam_date: examDate }).eq('id', Number(id)).select().maybeSingle(),
    '更新考试失败',
  );
  if (!data) throw new AppError('考试不存在', 404);
  return data;
}

export async function deleteExam(id) {
  const data = await run(from('exam').delete().eq('id', Number(id)).select('id'), '删除考试失败');
  if (!data || data.length === 0) throw new AppError('考试不存在', 404);
  return { id: Number(id) };
}

/* ---------------- 首页聚合 ---------------- */

/**
 * 首页汇总：一条格言、未完成待办（标注是否已到期）、考试倒计时、学生总数、班级数。
 * 今日时政热点由前端单独调 /api/news 获取（后端懒加载抓取）。
 */
export async function summary() {
  const quotes = await listQuotes();
  const todos = await listTodos();
  const exams = await listExams();
  const students = await run(from('student').select('id'), '统计学生失败');
  const classes = await run(from('class').select('id'), '统计班级失败');

  const now = todayStr();
  const todoList = todos.map((t) => ({
    ...t,
    overdue: !t.done && t.deadline && String(t.deadline).slice(0, 10) < now,
  }));
  const unfinished = todoList.filter((t) => !t.done);

  return {
    quote: quotes[0]?.content || '',
    todos: todoList,
    unfinishedCount: unfinished.length,
    exams,
    totalStudents: (students || []).length,
    classCount: (classes || []).length,
  };
}
