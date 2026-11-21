/**
 * 后端 API 封装
 * 统一响应约定：{ code: 0, message, data }；非 0 自动弹提示并 reject。
 */
import axios from 'axios';
import { toast } from '../store/toast.js';

const http = axios.create({ baseURL: '/api', timeout: 90000 });

http.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') return response;
    const body = response.data;
    if (body && body.code === 0) return body.data;
    const message = body?.message || '请求失败';
    toast(message, 'error');
    return Promise.reject(new Error(message));
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络异常，请检查服务是否启动';
    toast(message, 'error');
    return Promise.reject(new Error(message));
  },
);

export const api = {
  // 字典与健康检查
  meta: () => http.get('/meta'),
  health: () => http.get('/health'),

  // 班级
  classes: () => http.get('/classes'),
  createClass: (data) => http.post('/classes', data),
  updateClass: (id, data) => http.put(`/classes/${id}`, data),
  deleteClass: (id) => http.delete(`/classes/${id}`),

  // 学生
  students: (classId) => http.get('/students', { params: { classId } }),
  createStudent: (data) => http.post('/students', data),
  updateStudent: (id, data) => http.put(`/students/${id}`, data),
  deleteStudent: (id) => http.delete(`/students/${id}`),

  // 首页概览
  summary: () => http.get('/dashboard/summary'),
  quotes: () => http.get('/dashboard/quotes'),
  createQuote: (data) => http.post('/dashboard/quotes', data),
  deleteQuote: (id) => http.delete(`/dashboard/quotes/${id}`),
  todos: () => http.get('/dashboard/todos'),
  createTodo: (data) => http.post('/dashboard/todos', data),
  updateTodo: (id, data) => http.put(`/dashboard/todos/${id}`, data),
  deleteTodo: (id) => http.delete(`/dashboard/todos/${id}`),
  exams: () => http.get('/dashboard/exams'),
  createExam: (data) => http.post('/dashboard/exams', data),
  updateExam: (id, data) => http.put(`/dashboard/exams/${id}`, data),
  deleteExam: (id) => http.delete(`/dashboard/exams/${id}`),

  // 课表
  schedule: (classId) => http.get('/schedule', { params: { classId } }),
  saveSchedule: (classId, cells) => http.post('/schedule', { classId, cells }),

  // 积分
  ranking: (classId) => http.get('/points/ranking', { params: { classId } }),
  pointsHistory: (studentId) => http.get('/points/history', { params: { studentId } }),
  addPoints: (data) => http.post('/points', data),

  // 成绩
  grades: (classId, examName) => http.get('/grades', { params: { classId, examName } }),
  examNames: (classId) => http.get('/grades/exam-names', { params: { classId } }),
  importGrades: (data) => http.post('/grades/batch', data),

  // 时政热点
  news: () => http.get('/news'),

  // 文件导入（上传解析）
  importStudents: (formData) => http.post('/import/students', formData),
  importGradesParse: (formData) => http.post('/import/grades', formData),
};

/**
 * 下载导入模板文件（.xlsx）
 * @param {'students'|'grades'|'grades-long'} type
 */
export async function downloadTemplate(type = 'students') {
  const response = await http.get('/import/template', { params: { type }, responseType: 'blob' });
  const blob = response.data;
  let filename = type === 'grades' ? '成绩导入模板.xlsx' : type === 'grades-long' ? '成绩导入模板-长表.xlsx' : '学生名单导入模板.xlsx';
  const disposition = response.headers?.['content-disposition'] || '';
  const match = /filename\*?=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (match) filename = decodeURIComponent(match[1].replace(/"/g, ''));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
