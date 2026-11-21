/**
 * 路由：采用 hash 模式，便于作为子模块嵌入已有教学管理系统而无需额外配置 rewrite 规则。
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Schedule from '../views/Schedule.vue';
import RollCall from '../views/RollCall.vue';
import Grades from '../views/Grades.vue';
import SmartExam from '../views/SmartExam.vue';
import Students from '../views/Students.vue';
import Points from '../views/Points.vue';

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'home', component: Home, meta: { title: '首页概览' } },
  { path: '/schedule', name: 'schedule', component: Schedule, meta: { title: '课表安排' } },
  { path: '/rollcall', name: 'rollcall', component: RollCall, meta: { title: '随机点名' } },
  { path: '/grades', name: 'grades', component: Grades, meta: { title: '学生成绩' } },
  { path: '/exam', name: 'exam', component: SmartExam, meta: { title: '智能组卷' } },
  { path: '/students', name: 'students', component: Students, meta: { title: '学生信息' } },
  { path: '/points', name: 'points', component: Points, meta: { title: '荣誉积分' } },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});
