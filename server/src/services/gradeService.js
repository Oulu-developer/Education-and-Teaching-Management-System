/**
 * 学生成绩服务：成绩按「学生 × 科目 × 考试」存储，按总分自动排序
 */
import { from, run } from '../config/db.js';
import { AppError } from '../utils/response.js';
import { toNumber } from '../utils/helpers.js';

const round1 = (n) => Math.round(n * 10) / 10;

/** 成绩列表：按班级聚合，每名学生展示各科成绩与总分，按总分降序 */
export async function listGrades(classId, examName) {
  const cid = Number(classId);
  if (!cid) throw new AppError('请选择班级');
  const students = await run(from('student').select('*').eq('class_id', cid), '查询学生失败');
  const rows = await run(from('grade').select('*').eq('class_id', cid), '查询成绩失败');

  const gradeMap = {};
  (rows || []).forEach((g) => {
    if (examName && g.exam_name !== examName) return;
    if (!gradeMap[g.student_id]) gradeMap[g.student_id] = { subjects: [], total: 0 };
    gradeMap[g.student_id].subjects.push(g);
    gradeMap[g.student_id].total += toNumber(g.score);
  });

  return (students || [])
    .map((s) => {
      const info = gradeMap[s.id] || { subjects: [], total: 0 };
      return { student: s, subjects: info.subjects, total: round1(info.total) };
    })
    .sort((a, b) => b.total - a.total);
}

/** 考试名称列表（供成绩页筛选）：预定义考试类型 + 该班已有成绩名称，合并去重 */
export async function listExamNames(classId) {
  const rows = await run(
    from('grade').select('exam_name').eq('class_id', Number(classId)),
    '查询考试失败',
  );
  const names = new Set((rows || []).map((r) => r.exam_name).filter(Boolean));
  const types = await run(from('exam_type').select('name'), '查询考试类型失败');
  (types || []).forEach((t) => { if (t.name) names.add(t.name); });
  return [...names];
}

/** 预定义考试类型列表（教师可增删） */
export async function listExamTypes() {
  const rows = await run(
    from('exam_type').select('*').order('id', { ascending: true }),
    '查询考试类型失败',
  );
  return rows || [];
}

/** 新增考试类型（预定义名称） */
export async function createExamType(name) {
  const n = String(name ?? '').trim();
  if (!n) throw new AppError('考试类型名称不能为空');
  const data = await run(
    from('exam_type').insert({ name: n }).select().single(),
    '新增考试类型失败',
  );
  return data;
}

/** 删除考试类型，并同步清理该名称下的成绩记录 */
export async function deleteExamType(name) {
  const n = String(name ?? '').trim();
  if (!n) throw new AppError('考试类型名称不能为空');
  await run(from('grade').delete().eq('exam_name', n), '清理关联成绩失败');
  await run(from('exam_type').delete().eq('name', n).select('id'), '删除考试类型失败');
  return { name: n };
}

/** 批量导入成绩：按学生姓名匹配班级学生，覆盖式导入某次考试 */
export async function batchCreateGrades(classId, examName, rows) {
  const cid = Number(classId);
  if (!cid) throw new AppError('请选择班级');
  const students = await run(from('student').select('*').eq('class_id', cid), '查询学生失败');
  const nameMap = {};
  (students || []).forEach((s) => { nameMap[s.name] = s; });

  const payloads = [];
  const errors = [];
  (rows || []).forEach((row, index) => {
    const studentName = String(row?.studentName ?? '').trim();
    const subject = String(row?.subject ?? '').trim();
    const score = toNumber(row?.score, NaN);
    if (!studentName || !subject) return;
    const student = nameMap[studentName];
    if (!student) {
      errors.push(`第 ${index + 1} 行：学生「${studentName}」不在该班级，已跳过`);
      return;
    }
    if (!Number.isFinite(score)) {
      errors.push(`第 ${index + 1} 行：${subject} 分数格式不正确，已跳过`);
      return;
    }
    payloads.push({
      student_id: student.id,
      class_id: cid,
      exam_name: examName || '',
      subject,
      score,
    });
  });

  if (!payloads.length) throw new AppError('没有可导入的成绩（学生姓名需与班级学生一致）');
  // 覆盖式导入：先清空该班该次考试旧成绩，再写入
  await run(
    from('grade').delete().eq('class_id', cid).eq('exam_name', examName || ''),
    '清理旧成绩失败',
  );
  const data = await run(from('grade').insert(payloads).select('id'), '导入成绩失败');
  return { count: (data || []).length, errors };
}

/** 删除单条成绩记录 */
export async function deleteGrade(id) {
  const data = await run(from('grade').delete().eq('id', Number(id)).select('id'), '删除成绩失败');
  if (!data || data.length === 0) throw new AppError('成绩记录不存在', 404);
  return { id: Number(id) };
}
